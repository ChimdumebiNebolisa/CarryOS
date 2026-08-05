import { useEffect, useMemo, useRef, useState } from 'react'
import {
  calculateLeaveBy,
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
} from './domain'
import { ACTIVITY_TYPE_LABELS, ACTIVITIES, DEFAULT_PRESENT_TAG_IDS, DEFAULT_SIGNAL_STRENGTHS, ITEMS } from './demoData'
import { SimulatedRFIDReader } from './simulator'

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

export default function App() {
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
  const readiness = getReadiness(activeActivity, inventory, latestScan, sensorStatus)
  const leaveBy = calculateLeaveBy(
    activeActivity.startTime,
    activeActivity.travelMinutes,
    activeActivity.departureBufferMinutes,
  )
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
  const minutesToLeave = minutesUntil(leaveBy, DEMO_NOW)

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

  function recomputeAlerts(nextInventory: InventoryState[], nextScans: Scan[], nextAlerts = alerts): Alert[] {
    return evaluateAlerts(activeActivity, ITEMS, nextInventory, nextScans, nextAlerts, {
      now: DEMO_NOW,
      config: DEFAULT_CONFIG,
    })
  }

  function handleActivityChange(activityId: string) {
    setActiveActivityId(activityId)
    setSelectedAlertId(undefined)
    const nextActivity = activities.find((activity) => activity.id === activityId)
    if (nextActivity) {
      setAlerts(evaluateAlerts(nextActivity, ITEMS, inventory, scans, alerts, { now: DEMO_NOW }))
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
    setAlerts(evaluateAlerts(nextActivity, ITEMS, inventory, scans, alerts, { now: DEMO_NOW }))
    addTrace(`${ITEMS.find((item) => item.id === itemId)?.name ?? 'Item'} requirement updated for ${activeActivity.name}.`)
  }

  function handleAlertStatus(alertId: string, status: 'acknowledged' | 'suppressed') {
    setAlerts((current) => current.map((alert) => (alert.id === alertId ? { ...alert, status } : alert)))
    addTrace(status === 'acknowledged' ? 'Alert acknowledged for this activity window.' : 'Alert suppressed for this activity window.')
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
          <span className="prototype-label"><span className="live-dot" /> SIMULATED PROTOTYPE</span>
          <span className="clock-label">Wed, Aug 5 <strong>8:21 AM</strong></span>
        </div>
      </header>

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
                <span><span className="meta-icon">◷</span> {activeActivity.travelMinutes} min travel</span>
                <span><span className="meta-icon">↗</span> {activeActivity.departureBufferMinutes} min buffer</span>
              </div>
            </div>
            <div className="leave-by-block">
              <span className="mini-label">Leave by</span>
              <strong>{formatTime(leaveBy)}</strong>
              <span className="leave-count">in {Math.max(0, minutesToLeave)} min</span>
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

          <footer className="page-footer"><span><span className="footer-brand-mark">C</span> Carry software-first prototype</span><span>Simulated RFID · deterministic decision engine · no physical validation yet</span></footer>
        </section>
      </main>

      {selectedAlert && <div className="drawer-backdrop" role="presentation" onClick={() => setSelectedAlertId(undefined)}><aside className="detail-drawer alert-drawer" role="dialog" aria-modal="true" aria-label="Alert explanation" onClick={(event) => event.stopPropagation()}><div className="drawer-top"><span className="drawer-kicker">Evidence-backed explanation</span><button className="close-button" type="button" onClick={() => setSelectedAlertId(undefined)}>×</button></div><div className="drawer-alert-hero"><span className="drawer-alert-icon">!</span><div><span className="alert-type-label">{alertTypeLabel(selectedAlert)}</span><h2>{selectedAlert.evidence.itemName} {selectedAlert.type === 'missing-item' ? 'not detected' : 'needs a closer look'}</h2></div></div><p className="drawer-summary">{selectedAlert.evidence.activityName} requires this item. Carry checked the backpack after closing and found evidence that needs your attention before you leave.</p><div className="explanation-quote">“{selectedAlert.evidence.evidenceSummary}”</div><div className="evidence-grid"><div><span className="mini-label">Leave by</span><strong>{formatTime(selectedAlert.evidence.leaveBy)}</strong></div><div><span className="mini-label">Latest scan</span><strong>{formatTime(selectedAlert.evidence.latestScanAt)}</strong></div><div><span className="mini-label">Confidence</span><strong>{Math.round(selectedAlert.evidence.confidence * 100)}%</strong></div><div><span className="mini-label">Scan ID</span><strong>{selectedAlert.evidence.scanId}</strong></div></div><div className="next-action"><span className="next-action-icon">→</span><div><span className="mini-label">Recommended next action</span><strong>{selectedAlert.evidence.nextAction}</strong></div></div><div className="drawer-actions"><button className="primary-button" type="button" onClick={() => handleAlertStatus(selectedAlert.id, 'acknowledged')}>Acknowledge</button><button className="secondary-button" type="button" onClick={() => handleAlertStatus(selectedAlert.id, 'suppressed')}>Snooze alert</button></div></aside></div>}

      {selectedItemId && <aside className="detail-drawer item-drawer" aria-label="Item detail"><div className="drawer-top"><span className="drawer-kicker">Item evidence</span><button className="close-button" type="button" onClick={() => setSelectedItemId('')}>×</button></div><div className="item-detail-hero"><span className="large-item-icon">{selectedItem.icon}</span><div><span className="item-category">{selectedItem.category}</span><h2>{selectedItem.name}</h2><span className="tag-code">{selectedItem.tagId}</span></div></div><div className="item-state-banner"><span className={`state-pill ${statusClass(selectedItemState?.status ?? 'unknown')}`}><span className="pill-dot" />{statusLabel(selectedItemState?.status ?? 'unknown')}</span><strong>{Math.round((selectedItemState?.confidence ?? 0) * 100)}% confidence</strong></div><div className="drawer-section"><span className="mini-label">Tag placement</span><p>{selectedItem.tagPlacement}</p><small>{selectedItem.notes}</small></div><div className="drawer-section"><div className="drawer-section-header"><span className="mini-label">Observation history</span><span className="history-count">{selectedItemObservations.length}</span></div>{selectedItemObservations.length ? selectedItemObservations.map((observation) => <div className="observation-row" key={observation.id}><span className="observation-status" /><div><strong>{formatTime(observation.detectedAt)} · {observation.locationHint}</strong><small>{observation.consecutiveReads} reads · {observation.signalStrength} dBm · {observation.evidence}</small></div></div>) : <div className="no-observations">No observations yet. Run a closed-bag scan to create evidence.</div>}</div><div className="drawer-section"><span className="mini-label">Reason code</span><code>{selectedItemState?.reasonCode ?? 'no-state'}</code></div></aside>}

      {showTrace && <div className="drawer-backdrop" role="presentation" onClick={() => setShowTrace(false)}><aside className="detail-drawer trace-drawer" role="dialog" aria-modal="true" aria-label="System trace" onClick={(event) => event.stopPropagation()}><div className="drawer-top"><span className="drawer-kicker">Developer mode</span><button className="close-button" type="button" onClick={() => setShowTrace(false)}>×</button></div><h2>System trace</h2><p className="drawer-muted">A transparent view of the pipeline from simulated sensor event to user-facing decision.</p><div className="trace-flow"><span>sensor</span><i>→</i><span>observations</span><i>→</i><span>state</span><i>→</i><span>alert</span></div><div className="trace-list">{trace.map((event) => <div className="trace-row" key={event.id}><span className={`trace-icon ${event.type.includes('failed') ? 'failed' : event.type.includes('completed') ? 'complete' : ''}`}>{event.type.includes('failed') ? '!' : event.type.includes('completed') ? '✓' : '·'}</span><div><strong>{event.detail}</strong><small>{formatTime(event.at)} · {event.type.replaceAll('-', ' ')}</small></div></div>)}</div></aside></div>}
    </div>
  )
}
