import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_CONFIG,
  DEMO_NOW,
  evaluateAlerts,
  evaluateInventory,
  formatTime,
  getLatestScan,
  getReadiness,
  minutesUntil,
  statusLabel,
  type Activity,
  type Alert,
  type BagState,
  type InventoryState,
  type Item,
  type Scan,
  type SensorEvent,
  type SensorStatus,
  type TagObservation,
  type TravelEstimate,
} from './domain'
import { createFallbackCarryProfile, type CarryProfileApiResponse, type CarryProfileContext } from './carryProfile'
import { ACTIVITY_TYPE_LABELS, ACTIVITIES, DEFAULT_PRESENT_TAG_IDS, DEFAULT_SIGNAL_STRENGTHS, ITEMS } from './demoData'
import { SimulatedRFIDReader } from './simulator'
import { SimulatedTravelTimeProvider } from './travel'

type TraceEntry = SensorEvent & { id: number }
type ReadMode = 'strong' | 'weak' | 'intermittent' | 'outside'

function cloneActivities(): Activity[] {
  return ACTIVITIES.map((activity) => ({
    ...activity,
    requiredItemIds: [...activity.requiredItemIds],
    optionalItemIds: [...activity.optionalItemIds],
    destination: { ...activity.destination },
  }))
}

function getMode(state: { signalStrength: number; intermittent: boolean; outside: boolean }): ReadMode {
  if (state.outside) return 'outside'
  if (state.intermittent) return 'intermittent'
  if (state.signalStrength < -65) return 'weak'
  return 'strong'
}

function modeLabel(mode: ReadMode): string {
  return {
    strong: 'Strong signal',
    weak: 'Weak signal',
    intermittent: 'Intermittent',
    outside: 'Outside bag',
  }[mode]
}

function shortDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function scanLabel(scan: Scan | undefined): string {
  if (!scan) return 'No scans yet'
  if (scan.status === 'failed') return 'Last scan failed'
  return `Scanned ${formatTime(scan.completedAt ?? scan.startedAt)}`
}

function statusClass(status: InventoryState['status']): string {
  return status.replaceAll('-', ' ')
}

function alertTypeLabel(alert: Alert): string {
  return alert.type === 'missing-item' ? 'Missing item' : 'Needs a closer look'
}

interface AIProfileGeneratorProps {
  activeActivity: Activity
  onApprove: (response: CarryProfileApiResponse) => void
  onTrace: (detail: string, type?: SensorEvent['type']) => void
}

function defaultCarryProfileContext(activity: Activity): CarryProfileContext {
  return {
    eventName: activity.name,
    eventType: ACTIVITY_TYPE_LABELS[activity.type],
    destination: activity.destination.name,
    notes: `${activity.destination.name}; starts at ${formatTime(activity.startTime)}. Build a cautious checklist from registered items only.`,
  }
}

function isCarryProfileApiResponse(value: unknown): value is CarryProfileApiResponse {
  if (typeof value !== 'object' || value === null) return false
  const response = value as Record<string, unknown>
  const profile = response.profile as Record<string, unknown> | undefined
  return (response.mode === 'ai' || response.mode === 'fallback') &&
    response.approved === false &&
    typeof response.requestId === 'string' &&
    typeof response.note === 'string' &&
    typeof profile?.summary === 'string' &&
    Array.isArray(profile.requiredItems) &&
    Array.isArray(profile.optionalItems) &&
    Array.isArray(profile.unregisteredSuggestions)
}

function AIProfileGenerator({ activeActivity, onApprove, onTrace }: AIProfileGeneratorProps) {
  const [context, setContext] = useState<CarryProfileContext>(() => defaultCarryProfileContext(activeActivity))
  const [result, setResult] = useState<CarryProfileApiResponse>()
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState('')
  const [approvedRequestId, setApprovedRequestId] = useState('')

  useEffect(() => {
    setContext(defaultCarryProfileContext(activeActivity))
    setResult(undefined)
    setMessage('')
    setApprovedRequestId('')
  }, [activeActivity.id])

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsGenerating(true)
    setMessage('')
    setApprovedRequestId('')
    try {
      const response = await fetch('/api/carry-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      })
      if (!response.ok) throw new Error('Carry profile endpoint unavailable.')
      const payload: unknown = await response.json()
      if (!isCarryProfileApiResponse(payload)) throw new Error('Carry profile response failed client validation.')
      setResult(payload)
      onTrace(`${payload.mode === 'ai' ? 'Model' : 'Fallback'} carry profile returned; approval is still required.`)
    } catch {
      const fallback: CarryProfileApiResponse = {
        requestId: globalThis.crypto?.randomUUID?.() ?? 'client-fallback',
        mode: 'fallback',
        approved: false,
        provider: 'deterministic-fallback',
        profile: createFallbackCarryProfile(context, ITEMS),
        note: 'Fallback profile: endpoint unavailable. Approval is still required before the checklist changes.',
      }
      setResult(fallback)
      setMessage('The model endpoint was unavailable, so Carry prepared a deterministic fallback.')
      onTrace('Carry profile endpoint unavailable; deterministic fallback shown for review.', 'scan-failed')
    } finally {
      setIsGenerating(false)
    }
  }

  function handleApprove() {
    if (!result) return
    setApprovedRequestId(result.requestId)
    onApprove(result)
  }

  return (
    <section className="card ai-profile-card" aria-labelledby="ai-profile-title">
      <div className="card-header compact">
        <div>
          <div className="eyebrow">AI carry profile</div>
          <h2 id="ai-profile-title">Draft a context-aware checklist</h2>
        </div>
        <span className="ai-boundary-chip">approval gate</span>
      </div>
      <p className="ai-intro">Carry asks a server-side model to map the event to registered items. Suggestions never affect readiness until you approve them.</p>
      <form className="ai-profile-form" onSubmit={handleGenerate}>
        <label><span>Event name</span><input value={context.eventName} maxLength={180} onChange={(event) => setContext({ ...context, eventName: event.target.value })} required /></label>
        <label><span>Type</span><input value={context.eventType} maxLength={180} onChange={(event) => setContext({ ...context, eventType: event.target.value })} required /></label>
        <label><span>Destination</span><input value={context.destination} maxLength={180} onChange={(event) => setContext({ ...context, destination: event.target.value })} required /></label>
        <label className="wide-field"><span>Notes</span><textarea value={context.notes} maxLength={180} rows={2} onChange={(event) => setContext({ ...context, notes: event.target.value })} required /></label>
        <button className="primary-button" type="submit" disabled={isGenerating}>{isGenerating ? 'Drafting profile…' : 'Generate carry profile'} <span>↗</span></button>
      </form>
      {message && <p className="ai-message" role="status">{message}</p>}
      {result && <div className="ai-result" aria-live="polite">
        <div className="ai-result-header"><span className={`ai-mode ${result.mode}`}>{result.mode === 'ai' ? 'Model-powered draft' : 'Deterministic fallback'}</span><span className="approval-label">{approvedRequestId ? 'Approved' : 'Awaiting approval'}</span></div>
        <p className="ai-summary">{result.profile.summary}</p>
        <div className="ai-suggestion-grid">
          <div><span className="mini-label">Required suggestions</span>{result.profile.requiredItems.length ? result.profile.requiredItems.map((suggestion) => <div className="ai-suggestion" key={suggestion.itemId}><strong>{ITEMS.find((item) => item.id === suggestion.itemId)?.name ?? suggestion.itemId}</strong><span>{Math.round(suggestion.confidence * 100)}% · {suggestion.reason}</span></div>) : <p className="ai-empty">No registered hard requirements found.</p>}</div>
          <div><span className="mini-label">Optional context</span>{result.profile.optionalItems.length ? result.profile.optionalItems.map((suggestion) => <div className="ai-suggestion" key={suggestion.itemId}><strong>{ITEMS.find((item) => item.id === suggestion.itemId)?.name ?? suggestion.itemId}</strong><span>{Math.round(suggestion.confidence * 100)}% · {suggestion.reason}</span></div>) : <p className="ai-empty">No optional registered items.</p>}</div>
        </div>
        <div className="ai-unknown-block"><span className="mini-label">Unregistered ideas stay outside readiness</span>{result.profile.unregisteredSuggestions.length ? result.profile.unregisteredSuggestions.map((suggestion) => <div className="ai-unknown" key={suggestion.name}><strong>{suggestion.name}</strong><span>{suggestion.category} · {suggestion.reason}</span></div>) : <p className="ai-empty">No unregistered ideas returned.</p>}</div>
        <p className="ai-note">{result.note}</p>
        {!approvedRequestId && <button className="secondary-button" type="button" onClick={handleApprove}>Approve profile for {activeActivity.name}</button>}
      </div>}
    </section>
  )
}

function LandingDemoSequence() {
  const readerRef = useRef<SimulatedRFIDReader>()
  if (!readerRef.current) {
    readerRef.current = new SimulatedRFIDReader(ITEMS, {
      presentTagIds: DEFAULT_PRESENT_TAG_IDS,
      signalStrengthByTag: DEFAULT_SIGNAL_STRENGTHS,
      scanDelayMs: 0,
    })
  }
  const reader = readerRef.current
  const [stage, setStage] = useState<'idle' | 'missing' | 'ready'>('idle')
  const [isScanning, setIsScanning] = useState(false)
  const [inventory, setInventory] = useState<InventoryState[]>(() => evaluateInventory(ITEMS, [], [], { now: DEMO_NOW, bagState: 'open' }))
  const [latestScan, setLatestScan] = useState<Scan>()
  const [scanMessage, setScanMessage] = useState('The starting scenario has a missing calculator.')

  const readiness = getReadiness(ACTIVITIES[0], inventory, latestScan, 'connected', { now: DEMO_NOW, config: DEFAULT_CONFIG })

  async function runScenarioScan() {
    if (isScanning) return
    setIsScanning(true)
    if (stage === 'missing') reader.setTagPresence('TAG-CALC-001', true)
    const result = await reader.scan({ scanId: `landing-scan-${stage === 'missing' ? '2' : '1'}`, startedAt: DEMO_NOW, bagState: 'closed' })
    const nextInventory = evaluateInventory(ITEMS, [result.scan], result.observations, { now: DEMO_NOW, bagState: 'scan-complete', config: DEFAULT_CONFIG })
    const nextReadiness = getReadiness(ACTIVITIES[0], nextInventory, result.scan, 'connected', { now: DEMO_NOW, config: DEFAULT_CONFIG })
    setLatestScan(result.scan)
    setInventory(nextInventory)
    setStage(nextReadiness.state === 'ready' ? 'ready' : 'missing')
    setScanMessage(nextReadiness.state === 'ready' ? 'Fresh evidence confirms every Calculus II requirement.' : 'The scan found a requirement absent from the closed-bag snapshot.')
    setIsScanning(false)
  }

  return (
    <section className="landing-demo" aria-labelledby="landing-demo-title">
      <div className="landing-demo-heading">
        <div><span className="section-number">01 / Try the decision loop</span><h2 id="landing-demo-title">See the belief change.</h2></div>
        <span className="demo-disclosure">Real deterministic engine · simulated RFID</span>
      </div>
      <div className="landing-demo-grid">
        <div className="landing-demo-story">
          <span className="eyebrow">Calculus II · 9:00 AM</span>
          <h3>{stage === 'ready' ? 'Ready to leave.' : stage === 'missing' ? 'One thing needs your attention.' : 'Start with a closed-bag scan.'}</h3>
          <p>{scanMessage}</p>
          <div className="landing-demo-path"><span className={stage !== 'idle' ? 'complete' : ''}>Scan</span><i>→</i><span className={stage === 'ready' ? 'complete' : ''}>Reason</span><i>→</i><span className={stage === 'ready' ? 'complete' : ''}>Act</span></div>
          <button className="primary-button landing-demo-button" type="button" onClick={runScenarioScan} disabled={isScanning || stage === 'ready'}>{isScanning ? 'Reading tags…' : stage === 'missing' ? 'Add calculator & rescan' : stage === 'ready' ? 'Evidence confirmed' : 'Close bag & scan'} <span>↗</span></button>
          {latestScan && <small className="landing-demo-scan">{latestScan.id} · {readiness.label} · {latestScan.readsEvaluated ?? 0} reads evaluated</small>}
        </div>
        <div className="landing-demo-panel">
          <div className="mini-panel-top"><span>Carry’s belief</span><span className={`mini-readiness ${readiness.state}`}>{readiness.label}</span></div>
          <div className="mini-inventory-list">{ACTIVITIES[0].requiredItemIds.map((itemId) => { const item = ITEMS.find((candidate) => candidate.id === itemId); const state = inventory.find((candidate) => candidate.itemId === itemId); return <div className="mini-inventory-row" key={itemId}><span>{item?.icon}</span><strong>{item?.name}</strong><small>{state ? statusLabel(state.status) : 'Unknown'}</small></div> })}</div>
          <div className="mini-panel-note"><strong>Why this matters</strong><span>Readiness is earned by fresh sensor evidence, not by an AI guess.</span></div>
        </div>
      </div>
    </section>
  )
}

interface LandingPageProps {
  onOpenDemo: () => void
}

function LandingPage({ onOpenDemo }: LandingPageProps) {
  const [landingProfileApproved, setLandingProfileApproved] = useState(false)

  return (
    <div className="landing-shell">
      <header className="landing-nav">
        <a className="landing-brand" href="/" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><span className="brand-mark">C</span><span><strong>Carry</strong><small>context-aware carry system</small></span></a>
        <nav aria-label="Landing page navigation"><a href="#how">How it works</a><a href="#boundaries">Boundaries</a><button className="secondary-button small" type="button" onClick={onOpenDemo}>Open full demo ↗</button></nav>
      </header>
      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="landing-kicker"><span className="live-dot" /> Software-first backpack intelligence</span>
            <h1>Carry less <em>uncertainty.</em></h1>
            <p className="landing-hero-lede">Carry turns the next thing that matters into a calm, evidence-backed plan for what belongs in your bag.</p>
            <div className="landing-hero-actions"><button className="primary-button" type="button" onClick={onOpenDemo}>Explore the live demo <span>↗</span></button><a className="text-button landing-text-link" href="#how">See how the loop works ↓</a></div>
            <div className="landing-proof-line"><span>context</span><i>→</i><span>inventory belief</span><i>→</i><span>leave-by</span><i>→</i><span>action</span></div>
          </div>
          <div className="landing-hero-art" aria-label="Carry decision pipeline preview">
            <div className="hero-art-orbit orbit-one" /><div className="hero-art-orbit orbit-two" />
            <div className="hero-bag-card"><div className="hero-bag-icon">◒</div><span className="mini-label">Current carry</span><strong>Calculus II</strong><small>Science Building · 9:00 AM</small><div className="hero-bag-status"><span className="live-dot" /> 3 / 4 confirmed</div></div>
            <div className="hero-floating-card hero-alert-float"><span>!</span><div><strong>Calculator</strong><small>needs a closer look</small></div></div>
            <div className="hero-floating-card hero-time-float"><span>↗</span><div><strong>Leave by 8:35 AM</strong><small>18 min travel · 7 min buffer</small></div></div>
          </div>
        </section>

        <LandingDemoSequence />

        <section className="landing-ai-section" aria-labelledby="landing-ai-title">
          <div className="landing-section-copy"><span className="section-number">02 / Use the model where it helps</span><h2 id="landing-ai-title">A thoughtful first draft. A human-owned decision.</h2><p>Describe a new commitment and Carry asks a server-side model to suggest a profile from the registered inventory. It can surface an unregistered idea, but only your approval can change the checklist—and only a fresh scan can change readiness.</p><div className="boundary-list"><span><b>01</b> Model suggests</span><span><b>02</b> You approve</span><span><b>03</b> Sensor evidence decides</span></div>{landingProfileApproved && <p className="approval-confirmation" role="status">Profile approved for this preview. The full demo applies it to the selected activity.</p>}</div>
          <AIProfileGenerator activeActivity={ACTIVITIES[0]} onApprove={() => setLandingProfileApproved(true)} onTrace={() => undefined} />
        </section>

        <section className="landing-how" id="how" aria-labelledby="how-title"><div className="landing-section-heading"><span className="section-number">03 / The product loop</span><h2 id="how-title">A backpack that remembers the next commitment.</h2></div><div className="how-grid"><article><span className="how-index">01</span><h3>Set the context</h3><p>Carry starts from an activity, destination, and time—not a generic packing list.</p></article><article><span className="how-index">02</span><h3>Scan the bag</h3><p>A hardware-neutral RFID interface turns simulated reads into confidence-aware inventory states.</p></article><article><span className="how-index">03</span><h3>Act on evidence</h3><p>One explainable alert points to the item, the scan, the leave-by time, and the next action.</p></article></div></section>

        <section className="landing-boundaries" id="boundaries" aria-labelledby="boundaries-title"><div><span className="section-number">04 / Honest boundaries</span><h2 id="boundaries-title">Useful now. Clear about what is next.</h2></div><div className="boundary-grid"><div><strong>Simulated reader</strong><span>RFID observations are simulated; no physical reader has been validated.</span></div><div><strong>Deterministic readiness</strong><span>AI can draft a checklist, but never marks the bag ready.</span></div><div><strong>Provider boundary</strong><span>Travel is simulated today; maps and calendar integrations remain future work.</span></div></div></section>
      </main>
      <footer className="landing-footer"><span><span className="footer-brand-mark">C</span> Carry · software-first prototype</span><span>Built for the Era World AI Engineer challenge</span><button className="primary-button small" type="button" onClick={onOpenDemo}>Open full demo ↗</button></footer>
    </div>
  )
}

export default function App() {
  const [route, setRoute] = useState(() => window.location.pathname === '/demo' ? 'demo' : 'landing')

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname === '/demo' ? 'demo' : 'landing')
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(path: '/demo' | '/') {
    window.history.pushState({}, '', path)
    setRoute(path === '/demo' ? 'demo' : 'landing')
  }

  return route === 'demo'
    ? <CarryDashboard onBackToLanding={() => navigate('/')} />
    : <LandingPage onOpenDemo={() => navigate('/demo')} />
}

interface CarryDashboardProps {
  onBackToLanding?: () => void
}

function CarryDashboard({ onBackToLanding }: CarryDashboardProps) {
  const readerRef = useRef<SimulatedRFIDReader>()
  if (!readerRef.current) {
    readerRef.current = new SimulatedRFIDReader(ITEMS, {
      presentTagIds: DEFAULT_PRESENT_TAG_IDS,
      signalStrengthByTag: DEFAULT_SIGNAL_STRENGTHS,
    })
  }
  const reader = readerRef.current

  const [activities, setActivities] = useState<Activity[]>(cloneActivities)
  const [activeActivityId, setActiveActivityId] = useState(ACTIVITIES[0].id)
  const [bagState, setBagState] = useState<BagState>('open')
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>('connected')
  const [scans, setScans] = useState<Scan[]>([])
  const [observations, setObservations] = useState<TagObservation[]>([])
  const [inventory, setInventory] = useState<InventoryState[]>(() =>
    evaluateInventory(ITEMS, [], [], { now: DEMO_NOW, bagState: 'open' }),
  )
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [lastBagOpenedAt, setLastBagOpenedAt] = useState<string | undefined>()
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [selectedAlertId, setSelectedAlertId] = useState<string | undefined>()
  const [showTrace, setShowTrace] = useState(false)
  const [editingRequirements, setEditingRequirements] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [failNextScanArmed, setFailNextScanArmed] = useState(false)
  const [simulationVersion, setSimulationVersion] = useState(0)
  const [travelEstimate, setTravelEstimate] = useState<TravelEstimate>()
  const [travelEstimateActivityId, setTravelEstimateActivityId] = useState('')
  const [travelStatus, setTravelStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [browserNotificationState, setBrowserNotificationState] = useState<'unknown' | 'granted' | 'denied'>('unknown')
  const [notificationToast, setNotificationToast] = useState<{ alertId: string; message: string }>()
  const notifiedAlertIds = useRef(new Set<string>())
  const [trace, setTrace] = useState<TraceEntry[]>([
    {
      id: 1,
      type: 'reader-status',
      at: DEMO_NOW,
      detail: 'Simulated reader ready. Waiting for the first closed-bag scan.',
    },
  ])

  const activeActivity = activities.find((activity) => activity.id === activeActivityId) ?? activities[0]
  const latestScan = getLatestScan(scans)
  const activeTravelEstimate = travelEstimateActivityId === activeActivity.id ? travelEstimate : undefined
  const readiness = getReadiness(activeActivity, inventory, latestScan, sensorStatus, { now: DEMO_NOW, config: DEFAULT_CONFIG })
  const leaveBy = activeTravelEstimate?.leaveBy
  const requiredItems = activeActivity.requiredItemIds
    .map((itemId) => ITEMS.find((item) => item.id === itemId))
    .filter((item): item is Item => item !== undefined)
  const optionalItems = activeActivity.optionalItemIds
    .map((itemId) => ITEMS.find((item) => item.id === itemId))
    .filter((item): item is Item => item !== undefined)
  const activeAlerts = alerts.filter(
    (alert) => alert.activityId === activeActivity.id && ['active', 'acknowledged', 'suppressed'].includes(alert.status),
  )
  const resolvedAlerts = alerts.filter((alert) => alert.activityId === activeActivity.id && alert.status === 'resolved')
  const selectedItem = ITEMS.find((item) => item.id === selectedItemId) ?? ITEMS[0]
  const selectedItemState = inventory.find((state) => state.itemId === selectedItem.id)
  const selectedAlert = selectedAlertId ? alerts.find((alert) => alert.id === selectedAlertId) : undefined
  const selectedItemObservations = observations
    .filter((observation) => observation.itemId === selectedItem.id)
    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
  const minutesToLeave = leaveBy ? minutesUntil(leaveBy, DEMO_NOW) : undefined

  useEffect(() => {
    let cancelled = false
    setTravelStatus('loading')
    setTravelEstimate(undefined)
    setTravelEstimateActivityId('')
    const provider = new SimulatedTravelTimeProvider(activeActivity.travelMinutes, activeActivity.departureBufferMinutes)
    provider
      .getTravelEstimate({ name: 'Current backpack' }, activeActivity.destination, activeActivity.startTime)
      .then((estimate) => {
        if (cancelled) return
        setTravelEstimate(estimate)
        setTravelEstimateActivityId(activeActivity.id)
        setTravelStatus('ready')
        addTrace(`Simulated travel estimate loaded for ${activeActivity.name}: leave by ${formatTime(estimate.leaveBy)}.`)
      })
      .catch(() => {
        if (cancelled) return
        setTravelStatus('error')
        addTrace('Travel provider unavailable; Carry will not invent a leave-by time.', 'reader-status')
      })
    return () => {
      cancelled = true
    }
  }, [activeActivity.id])

  useEffect(() => {
    if (!activeTravelEstimate) return
    setAlerts((current) => evaluateAlerts(activeActivity, ITEMS, inventory, scans, current, {
      now: DEMO_NOW,
      config: DEFAULT_CONFIG,
      travelEstimate: activeTravelEstimate,
    }))
  }, [activeActivity.id, activeTravelEstimate?.leaveBy, inventory, scans])

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission !== 'default') {
      setBrowserNotificationState(Notification.permission === 'granted' ? 'granted' : 'denied')
    }
  }, [])

  useEffect(() => {
    if (!latestScan || latestScan.status !== 'completed' || !latestScan.completedAt || !activeTravelEstimate) return
    const fresh = new Date(DEMO_NOW).getTime() - new Date(latestScan.completedAt).getTime() <= DEFAULT_CONFIG.observationStaleMinutes * 60_000
    if (!fresh || readiness.state === 'scan-required' || readiness.state === 'sensor-unavailable') return
    for (const alert of activeAlerts) {
      if (alert.status !== 'active' || notifiedAlertIds.current.has(alert.id)) continue
      notifiedAlertIds.current.add(alert.id)
      const message = `${alert.evidence.itemName} needs attention before ${activeActivity.name}.`
      setNotificationToast({ alertId: alert.id, message })
      if (browserNotificationState === 'granted' && typeof Notification !== 'undefined') {
        new Notification('Carry needs your attention', { body: message, tag: alert.id })
      }
      addTrace(`Attention surfaced for ${alert.evidence.itemName}; in-app notification shown.`)
    }
  }, [activeAlerts, activeActivity.name, activeTravelEstimate, browserNotificationState, latestScan, readiness.state])

  useEffect(() => {
    const unsubscribe = reader.subscribeToEvents((event) => {
      setTrace((current) => [{ ...event, id: Date.now() }, ...current].slice(0, 18))
    })
    return unsubscribe
  }, [reader])

  function addTrace(detail: string, type: SensorEvent['type'] = 'reader-status') {
    setTrace((current) => [
      { id: Date.now(), type, at: DEMO_NOW, detail },
      ...current,
    ].slice(0, 18))
  }

  function recomputeInventory(
    nextScans: Scan[],
    nextObservations: TagObservation[],
    nextBagState: BagState,
    nextOpenedAt = lastBagOpenedAt,
  ): InventoryState[] {
    return evaluateInventory(ITEMS, nextScans, nextObservations, {
      now: DEMO_NOW,
      bagState: nextBagState,
      lastBagOpenedAt: nextOpenedAt,
    })
  }

  function recomputeAlerts(nextInventory: InventoryState[], nextScans: Scan[], nextAlerts = alerts, estimate = activeTravelEstimate): Alert[] {
    return evaluateAlerts(activeActivity, ITEMS, nextInventory, nextScans, nextAlerts, {
      now: DEMO_NOW,
      config: DEFAULT_CONFIG,
      travelEstimate: estimate,
    })
  }

  function handleActivityChange(activityId: string) {
    setActiveActivityId(activityId)
    setSelectedAlertId(undefined)
    const nextActivity = activities.find((activity) => activity.id === activityId)
    if (nextActivity) {
      addTrace(`Context switched to ${nextActivity.name}; deterministic requirements reloaded.`)
    }
  }

  function handleOpenBag() {
    const openedAt = new Date(new Date(DEMO_NOW).getTime() + 1_000).toISOString()
    setLastBagOpenedAt(openedAt)
    setBagState('open')
    const nextInventory = recomputeInventory(scans, observations, 'open', openedAt)
    setInventory(nextInventory)
    addTrace('Bag opened; prior closed-bag observations are now treated as stale until a new scan.', 'tag-removed')
  }

  async function handleCloseBag() {
    if (isScanning) return
    setIsScanning(true)
    setBagState('scanning')
    setLastBagOpenedAt(undefined)
    const scanId = `scan-${scans.length + 1}`
    const result = await reader.scan({ scanId, startedAt: DEMO_NOW, bagState: 'closed' })
    const nextScans = [...scans, result.scan]
    const nextObservations = [...observations, ...result.observations]
    const nextBagState: BagState = result.scan.status === 'completed' ? 'scan-complete' : 'sensor-unavailable'
    const nextInventory = recomputeInventory(nextScans, nextObservations, nextBagState, undefined)
    const nextAlerts = recomputeAlerts(nextInventory, nextScans)
    setScans(nextScans)
    setObservations(nextObservations)
    setInventory(nextInventory)
    setAlerts(nextAlerts)
    setBagState(nextBagState)
    setSensorStatus(reader.getStatus())
    setIsScanning(false)
    if (result.scan.status === 'completed') {
      addTrace(`Inventory state updated from ${result.observations.length} simulated tag observations.`, 'scan-completed')
    } else {
      addTrace(`Inventory held at Unknown after scan failure: ${result.scan.error}`, 'scan-failed')
    }
  }

  async function handleDisconnect() {
    await reader.disconnect()
    setSensorStatus('disconnected')
    setBagState('sensor-unavailable')
    const nextInventory = recomputeInventory(scans, observations, 'sensor-unavailable')
    setInventory(nextInventory.map((state) => ({ ...state, status: 'unknown', confidence: 0, reasonCode: 'reader-disconnected' })))
    addTrace('Reader disconnected; Carry will not claim readiness from stale evidence.', 'reader-status')
  }

  async function handleReconnect() {
    await reader.connect()
    setSensorStatus('connected')
    setBagState('open')
    addTrace('Reader reconnected. Open the bag and run a fresh scan to restore confidence.', 'reader-status')
  }

  function handleFailNextScan() {
    const next = !failNextScanArmed
    reader.setFailNextScan(next)
    setFailNextScanArmed(next)
    addTrace(next ? 'Next scan armed to fail after a simulated reader timeout.' : 'Simulated scan failure cleared.')
  }

  function handleReset() {
    reader.reset(DEFAULT_PRESENT_TAG_IDS, DEFAULT_SIGNAL_STRENGTHS)
    setActivities(cloneActivities())
    setActiveActivityId(ACTIVITIES[0].id)
    setBagState('open')
    setSensorStatus('connected')
    setScans([])
    setObservations([])
    setInventory(evaluateInventory(ITEMS, [], [], { now: DEMO_NOW, bagState: 'open' }))
    setAlerts([])
    setLastBagOpenedAt(undefined)
    setSelectedAlertId(undefined)
    setFailNextScanArmed(false)
    setSimulationVersion((version) => version + 1)
    addTrace('Scenario reset: laptop, notebook, and student ID are present; calculator is missing.')
  }

  function handleTogglePresence(item: Item) {
    const current = reader.getTagState(item.tagId)
    reader.setTagPresence(item.tagId, !current.present)
    setSimulationVersion((version) => version + 1)
    addTrace(`${item.name} ${current.present ? 'removed from' : 'added to'} the simulated bag.`, current.present ? 'tag-removed' : 'tag-added')
  }

  function handleModeChange(item: Item, mode: ReadMode) {
    reader.setOutside(item.tagId, mode === 'outside')
    reader.setIntermittent(item.tagId, mode === 'intermittent')
    reader.setSignalStrength(item.tagId, mode === 'weak' ? -72 : mode === 'outside' ? -58 : -48)
    setSimulationVersion((version) => version + 1)
    addTrace(`${item.name} configured for ${modeLabel(mode).toLowerCase()} evidence.`)
  }

  function handleToggleRequirement(itemId: string) {
    const nextActivities = activities.map((activity) => {
      if (activity.id !== activeActivity.id) return activity
      const isRequired = activity.requiredItemIds.includes(itemId)
      return {
        ...activity,
        requiredItemIds: isRequired
          ? activity.requiredItemIds.filter((id) => id !== itemId)
          : [...activity.requiredItemIds, itemId],
        optionalItemIds: isRequired
          ? [...new Set([...activity.optionalItemIds, itemId])]
          : activity.optionalItemIds.filter((id) => id !== itemId),
      }
    })
    const nextActivity = nextActivities.find((activity) => activity.id === activeActivity.id) ?? activeActivity
    setActivities(nextActivities)
    setAlerts(evaluateAlerts(nextActivity, ITEMS, inventory, scans, alerts, { now: DEMO_NOW, config: DEFAULT_CONFIG, travelEstimate: activeTravelEstimate }))
    addTrace(`${ITEMS.find((item) => item.id === itemId)?.name ?? 'Item'} requirement updated for ${activeActivity.name}.`)
  }

  function handleAlertStatus(alertId: string, status: 'acknowledged' | 'suppressed') {
    setAlerts((current) => current.map((alert) => (alert.id === alertId ? { ...alert, status } : alert)))
    addTrace(status === 'acknowledged' ? 'Alert acknowledged for this activity window.' : 'Alert suppressed for this activity window.')
  }

  async function handleEnableBrowserNotifications() {
    if (typeof Notification === 'undefined') {
      addTrace('Browser notifications are unavailable in this environment.')
      return
    }
    const permission = await Notification.requestPermission()
    setBrowserNotificationState(permission === 'granted' ? 'granted' : 'denied')
    addTrace(permission === 'granted' ? 'Browser notifications enabled after explicit user action.' : 'Browser notifications were not enabled; in-app alerts remain available.')
  }

  function handleApplyCarryProfile(response: CarryProfileApiResponse) {
    const requiredItemIds = response.profile.requiredItems.map((suggestion) => suggestion.itemId)
    const optionalItemIds = response.profile.optionalItems
      .map((suggestion) => suggestion.itemId)
      .filter((itemId) => !requiredItemIds.includes(itemId))
    const nextActivities = activities.map((activity) => activity.id === activeActivity.id
      ? { ...activity, requiredItemIds, optionalItemIds }
      : activity)
    const nextActivity = nextActivities.find((activity) => activity.id === activeActivity.id) ?? activeActivity
    setActivities(nextActivities)
    setAlerts((current) => evaluateAlerts(nextActivity, ITEMS, inventory, scans, current, {
      now: DEMO_NOW,
      config: DEFAULT_CONFIG,
      travelEstimate: activeTravelEstimate,
    }))
    addTrace(`${response.mode === 'ai' ? 'AI' : 'Fallback'} carry profile approved for ${activeActivity.name}; readiness still depends on sensor evidence.`)
  }

  const currentSimulationStates = useMemo(
    () => Object.fromEntries(ITEMS.map((item) => [item.id, reader.getTagState(item.tagId)])),
    // The simulator is intentionally stateful behind the hardware-compatible interface.
    [reader, simulationVersion],
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">C</div>
          <div>
            <div className="brand-name">Carry</div>
            <div className="brand-subtitle">context-aware carry system</div>
          </div>
        </div>
        <div className="topbar-meta">
          {onBackToLanding && <button className="back-to-site" type="button" onClick={onBackToLanding}>← Product site</button>}
          <span className="prototype-label"><span className="live-dot" /> SIMULATED PROTOTYPE</span>
          {browserNotificationState !== 'granted' && <button className="notification-button" type="button" onClick={handleEnableBrowserNotifications}>Enable browser alerts</button>}
          <span className="clock-label">Wed, Aug 5 <strong>8:21 AM</strong></span>
        </div>
      </header>

      {notificationToast && <div className="notification-toast" role="alert"><span className="toast-icon">!</span><div><strong>Carry needs your attention</strong><p>{notificationToast.message}</p></div><button type="button" aria-label="Dismiss notification" onClick={() => setNotificationToast(undefined)}>×</button></div>}

      <main className="workspace">
        <aside className="sidebar">
          <div className="eyebrow">Workspace</div>
          <nav className="nav-list" aria-label="Primary navigation">
            <button className="nav-item active" type="button"><span>◌</span> Overview</button>
            <button className="nav-item" type="button" onClick={() => setShowTrace(true)}><span>⌘</span> System trace <span className="nav-count">{trace.length}</span></button>
          </nav>

          <div className="sidebar-section">
            <div className="section-heading"><span>Next commitments</span><span className="tiny-count">{activities.length}</span></div>
            <div className="activity-list">
              {activities.map((activity) => (
                <button
                  className={`activity-nav ${activity.id === activeActivity.id ? 'selected' : ''}`}
                  key={activity.id}
                  type="button"
                  onClick={() => handleActivityChange(activity.id)}
                >
                  <span className={`activity-dot ${activity.type}`} />
                  <span className="activity-nav-copy">
                    <strong>{activity.name}</strong>
                    <small>{formatTime(activity.startTime)} · {ACTIVITY_TYPE_LABELS[activity.type]}</small>
                  </span>
                  {activity.id === activeActivity.id && <span className="selected-chevron">›</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-bottom">
            <div className={`sensor-mini ${sensorStatus}`}>
              <div className="sensor-mini-top"><span className="sensor-icon">⌁</span><span>RFID reader</span><span className="status-dot" /></div>
              <strong>{sensorStatus === 'connected' ? 'Simulated reader online' : 'Reader disconnected'}</strong>
              <small>{sensorStatus === 'connected' ? 'Hardware-compatible interface' : 'Inventory confidence paused'}</small>
            </div>
            <div className="disclosure-mini">Physical reader not connected · data is simulated</div>
          </div>
        </aside>

        <section className="main-canvas">
          <div className="page-heading">
            <div>
              <div className="eyebrow">Today’s carry plan <span className="heading-line" /></div>
              <h1>Good morning, Mitchell<span className="heading-period">.</span></h1>
              <p className="lede">Your backpack has a plan for the next thing that matters.</p>
            </div>
            <div className={`readiness-badge ${readiness.state}`}>
              <span className="readiness-icon">{readiness.state === 'ready' ? '✓' : readiness.state === 'missing' ? '!' : '◌'}</span>
              <span><strong>{readiness.label}</strong><small>{readiness.state === 'ready' ? 'Good to go' : 'Review the signal'}</small></span>
            </div>
          </div>

          <section className="context-card card">
            <div className="context-accent" />
            <div className="context-main">
              <div className="context-label"><span className={`activity-dot ${activeActivity.type}`} /> Next up · {ACTIVITY_TYPE_LABELS[activeActivity.type]}</div>
              <div className="context-title-row"><h2>{activeActivity.name}</h2><span className="context-time">{formatTime(activeActivity.startTime)} <span>·</span> {activeActivity.destination.name}</span></div>
              <div className="context-meta-row">
                <span><span className="meta-icon">⌖</span> {activeActivity.destination.address}</span>
                <span><span className="meta-icon">◷</span> {activeTravelEstimate ? `${activeTravelEstimate.durationMinutes} min travel` : travelStatus === 'loading' ? 'Travel estimate loading' : 'Travel estimate unavailable'}</span>
                <span><span className="meta-icon">↗</span> {activeTravelEstimate ? `${activeTravelEstimate.bufferMinutes} min buffer` : 'No invented leave-by'}</span>
              </div>
            </div>
            <div className="leave-by-block">
              <span className="mini-label">Leave by</span>
              <strong>{leaveBy ? formatTime(leaveBy) : '—'}</strong>
              <span className="leave-count">{minutesToLeave === undefined ? 'awaiting provider' : `in ${Math.max(0, minutesToLeave)} min`}</span>
            </div>
          </section>

          <div className="metric-row">
            <div className="metric-card card">
              <div className="metric-icon blue">⌑</div>
              <div><span className="mini-label">Backpack state</span><strong>{bagState === 'scan-complete' ? 'Scan complete' : bagState === 'sensor-unavailable' ? 'Sensor unavailable' : bagState === 'scanning' ? 'Scanning' : bagState === 'closed' ? 'Closed' : 'Open'}</strong><small>{scanLabel(latestScan)}</small></div>
            </div>
            <div className="metric-card card">
              <div className="metric-icon amber">◉</div>
              <div><span className="mini-label">Requirements</span><strong>{requiredItems.length} required <span className="muted-inline">/ {optionalItems.length} optional</span></strong><small>Profile is user-approved</small></div>
            </div>
            <div className="metric-card card">
              <div className="metric-icon green">↯</div>
              <div><span className="mini-label">Latest evidence</span><strong>{observations.length ? `${observations.length} observations` : 'Awaiting scan'}</strong><small>{latestScan ? `Scan ${latestScan.id}` : 'No sensor memory yet'}</small></div>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="card inventory-card">
              <div className="card-header">
                <div><div className="eyebrow">Inventory memory</div><h2>What Carry believes is inside</h2></div>
                <button className="text-button" type="button" onClick={() => setShowTrace(true)}>View trace <span>↗</span></button>
              </div>
              <div className="inventory-table-head"><span>Item</span><span>State</span><span>Confidence</span><span>Evidence</span></div>
              <div className="inventory-list">
                {ITEMS.map((item) => {
                  const state = inventory.find((candidate) => candidate.itemId === item.id)
                  const itemState = state ?? { status: 'unknown' as const, confidence: 0, itemId: item.id, lastUpdatedAt: DEMO_NOW, supportingObservationIds: [], reasonCode: 'no-state' }
                  const isRequired = activeActivity.requiredItemIds.includes(item.id)
                  return (
                      <button className={`inventory-row ${selectedItemId === item.id ? 'focused' : ''}`} key={item.id} type="button" onClick={() => setSelectedItemId(item.id)}>
                      <span className="item-cell"><span className="item-icon">{item.icon}</span><span><strong>{item.name}</strong><small>{isRequired ? 'Required' : 'Optional / registered'} · {item.category}</small></span></span>
                      <span><span className={`state-pill ${statusClass(itemState.status)}`}><span className="pill-dot" />{statusLabel(itemState.status)}</span></span>
                      <span className="confidence-cell"><span className="confidence-track"><span style={{ width: `${Math.round(itemState.confidence * 100)}%` }} /></span><strong>{Math.round(itemState.confidence * 100)}%</strong></span>
                      <span className="evidence-cell">{itemState.reasonCode === 'no-valid-scan' ? 'No scan yet' : itemState.reasonCode === 'absent-from-closed-bag-scan' ? 'Absent in latest scan' : itemState.reasonCode === 'bag-opened-after-scan' ? 'Bag opened after scan' : itemState.reasonCode === 'reader-unavailable' || itemState.reasonCode === 'reader-disconnected' ? 'Reader unavailable' : 'Read history'} <span>›</span></span>
                    </button>
                  )
                })}
              </div>
              <div className="inventory-footer"><span><span className="footer-dot" /> {scanLabel(latestScan)}</span><span>State is deterministic; sensor data is simulated</span></div>
            </section>

            <aside className="right-column">
              <section className={`card alert-card ${activeAlerts.length ? 'has-alert' : 'clear-alert'}`}>
                <div className="alert-card-header"><div><div className="eyebrow">Carry’s attention</div><h2>{activeAlerts.length ? `${activeAlerts.length} thing${activeAlerts.length === 1 ? '' : 's'} to check` : 'No active warnings'}</h2></div><span className="alert-status-icon">{activeAlerts.length ? '!' : '✓'}</span></div>
                {activeAlerts.length ? activeAlerts.map((alert) => {
                  const item = ITEMS.find((candidate) => candidate.id === alert.itemId)
                  return <button className={`alert-preview ${selectedAlert?.id === alert.id ? 'selected' : ''}`} key={alert.id} type="button" onClick={() => setSelectedAlertId(alert.id)}><span className="alert-preview-icon">{item?.icon}</span><span><strong>{item?.name} {alert.type === 'missing-item' ? 'not detected' : 'needs a closer look'}</strong><small>{alertTypeLabel(alert)} · leave by {formatTime(alert.evidence.leaveBy)}</small></span><span className="alert-arrow">›</span></button>
                }) : <div className="empty-alert"><div className="empty-check">✓</div><div><strong>Your carry plan is clear.</strong><p>{readiness.state === 'ready' ? 'Every required item is confirmed for this activity.' : readiness.detail}</p></div></div>}
                {activeAlerts.length > 0 && <div className="alert-card-footer"><span>Evidence-backed · no duplicate alerts</span><button type="button" onClick={() => setSelectedAlertId(activeAlerts[0].id)}>Open explanation ↗</button></div>}
                {resolvedAlerts.length > 0 && <div className="resolved-note"><span>✓</span> {resolvedAlerts.length} alert{resolvedAlerts.length === 1 ? '' : 's'} resolved after rescanning</div>}
              </section>

              <section className="card simulator-card">
                <div className="card-header compact"><div><div className="eyebrow">Sensor lab</div><h2>Run a backpack scan</h2></div><span className={`connection-chip ${sensorStatus}`}>{sensorStatus === 'connected' ? 'Connected' : 'Offline'}</span></div>
                <div className="bag-control"><div className={`bag-illustration ${bagState}`}><span>⌂</span><i /></div><div><strong>{bagState === 'open' ? 'Bag is open' : bagState === 'scanning' ? 'Reading tags…' : bagState === 'sensor-unavailable' ? 'Reader needs attention' : 'Bag is closed'}</strong><small>{bagState === 'open' ? 'Add or remove an item, then close to scan.' : bagState === 'scanning' ? 'The simulator is collecting a closed-bag snapshot.' : bagState === 'sensor-unavailable' ? 'Reconnect the reader to continue.' : 'Latest snapshot is ready for review.'}</small></div></div>
                <div className="simulator-actions">
                  {bagState !== 'open' && bagState !== 'scanning' && <button className="secondary-button" type="button" onClick={handleOpenBag}>Open bag</button>}
                  {bagState === 'open' && <button className="primary-button" type="button" onClick={handleCloseBag} disabled={isScanning || sensorStatus === 'disconnected'}>{isScanning ? 'Scanning…' : 'Close bag & scan'} <span>→</span></button>}
                  {bagState === 'sensor-unavailable' && <button className="primary-button" type="button" onClick={handleReconnect}>Reconnect reader <span>↗</span></button>}
                </div>
                <div className="simulator-divider" />
                <div className="lab-heading"><span>Scenario controls</span><button className="text-button" type="button" onClick={handleReset}>Reset</button></div>
                <div className="scenario-list">
                  {ITEMS.slice(0, 6).map((item) => {
                    const state = currentSimulationStates[item.id]
                    const mode = getMode(state)
                    return <div className="scenario-row" key={item.id}><span className="scenario-item"><span className="mini-item-icon">{item.icon}</span>{item.name}</span><div className="scenario-row-actions"><button className={`tag-toggle ${state.present ? 'on' : ''}`} type="button" onClick={() => handleTogglePresence(item)}>{state.present ? 'In bag' : 'Absent'}</button><select aria-label={`Signal mode for ${item.name}`} value={mode} onChange={(event) => handleModeChange(item, event.target.value as ReadMode)}><option value="strong">Strong</option><option value="weak">Weak</option><option value="intermittent">Intermittent</option><option value="outside">Outside</option></select></div></div>
                  })}
                </div>
                <div className="failure-actions"><button className={`failure-button ${failNextScanArmed ? 'armed' : ''}`} type="button" onClick={handleFailNextScan}>{failNextScanArmed ? 'Next scan will fail' : 'Simulate scan failure'}</button>{sensorStatus === 'connected' ? <button className="link-button" type="button" onClick={handleDisconnect}>Disconnect reader</button> : <button className="link-button" type="button" onClick={handleReconnect}>Reconnect reader</button>}</div>
              </section>
            </aside>
          </div>

          <section className="card activity-card">
            <div className="activity-card-main"><div className="card-header compact"><div><div className="eyebrow">Context profile</div><h2>{activeActivity.name} requirements</h2></div><button className="secondary-button small" type="button" onClick={() => setEditingRequirements((editing) => !editing)}>{editingRequirements ? 'Done editing' : 'Edit requirements'}</button></div><div className="requirements-summary"><div><span className="mini-label">Required before leaving</span><div className="requirement-chips">{requiredItems.map((item) => <span className="requirement-chip" key={item.id}><span>{item.icon}</span>{item.name}</span>)}</div></div><div><span className="mini-label">Optional context</span><div className="requirement-chips optional">{optionalItems.map((item) => <span className="requirement-chip" key={item.id}><span>{item.icon}</span>{item.name}</span>)}</div></div></div></div>
            {editingRequirements && <div className="requirements-editor"><div className="editor-header"><span>Toggle the user-approved checklist</span><small>Alert policy uses only required items.</small></div>{ITEMS.map((item) => <label className="requirement-toggle" key={item.id}><input type="checkbox" checked={activeActivity.requiredItemIds.includes(item.id)} onChange={() => handleToggleRequirement(item.id)} /><span className="custom-check">✓</span><span>{item.icon} {item.name}</span><small>{activeActivity.requiredItemIds.includes(item.id) ? 'required' : 'optional / off'}</small></label>)}</div>}
          </section>

          <AIProfileGenerator
            activeActivity={activeActivity}
            onApprove={handleApplyCarryProfile}
            onTrace={addTrace}
          />

          <footer className="page-footer"><span><span className="footer-brand-mark">C</span> Carry software-first prototype</span><span>Simulated RFID · deterministic decision engine · no physical validation yet</span></footer>
        </section>
      </main>

      {selectedAlert && <div className="drawer-backdrop" role="presentation" onClick={() => setSelectedAlertId(undefined)}><aside className="detail-drawer alert-drawer" role="dialog" aria-modal="true" aria-label="Alert explanation" onClick={(event) => event.stopPropagation()}><div className="drawer-top"><span className="drawer-kicker">Evidence-backed explanation</span><button className="close-button" type="button" onClick={() => setSelectedAlertId(undefined)}>×</button></div><div className="drawer-alert-hero"><span className="drawer-alert-icon">!</span><div><span className="alert-type-label">{alertTypeLabel(selectedAlert)}</span><h2>{selectedAlert.evidence.itemName} {selectedAlert.type === 'missing-item' ? 'not detected' : 'needs a closer look'}</h2></div></div><p className="drawer-summary">{selectedAlert.evidence.activityName} requires this item. Carry checked the backpack after closing and found evidence that needs your attention before you leave.</p><div className="explanation-quote">“{selectedAlert.evidence.evidenceSummary}”</div><div className="evidence-grid"><div><span className="mini-label">Leave by</span><strong>{formatTime(selectedAlert.evidence.leaveBy)}</strong></div><div><span className="mini-label">Latest scan</span><strong>{formatTime(selectedAlert.evidence.latestScanAt)}</strong></div><div><span className="mini-label">Confidence</span><strong>{Math.round(selectedAlert.evidence.confidence * 100)}%</strong></div><div><span className="mini-label">Scan ID</span><strong>{selectedAlert.evidence.scanId}</strong></div></div><div className="next-action"><span className="next-action-icon">→</span><div><span className="mini-label">Recommended next action</span><strong>{selectedAlert.evidence.nextAction}</strong></div></div><div className="drawer-actions"><button className="primary-button" type="button" onClick={() => handleAlertStatus(selectedAlert.id, 'acknowledged')}>Acknowledge</button><button className="secondary-button" type="button" onClick={() => handleAlertStatus(selectedAlert.id, 'suppressed')}>Snooze alert</button></div></aside></div>}

      {selectedItemId && <aside className="detail-drawer item-drawer" aria-label="Item detail"><div className="drawer-top"><span className="drawer-kicker">Item evidence</span><button className="close-button" type="button" onClick={() => setSelectedItemId('')}>×</button></div><div className="item-detail-hero"><span className="large-item-icon">{selectedItem.icon}</span><div><span className="item-category">{selectedItem.category}</span><h2>{selectedItem.name}</h2><span className="tag-code">{selectedItem.tagId}</span></div></div><div className="item-state-banner"><span className={`state-pill ${statusClass(selectedItemState?.status ?? 'unknown')}`}><span className="pill-dot" />{statusLabel(selectedItemState?.status ?? 'unknown')}</span><strong>{Math.round((selectedItemState?.confidence ?? 0) * 100)}% confidence</strong></div><div className="drawer-section"><span className="mini-label">Tag placement</span><p>{selectedItem.tagPlacement}</p><small>{selectedItem.notes}</small></div><div className="drawer-section"><div className="drawer-section-header"><span className="mini-label">Observation history</span><span className="history-count">{selectedItemObservations.length}</span></div>{selectedItemObservations.length ? selectedItemObservations.map((observation) => <div className="observation-row" key={observation.id}><span className="observation-status" /><div><strong>{formatTime(observation.detectedAt)} · {observation.locationHint}</strong><small>{observation.consecutiveReads} reads · {observation.signalStrength} dBm · {observation.evidence}</small></div></div>) : <div className="no-observations">No observations yet. Run a closed-bag scan to create evidence.</div>}</div><div className="drawer-section"><span className="mini-label">Reason code</span><code>{selectedItemState?.reasonCode ?? 'no-state'}</code></div></aside>}

      {showTrace && <div className="drawer-backdrop" role="presentation" onClick={() => setShowTrace(false)}><aside className="detail-drawer trace-drawer" role="dialog" aria-modal="true" aria-label="System trace" onClick={(event) => event.stopPropagation()}><div className="drawer-top"><span className="drawer-kicker">Developer mode</span><button className="close-button" type="button" onClick={() => setShowTrace(false)}>×</button></div><h2>System trace</h2><p className="drawer-muted">A transparent view of the pipeline from simulated sensor event to user-facing decision.</p><div className="trace-flow"><span>sensor</span><i>→</i><span>observations</span><i>→</i><span>state</span><i>→</i><span>alert</span></div><div className="trace-list">{trace.map((event) => <div className="trace-row" key={event.id}><span className={`trace-icon ${event.type.includes('failed') ? 'failed' : event.type.includes('completed') ? 'complete' : ''}`}>{event.type.includes('failed') ? '!' : event.type.includes('completed') ? '✓' : '·'}</span><div><strong>{event.detail}</strong><small>{formatTime(event.at)} · {event.type.replaceAll('-', ' ')}</small></div></div>)}</div></aside></div>}
    </div>
  )
}
