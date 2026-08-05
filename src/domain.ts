export const DEMO_NOW = '2026-08-05T08:21:00-05:00'

export type ActivityType = 'class' | 'exam' | 'internship'
export type ActivityStatus = 'upcoming' | 'active' | 'completed' | 'cancelled'
export type BagState = 'open' | 'closed' | 'scanning' | 'scan-complete' | 'sensor-unavailable'
export type SensorStatus = 'connected' | 'disconnected'
export type ScanStatus = 'running' | 'completed' | 'failed'
export type ItemStateStatus =
  | 'confirmed-present'
  | 'probably-present'
  | 'not-detected'
  | 'unknown'
  | 'stale'
export type AlertType = 'missing-item' | 'uncertain-item' | 'scan-required'
export type AlertStatus = 'active' | 'acknowledged' | 'suppressed' | 'resolved' | 'expired'

export interface Location {
  name: string
  address?: string
}

export interface Item {
  id: string
  name: string
  category: string
  tagId: string
  icon: string
  tagPlacement: string
  notes: string
}

export interface Activity {
  id: string
  name: string
  type: ActivityType
  startTime: string
  destination: Location
  travelMinutes: number
  departureBufferMinutes: number
  requiredItemIds: string[]
  optionalItemIds: string[]
  status: ActivityStatus
}

export interface TravelEstimate {
  durationMinutes: number
  bufferMinutes: number
  leaveBy: string
  provider: 'simulated'
  trafficMultiplier: number
}

export interface TagObservation {
  id: string
  itemId?: string
  tagId: string
  scanId: string
  detectedAt: string
  signalStrength: number
  consecutiveReads: number
  bagState: 'open' | 'closed'
  source: 'simulated-rfid' | 'm5stack-rfid'
  locationHint: 'inside' | 'outside' | 'unknown'
  confidenceContribution: number
  evidence: string
}

export interface Scan {
  id: string
  startedAt: string
  completedAt?: string
  bagState: 'open' | 'closed'
  status: ScanStatus
  source: 'simulated-rfid' | 'm5stack-rfid'
  readsEvaluated?: number
  error?: string
}

export interface InventoryState {
  itemId: string
  status: ItemStateStatus
  confidence: number
  lastUpdatedAt: string
  supportingObservationIds: string[]
  reasonCode: string
}

export interface AlertEvidence {
  itemName: string
  activityName: string
  leaveBy: string
  scanId: string
  latestScanAt: string
  state: ItemStateStatus
  confidence: number
  absentReadCount: number
  signalStrength?: number
  evidenceSummary: string
  nextAction: string
}

export interface Alert {
  id: string
  activityId: string
  itemId: string
  type: AlertType
  status: AlertStatus
  createdAt: string
  resolvedAt?: string
  evidence: AlertEvidence
}

export interface InventoryConfig {
  minimumConsecutiveReads: number
  minimumSignalStrength: number
  observationStaleMinutes: number
  alertLeadMinutes: number
  alertDeduplicationMinutes: number
}

export const DEFAULT_CONFIG: InventoryConfig = {
  minimumConsecutiveReads: 3,
  minimumSignalStrength: -65,
  observationStaleMinutes: 30,
  alertLeadMinutes: 20,
  alertDeduplicationMinutes: 30,
}

export interface SensorEvent {
  type: 'tag-added' | 'tag-removed' | 'reader-status' | 'scan-started' | 'scan-completed' | 'scan-failed'
  at: string
  detail: string
}

export interface ScanRequest {
  scanId: string
  startedAt: string
  bagState: 'closed'
}

export interface ScanResult {
  scan: Scan
  observations: TagObservation[]
}

export interface InventorySensor {
  connect(): Promise<void>
  disconnect(): Promise<void>
  getStatus(): SensorStatus
  scan(request: ScanRequest): Promise<ScanResult>
  subscribeToEvents(callback: (event: SensorEvent) => void): () => void
}

export interface Readiness {
  state: 'ready' | 'missing' | 'uncertain' | 'scan-required' | 'sensor-unavailable'
  label: string
  detail: string
}

export function calculateLeaveBy(
  startTime: string,
  travelMinutes: number,
  departureBufferMinutes: number,
): string {
  const start = new Date(startTime).getTime()
  return new Date(start - (travelMinutes + departureBufferMinutes) * 60_000).toISOString()
}

export function formatTime(value: string, withDate = false): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
    ...(withDate ? { month: 'short', day: 'numeric' } : {}),
  }).format(new Date(value))
}

export function minutesUntil(target: string, now: string): number {
  return Math.round((new Date(target).getTime() - new Date(now).getTime()) / 60_000)
}

export function getLatestScan(scans: Scan[]): Scan | undefined {
  return scans.reduce<Scan | undefined>((latest, scan) => {
    if (!latest) return scan
    return new Date(scan.startedAt).getTime() >= new Date(latest.startedAt).getTime() ? scan : latest
  }, undefined)
}

function unknownState(item: Item, updatedAt: string, reasonCode: string): InventoryState {
  return {
    itemId: item.id,
    status: 'unknown',
    confidence: 0,
    lastUpdatedAt: updatedAt,
    supportingObservationIds: [],
    reasonCode,
  }
}

export function evaluateInventory(
  items: Item[],
  scans: Scan[],
  observations: TagObservation[],
  options: {
    now: string
    config?: InventoryConfig
    bagState: BagState
    lastBagOpenedAt?: string
  },
): InventoryState[] {
  const config = options.config ?? DEFAULT_CONFIG
  const latestScan = getLatestScan(scans)

  if (!latestScan || latestScan.status !== 'completed' || latestScan.bagState !== 'closed') {
    return items.map((item) => unknownState(item, options.now, latestScan?.error ? 'reader-unavailable' : 'no-valid-scan'))
  }

  const scanTime = latestScan.completedAt ?? latestScan.startedAt
  const openedAfterScan =
    options.bagState === 'open' &&
    options.lastBagOpenedAt !== undefined &&
    new Date(options.lastBagOpenedAt).getTime() > new Date(scanTime).getTime()

  return items.map((item) => {
    const itemObservations = observations.filter(
      (observation) => observation.scanId === latestScan.id && observation.tagId === item.tagId,
    )
    const historicalObservations = observations.filter((observation) => observation.tagId === item.tagId)

    if (openedAfterScan) {
      return {
        itemId: item.id,
        status: historicalObservations.length > 0 ? 'stale' : 'unknown',
        confidence: historicalObservations.length > 0 ? 0.38 : 0,
        lastUpdatedAt: options.lastBagOpenedAt ?? options.now,
        supportingObservationIds: historicalObservations.slice(-3).map((observation) => observation.id),
        reasonCode: historicalObservations.length > 0 ? 'bag-opened-after-scan' : 'no-evidence-after-bag-open',
      }
    }

    if (itemObservations.length === 0) {
      return {
        itemId: item.id,
        status: 'not-detected',
        confidence: 0.05,
        lastUpdatedAt: scanTime,
        supportingObservationIds: [],
        reasonCode: 'absent-from-closed-bag-scan',
      }
    }

    const strongest = [...itemObservations].sort((a, b) => b.confidenceContribution - a.confidenceContribution)[0]
    const stale =
      new Date(options.now).getTime() - new Date(strongest.detectedAt).getTime() >
      config.observationStaleMinutes * 60_000
    const confirmed =
      !stale &&
      strongest.bagState === 'closed' &&
      strongest.locationHint === 'inside' &&
      strongest.consecutiveReads >= config.minimumConsecutiveReads &&
      strongest.signalStrength >= config.minimumSignalStrength

    if (stale) {
      return {
        itemId: item.id,
        status: 'stale',
        confidence: 0.38,
        lastUpdatedAt: strongest.detectedAt,
        supportingObservationIds: itemObservations.map((observation) => observation.id),
        reasonCode: 'observation-exceeded-stale-threshold',
      }
    }

    return {
      itemId: item.id,
      status: confirmed ? 'confirmed-present' : 'probably-present',
      confidence: confirmed ? 0.96 : Math.max(0.25, strongest.confidenceContribution),
      lastUpdatedAt: strongest.detectedAt,
      supportingObservationIds: itemObservations.map((observation) => observation.id),
      reasonCode: confirmed ? 'strong-inside-closed-bag-evidence' : 'weak-or-inconsistent-evidence',
    }
  })
}

export function getReadiness(
  activity: Activity,
  inventory: InventoryState[],
  latestScan: Scan | undefined,
  sensorStatus: SensorStatus,
): Readiness {
  if (sensorStatus === 'disconnected' || latestScan?.status === 'failed') {
    return {
      state: 'sensor-unavailable',
      label: 'Sensor unavailable',
      detail: 'Reconnect the simulated reader before trusting the inventory.',
    }
  }

  if (!latestScan || latestScan.status !== 'completed' || latestScan.bagState !== 'closed') {
    return {
      state: 'scan-required',
      label: 'Scan required',
      detail: 'Close the backpack to capture a fresh inventory snapshot.',
    }
  }

  const requiredStates = activity.requiredItemIds
    .map((itemId) => inventory.find((state) => state.itemId === itemId))
    .filter((state): state is InventoryState => state !== undefined)

  if (requiredStates.some((state) => state.status === 'not-detected')) {
    const missingCount = requiredStates.filter((state) => state.status === 'not-detected').length
    return {
      state: 'missing',
      label: `${missingCount} item${missingCount === 1 ? '' : 's'} missing`,
      detail: 'Carry found a requirement absent from the latest closed-bag scan.',
    }
  }

  if (requiredStates.some((state) => state.status === 'probably-present' || state.status === 'stale')) {
    return {
      state: 'uncertain',
      label: 'Uncertain inventory',
      detail: 'One or more required items need a stronger or newer observation.',
    }
  }

  if (requiredStates.some((state) => state.status === 'unknown')) {
    return {
      state: 'scan-required',
      label: 'Scan required',
      detail: 'Carry does not have enough evidence for every requirement.',
    }
  }

  return {
    state: 'ready',
    label: `Ready for ${activity.name}`,
    detail: `All ${requiredStates.length} required items were confirmed in the latest scan.`,
  }
}

function alertTypeForState(state: InventoryState): AlertType | undefined {
  if (state.status === 'not-detected') return 'missing-item'
  if (state.status === 'probably-present' || state.status === 'stale') return 'uncertain-item'
  return undefined
}

export function evaluateAlerts(
  activity: Activity,
  items: Item[],
  inventory: InventoryState[],
  scans: Scan[],
  existingAlerts: Alert[],
  options: { now: string; config?: InventoryConfig },
): Alert[] {
  const config = options.config ?? DEFAULT_CONFIG
  const latestScan = getLatestScan(scans)
  const leaveBy = calculateLeaveBy(activity.startTime, activity.travelMinutes, activity.departureBufferMinutes)
  const nowMs = new Date(options.now).getTime()
  const leaveByMs = new Date(leaveBy).getTime()
  const startMs = new Date(activity.startTime).getTime()
  const withinAlertWindow = nowMs >= leaveByMs - config.alertLeadMinutes * 60_000 && nowMs < startMs
  const validRecentScan =
    latestScan?.status === 'completed' &&
    latestScan.bagState === 'closed' &&
    latestScan.completedAt !== undefined &&
    nowMs - new Date(latestScan.completedAt).getTime() <= config.observationStaleMinutes * 60_000

  let alerts = existingAlerts.map((alert) => ({ ...alert }))
  const requiredItems = activity.requiredItemIds
    .map((itemId) => items.find((item) => item.id === itemId))
    .filter((item): item is Item => item !== undefined)

  for (const item of requiredItems) {
    const state = inventory.find((candidate) => candidate.itemId === item.id)
    if (!state) continue
    const alertType = alertTypeForState(state)
    const matching = alerts.filter((alert) => alert.activityId === activity.id && alert.itemId === item.id)

    if (state.status === 'confirmed-present') {
      alerts = alerts.map((alert) =>
        alert.activityId === activity.id && alert.itemId === item.id && ['active', 'acknowledged', 'suppressed'].includes(alert.status)
          ? { ...alert, status: 'resolved', resolvedAt: options.now }
          : alert,
      )
      continue
    }

    if (!withinAlertWindow || !validRecentScan || !alertType) continue

    const openDuplicate = matching.find((alert) =>
      alert.type === alertType && ['active', 'acknowledged', 'suppressed'].includes(alert.status),
    )
    if (openDuplicate) continue

    const readsEvaluated = latestScan.readsEvaluated ?? 0
    const evidence: AlertEvidence = {
      itemName: item.name,
      activityName: activity.name,
      leaveBy,
      scanId: latestScan.id,
      latestScanAt: latestScan.completedAt ?? latestScan.startedAt,
      state: state.status,
      confidence: state.confidence,
      absentReadCount: state.status === 'not-detected' ? readsEvaluated : 0,
      signalStrength: undefined,
      evidenceSummary:
        state.status === 'not-detected'
          ? `${item.name} was absent from the closed-bag scan. No matching tag observation was recorded across ${readsEvaluated || 'the full'} reads.`
          : `${item.name} was observed, but the evidence was weak, inconsistent, or stale (${Math.round(state.confidence * 100)}% confidence).`,
      nextAction:
        state.status === 'not-detected'
          ? `Open the bag, add ${item.name.toLowerCase()}, and scan again.`
          : `Open the bag and rescan ${item.name.toLowerCase()} before leaving.`,
    }
    alerts.push({
      id: `${activity.id}-${item.id}-${alertType}-${Date.now()}`,
      activityId: activity.id,
      itemId: item.id,
      type: alertType,
      status: 'active',
      createdAt: options.now,
      evidence,
    })
  }

  return alerts
}

export function statusLabel(status: ItemStateStatus): string {
  return {
    'confirmed-present': 'Confirmed',
    'probably-present': 'Probable',
    'not-detected': 'Not detected',
    unknown: 'Unknown',
    stale: 'Stale',
  }[status]
}
