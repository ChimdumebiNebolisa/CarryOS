import type { InventoryState, Item, ItemStateStatus, Scan, TagObservation } from '@/domain/types'
import { DEFAULT_CONFIG, type InventoryConfig } from '@/domain/types'
import { isFreshPastTimestamp, isOrderedInterval, parseFiniteTimestamp } from '@/domain/time'

const ITEM_STATE_STATUSES = new Set<ItemStateStatus>([
  'confirmed-present',
  'probably-present',
  'not-detected',
  'unknown',
  'stale',
])

function unknownState(itemId: string, updatedAt: string, reasonCode: string): InventoryState {
  return {
    itemId,
    status: 'unknown',
    confidence: 0,
    reasonCode,
    supportingObservationIds: [],
    updatedAt,
  }
}

export function isValidScan(scan: Scan, now?: string): boolean {
  const startedAt = parseFiniteTimestamp(scan.startedAt)
  const nowMs = now === undefined ? undefined : parseFiniteTimestamp(now)
  if (
    typeof scan.id !== 'string' ||
    scan.id.length === 0 ||
    !['open', 'closed'].includes(scan.bagState) ||
    startedAt === undefined ||
    (now !== undefined && (nowMs === undefined || startedAt > nowMs)) ||
    (scan.readsEvaluated !== undefined &&
      (!Number.isInteger(scan.readsEvaluated) || scan.readsEvaluated < 0))
  ) {
    return false
  }

  if (scan.status === 'running') return scan.completedAt === undefined
  if (scan.status !== 'completed' && scan.status !== 'failed') return false
  return scan.completedAt !== undefined && isOrderedInterval(scan.startedAt, scan.completedAt, now)
}

export function hasValidScanHistory(scans: Scan[], now?: string): boolean {
  return new Set(scans.map((scan) => scan.id)).size === scans.length && scans.every((scan) => isValidScan(scan, now))
}

export function isValidInventoryState(state: InventoryState, now: string): boolean {
  const nowMs = parseFiniteTimestamp(now)
  const updatedAt = parseFiniteTimestamp(state.updatedAt)
  return (
    typeof state.itemId === 'string' &&
    state.itemId.length > 0 &&
    ITEM_STATE_STATUSES.has(state.status) &&
    Number.isFinite(state.confidence) &&
    state.confidence >= 0 &&
    state.confidence <= 1 &&
    Array.isArray(state.supportingObservationIds) &&
    nowMs !== undefined &&
    updatedAt !== undefined &&
    updatedAt <= nowMs
  )
}

export function getLatestScan(scans: Scan[], now?: string): Scan | undefined {
  return scans.filter((scan) => isValidScan(scan, now)).reduce<Scan | undefined>((latest, scan) => {
    if (!latest) return scan
    return parseFiniteTimestamp(scan.startedAt)! >= parseFiniteTimestamp(latest.startedAt)! ? scan : latest
  }, undefined)
}

export function getLatestSuccessfulClosedScan(scans: Scan[], now?: string): Scan | undefined {
  return getLatestScan(
    scans.filter((scan) => scan.status === 'completed' && scan.bagState === 'closed' && scan.completedAt),
    now,
  )
}

function isStrongEvidence(observation: TagObservation, config: InventoryConfig): boolean {
  const hintOk = observation.testLocationHint !== 'outside'
  const readsOk = observation.consecutiveReads >= config.minimumConsecutiveReads
  const signalOk =
    observation.signalStrength === undefined || observation.signalStrength >= config.minimumSignalStrength
  return observation.bagState === 'closed' && hintOk && readsOk && signalOk
}

function isValidObservation(
  observation: TagObservation,
  items: Item[],
  scans: Scan[],
  now: string,
): boolean {
  const scan = scans.find((candidate) => candidate.id === observation.scanId)
  const item = items.find((candidate) => candidate.id === observation.itemId)
  const detectedAt = parseFiniteTimestamp(observation.detectedAt)
  const nowMs = parseFiniteTimestamp(now)
  if (
    !scan ||
    !item ||
    scan.status !== 'completed' ||
    scan.completedAt === undefined ||
    observation.tagId !== item.tagId ||
    observation.bagState !== scan.bagState ||
    !Number.isInteger(observation.consecutiveReads) ||
    observation.consecutiveReads < 0 ||
    (observation.signalStrength !== undefined && !Number.isFinite(observation.signalStrength)) ||
    detectedAt === undefined ||
    nowMs === undefined ||
    detectedAt > nowMs
  ) {
    return false
  }
  return isOrderedInterval(scan.startedAt, observation.detectedAt, scan.completedAt)
}

export function evaluateInventory(
  items: Item[],
  scans: Scan[],
  observations: TagObservation[],
  options: {
    now: string
    bagIsOpen: boolean
    lastBagOpenedAt?: string
    config?: InventoryConfig
  },
): InventoryState[] {
  const config = options.config ?? DEFAULT_CONFIG
  const lastBagOpenedAt = parseFiniteTimestamp(options.lastBagOpenedAt)
  const nowMs = parseFiniteTimestamp(options.now)
  if (
    !hasValidScanHistory(scans, options.now) ||
    new Set(observations.map((observation) => observation.id)).size !== observations.length ||
    observations.some((observation) => !isValidObservation(observation, items, scans, options.now)) ||
    (options.lastBagOpenedAt !== undefined &&
      (lastBagOpenedAt === undefined || nowMs === undefined || lastBagOpenedAt > nowMs))
  ) {
    return items.map((item) => unknownState(item.id, options.now, 'invalid-scan-timeline'))
  }
  const latestScan = getLatestScan(scans, options.now)
  const successfulScan = getLatestSuccessfulClosedScan(scans, options.now)

  if (latestScan?.status === 'failed' && !successfulScan) {
    return items.map((item) => unknownState(item.id, options.now, 'scan-failed'))
  }

  if (!successfulScan) {
    const reason = latestScan?.status === 'failed' ? 'scan-failed' : 'no-valid-scan'
    return items.map((item) => unknownState(item.id, options.now, reason))
  }

  const scanTime = successfulScan.completedAt ?? successfulScan.startedAt
  const scanTimeMs = parseFiniteTimestamp(scanTime)!
  const openedAfterScan = options.bagIsOpen || (lastBagOpenedAt !== undefined && lastBagOpenedAt > scanTimeMs)

  return items.map((item) => {
    const scanObservations = observations.filter(
      (observation) => observation.scanId === successfulScan.id && observation.tagId === item.tagId,
    )
    const historical = observations.filter((observation) => observation.tagId === item.tagId)

    if (openedAfterScan) {
      return {
        itemId: item.id,
        status: historical.length > 0 ? 'stale' : 'unknown',
        confidence: historical.length > 0 ? 0.38 : 0,
        reasonCode: historical.length > 0 ? 'bag-opened-after-scan' : 'no-evidence-after-bag-open',
        supportingObservationIds: historical.slice(-3).map((observation) => observation.id),
        updatedAt: options.lastBagOpenedAt ?? options.now,
      }
    }

    if (scanObservations.length === 0) {
      return {
        itemId: item.id,
        status: 'not-detected',
        confidence: 0.05,
        reasonCode: 'absent-from-closed-bag-scan',
        supportingObservationIds: [],
        updatedAt: scanTime,
      }
    }

    const strongest = [...scanObservations].sort((left, right) => right.consecutiveReads - left.consecutiveReads)[0]
    const stale = !isFreshPastTimestamp(strongest.detectedAt, options.now, config.observationStaleMinutes)
    if (stale) {
      return {
        itemId: item.id,
        status: 'stale',
        confidence: 0.38,
        reasonCode: 'observation-exceeded-stale-threshold',
        supportingObservationIds: scanObservations.map((observation) => observation.id),
        updatedAt: strongest.detectedAt,
      }
    }

    const confirmed = isStrongEvidence(strongest, config)
    const status: ItemStateStatus = confirmed ? 'confirmed-present' : 'probably-present'
    return {
      itemId: item.id,
      status,
      confidence: confirmed ? 0.96 : Math.max(0.25, Math.min(0.72, strongest.consecutiveReads / 10)),
      reasonCode: confirmed ? 'strong-inside-closed-bag-evidence' : 'weak-or-inconsistent-evidence',
      supportingObservationIds: scanObservations.map((observation) => observation.id),
      updatedAt: strongest.detectedAt,
    }
  })
}
