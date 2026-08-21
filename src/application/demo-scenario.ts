import { simulateClosedBagScan, DEFAULT_PRESENT_ITEM_IDS, type ReadQuality, type SimulatedTagConfig } from '@/adapters/inventory/simulated-rfid'
import { estimateTravel } from '@/adapters/travel/simulated-travel'
import { evaluateAlerts, acknowledgeAlert, isAlertActionable, suppressAlert } from '@/domain/alerts'
import { evaluateInventory, hasEvidenceCorruption } from '@/domain/inventory'
import { getReadiness } from '@/domain/readiness'
import { calculateLeaveBy } from '@/domain/timing'
import { createTraceEvent, redactTraceDetail } from '@/application/trace'
import { shouldNotify } from '@/application/notification-policy'
import { scanId } from '@/lib/ids'
import { type Activity, type Alert, type CarryProfileResult, type InventoryState, type Item, type Readiness, type Scan, type SensorStatus, type TagObservation, type TraceEvent, type TravelEstimate } from '@/domain/types'
import { ACTIVITIES } from '@/fixtures/activities'
import { ITEMS } from '@/fixtures/items'
import { DEMO_SESSION_NOW } from '@/fixtures/demo-scenario'
import { formatClock } from '@/lib/utils'
import { parseFiniteTimestamp } from '@/domain/time'

export interface InAppNotification {
  id: string
  alertId: string
  title: string
  body: string
}

export interface DemoSession {
  now: string
  items: Item[]
  activity: Activity
  bagIsOpen: boolean
  lastBagOpenedAt?: string
  sensorStatus: SensorStatus
  failNextScan: boolean
  travelUnavailable: boolean
  tags: Record<string, SimulatedTagConfig>
  scans: Scan[]
  observations: TagObservation[]
  inventory: InventoryState[]
  alerts: Alert[]
  readiness: Readiness
  travel?: TravelEstimate
  trace: TraceEvent[]
  suggestions: CarryProfileResult | null
  suggestionDecisions: Record<string, 'approved' | 'rejected'>
  notifications: InAppNotification[]
  browserPermission: NotificationPermission | 'default' | 'unsupported'
  scanSequence: number
  traceSequence: number
}

function defaultTags(): Record<string, SimulatedTagConfig> {
  return Object.fromEntries(
    ITEMS.map((item) => [
      item.id,
      {
        present: DEFAULT_PRESENT_ITEM_IDS.includes(item.id as (typeof DEFAULT_PRESENT_ITEM_IDS)[number]),
        quality: 'strong' as ReadQuality,
        locationHint: 'inside' as const,
      },
    ]),
  )
}

function cloneActivity(activity: Activity): Activity {
  return {
    ...activity,
    requiredItemIds: [...activity.requiredItemIds],
    optionalItemIds: [...activity.optionalItemIds],
  }
}

export function createDemoSession(now = DEMO_SESSION_NOW): DemoSession {
  const activity = cloneActivity(ACTIVITIES[0])
  const session: DemoSession = {
    now,
    items: ITEMS,
    activity,
    bagIsOpen: true,
    sensorStatus: 'connected',
    failNextScan: false,
    travelUnavailable: false,
    tags: defaultTags(),
    scans: [],
    observations: [],
    inventory: [],
    alerts: [],
    readiness: {
      state: 'scan-required',
      label: 'Scan required',
      detail: 'No fresh closed-bag evidence yet.',
      confirmedRequiredCount: 0,
      requiredCount: activity.requiredItemIds.length,
    },
    trace: [],
    suggestions: null,
    suggestionDecisions: {},
    notifications: [],
    browserPermission: 'default',
    scanSequence: 0,
    traceSequence: 0,
  }
  const travel = estimateTravel(activity)
  if (travel.ok) session.travel = travel.estimate
  pushTrace(session, 'demo-initialized', `Canonical ${activity.name} demonstration loaded.`)
  pushTrace(session, 'activity-loaded', `${activity.name} starts at ${formatClock(activity.startTime)}.`)
  if (travel.ok) {
    pushTrace(session, 'travel-estimate-loaded', `Simulated travel ${travel.estimate.durationMinutes} minutes. Leave by ${formatClock(travel.estimate.leaveBy)}.`)
  }
  session.inventory = evaluateInventory(session.items, session.scans, session.observations, {
    now: session.now,
    bagIsOpen: session.bagIsOpen,
    lastBagOpenedAt: session.lastBagOpenedAt,
  })
  session.readiness = getReadiness(session.activity, session.inventory, session.scans, session.sensorStatus, {
    now: session.now,
    items: session.items,
    observations: session.observations,
  })
  return session
}

function pushTrace(session: DemoSession, name: TraceEvent['name'], detail: string) {
  session.traceSequence += 1
  session.trace = [
    createTraceEvent(name, session.now, redactTraceDetail(detail), session.traceSequence),
    ...session.trace,
  ].slice(0, 80)
}

function notificationFor(alert: Alert): InAppNotification {
  return {
    id: `notice_${alert.id}`,
    alertId: alert.id,
    title: alert.type === 'missing-item' ? `${alert.evidence.itemName} not detected` : `${alert.evidence.itemName} is uncertain`,
    body: alert.evidence.summary,
  }
}

function reconcileNotifications(session: DemoSession, newlyActionable: Alert[] = []) {
  const actionableById = new Map(session.alerts.filter(isAlertActionable).map((alert) => [alert.id, alert]))
  const retained = session.notifications
    .filter((notification) => actionableById.has(notification.alertId))
    .map((notification) => notificationFor(actionableById.get(notification.alertId)!))
  const retainedIds = new Set(retained.map((notification) => notification.alertId))
  const additions = newlyActionable
    .filter((alert) => !retainedIds.has(alert.id))
    .map(notificationFor)
  session.notifications = [...additions, ...retained].slice(0, 20)
}

function recompute(session: DemoSession, previousAlerts = session.alerts, traceInventory = true) {
  session.inventory = evaluateInventory(session.items, session.scans, session.observations, {
    now: session.now,
    bagIsOpen: session.bagIsOpen,
    lastBagOpenedAt: session.lastBagOpenedAt,
  })
  session.readiness = getReadiness(session.activity, session.inventory, session.scans, session.sensorStatus, {
    now: session.now,
    items: session.items,
    observations: session.observations,
  })
  if (traceInventory) pushTrace(session, 'inventory-state-recalculated', `Readiness is ${session.readiness.state}.`)
  if (
    hasEvidenceCorruption(session.items, session.scans, session.observations, session.now) &&
    !session.trace.some((event) => event.name === 'evidence-corruption-detected')
  ) {
    pushTrace(session, 'evidence-corruption-detected', 'Malformed historical evidence was quarantined from current-state derivation.')
  }
  const leaveBy = session.travel?.leaveBy
  const result = evaluateAlerts(session.activity, session.items, session.inventory, session.scans, session.alerts, {
    now: session.now,
    observations: session.observations,
    leaveBy,
  })
  session.alerts = result.alerts
  for (const alert of result.created) {
    pushTrace(session, 'alert-created', `${alert.evidence.itemName}: ${alert.type}.`)
  }
  for (const alert of result.updated) {
    pushTrace(session, 'alert-updated', `${alert.evidence.itemName} changed to ${alert.type}.`)
  }
  for (const alert of result.resolved) {
    pushTrace(session, 'alert-resolved', `${alert.evidence.itemName} resolved.`)
  }
  for (const alert of result.expired) {
    pushTrace(session, 'alert-expired', `${alert.evidence.itemName} expired.`)
  }
  for (const alert of result.reactivated) {
    pushTrace(session, 'alert-reactivated', `${alert.evidence.itemName} is actionable again.`)
  }
  const decision = shouldNotify(previousAlerts, session.alerts, session.browserPermission)
  reconcileNotifications(session, decision.alerts)
  if (decision.emitInApp) {
    pushTrace(session, 'notification-emitted', 'In-app notification emitted.')
  }
}

export function openBag(session: DemoSession): DemoSession {
  const next = { ...session, bagIsOpen: true, lastBagOpenedAt: session.now }
  pushTrace(next, 'bag-opened', 'Bag opened. Previous evidence is no longer fresh.')
  recompute(next)
  return next
}

export function closeBagAndScan(session: DemoSession): DemoSession {
  if (session.sensorStatus === 'disconnected') return session
  const next = { ...session, bagIsOpen: false }
  next.scanSequence += 1
  const id = scanId(session.now, next.scanSequence)
  const running: Scan = {
    id,
    startedAt: session.now,
    bagState: 'closed',
    status: 'running',
    source: 'simulated-rfid',
  }
  next.scans = [...next.scans, running]
  pushTrace(next, 'scan-started', 'Reading closed-bag snapshot.')

  if (next.failNextScan) {
    const failed: Scan = { ...running, status: 'failed', completedAt: session.now, error: 'Simulated scan failure.' }
    next.scans = next.scans.map((scan) => (scan.id === id ? failed : scan))
    next.failNextScan = false
    pushTrace(next, 'scan-failed', 'Scan failed. Inventory truth was not updated from this attempt.')
    recompute(next)
    return next
  }

  const completed: Scan = {
    ...running,
    status: 'completed',
    completedAt: session.now,
    readsEvaluated: next.items.length,
  }
  next.scans = next.scans.map((scan) => (scan.id === id ? completed : scan))
  const observations = simulateClosedBagScan({
    scan: completed,
    items: next.items,
    tags: next.tags,
    now: next.now,
  })
  next.observations = [...next.observations, ...observations]
  pushTrace(next, 'scan-completed', `Closed-bag scan recorded ${observations.length} tag observations.`)
  recompute(next)
  return next
}

export function setItemPresent(session: DemoSession, itemId: string, present: boolean): DemoSession {
  const next = {
    ...session,
    tags: {
      ...session.tags,
      [itemId]: { ...session.tags[itemId], present },
    },
  }
  return next
}

export function setItemQuality(session: DemoSession, itemId: string, quality: ReadQuality): DemoSession {
  return {
    ...session,
    tags: {
      ...session.tags,
      [itemId]: { ...session.tags[itemId], quality },
    },
  }
}

export function setItemLocationHint(session: DemoSession, itemId: string, locationHint: SimulatedTagConfig['locationHint']): DemoSession {
  return {
    ...session,
    tags: {
      ...session.tags,
      [itemId]: { ...session.tags[itemId], locationHint },
    },
  }
}

export function armFailedScan(session: DemoSession): DemoSession {
  return { ...session, failNextScan: true }
}

export function disconnectReader(session: DemoSession): DemoSession {
  const next = { ...session, sensorStatus: 'disconnected' as const }
  pushTrace(next, 'reader-disconnected', 'Simulated reader disconnected.')
  recompute(next)
  return next
}

export function reconnectReader(session: DemoSession): DemoSession {
  const next = { ...session, sensorStatus: 'connected' as const }
  pushTrace(next, 'reader-reconnected', 'Simulated reader reconnected.')
  recompute(next)
  return next
}

export function resetDemo(): DemoSession {
  const session = createDemoSession()
  session.trace = session.trace.filter((event) => event.name === 'demo-initialized' || event.name === 'activity-loaded' || event.name === 'travel-estimate-loaded')
  pushTrace(session, 'demo-reset', 'Demonstration restored to the canonical Algorithms scenario.')
  return session
}

export function applySuggestionDecision(
  session: DemoSession,
  itemId: string,
  decision: 'approved' | 'rejected',
  bucket: 'required' | 'optional' | 'excluded',
): DemoSession {
  if (session.suggestionDecisions[itemId]) return session
  const next = {
    ...session,
    suggestionDecisions: { ...session.suggestionDecisions, [itemId]: decision },
  }
  pushTrace(next, decision === 'approved' ? 'suggestion-approved' : 'suggestion-rejected', `${itemId} ${decision}.`)
  if (decision !== 'approved') return next

  const required = new Set(next.activity.requiredItemIds)
  const optional = new Set(next.activity.optionalItemIds)
  if (bucket === 'required') {
    required.add(itemId)
    optional.delete(itemId)
  } else if (bucket === 'optional') {
    optional.add(itemId)
    required.delete(itemId)
  } else {
    required.delete(itemId)
    optional.delete(itemId)
  }
  next.activity = {
    ...next.activity,
    requiredItemIds: [...required],
    optionalItemIds: [...optional],
  }
  recompute(next)
  return next
}

export function setSuggestions(session: DemoSession, suggestions: CarryProfileResult, sourceLabel: string): DemoSession {
  const next = { ...session, suggestions, suggestionDecisions: {} }
  pushTrace(next, 'model-inference-requested', 'Carry-profile inference requested.')
  pushTrace(
    next,
    suggestions.source === 'fallback' ? 'fallback-selected' : 'model-output-validated',
    sourceLabel,
  )
  return next
}

export function acknowledge(session: DemoSession, alertId: string): DemoSession {
  const next = { ...session, alerts: acknowledgeAlert(session.alerts, alertId, session.now) }
  const transitioned = session.alerts.some(
    (alert) => alert.id === alertId && alert.status === 'active' && next.alerts.find((candidate) => candidate.id === alertId)?.status === 'acknowledged',
  )
  reconcileNotifications(next)
  if (transitioned) pushTrace(next, 'alert-acknowledged', `${next.alerts.find((alert) => alert.id === alertId)?.evidence.itemName ?? 'Alert'} acknowledged.`)
  return next
}

export function advanceTime(session: DemoSession, now: string): DemoSession {
  const currentMs = parseFiniteTimestamp(session.now)
  const nextMs = parseFiniteTimestamp(now)
  if (currentMs === undefined || nextMs === undefined || nextMs <= currentMs) return session
  const next = { ...session, now }
  recompute(next, session.alerts, false)
  return next
}

export function suppress(session: DemoSession, alertId: string): DemoSession {
  const next = { ...session, alerts: suppressAlert(session.alerts, alertId, session.now) }
  const transitioned = session.alerts.some(
    (alert) =>
      alert.id === alertId &&
      (alert.status === 'active' || alert.status === 'acknowledged') &&
      next.alerts.find((candidate) => candidate.id === alertId)?.status === 'suppressed',
  )
  reconcileNotifications(next)
  if (transitioned) pushTrace(next, 'alert-suppressed', `${next.alerts.find((alert) => alert.id === alertId)?.evidence.itemName ?? 'Alert'} snoozed.`)
  return next
}

export function expectedLeaveBy(): string {
  return calculateLeaveBy(ACTIVITIES[0].startTime, 18, 7)
}
