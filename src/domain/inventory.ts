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

export interface ScanHistoryAssessment {
  currentScans: Scan[]
  corrupted: boolean
  recovered: boolean
}

export interface InventoryValidationContext {
  now: string
  items: Item[]
  scans: Scan[]
  observations: TagObservation[]
  config?: InventoryConfig
}

function unknownState(
  itemId: string,
  updatedAt: string,
  reasonCode: string,
  sourceScanId: string | null = null,
): InventoryState {
  return {
    itemId,
    status: 'unknown',
    confidence: 0,
    reasonCode,
    sourceScanId,
    supportingObservationIds: [],
    updatedAt,
  }
}

function isValidConfig(config: InventoryConfig): boolean {
  return (
    Number.isInteger(config.minimumConsecutiveReads) &&
    config.minimumConsecutiveReads >= 0 &&
    Number.isFinite(config.minimumSignalStrength) &&
    Number.isFinite(config.observationStaleMinutes) &&
    config.observationStaleMinutes >= 0 &&
    Number.isFinite(config.alertLeadMinutes) &&
    config.alertLeadMinutes >= 0 &&
    Number.isFinite(config.alertDeduplicationMinutes) &&
    config.alertDeduplicationMinutes >= 0
  )
}

export function isValidScan(scan: Scan, now?: string): boolean {
  const startedAt = parseFiniteTimestamp(scan.startedAt)
  const nowMs = now === undefined ? undefined : parseFiniteTimestamp(now)
  if (
    typeof scan.id !== 'string' ||
    scan.id.trim().length === 0 ||
    scan.source !== 'simulated-rfid' ||
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

export function assessScanHistory(scans: Scan[], now?: string): ScanHistoryAssessment {
  const seenIds = new Set<string>()
  let currentScans: Scan[] = []
  let corrupted = false

  for (const scan of scans) {
    const previous = currentScans[currentScans.length - 1]
    const previousAt = previous ? parseFiniteTimestamp(previous.completedAt ?? previous.startedAt) : undefined
    const startedAt = parseFiniteTimestamp(scan.startedAt)
    const invalid =
      seenIds.has(scan.id) ||
      !isValidScan(scan, now) ||
      (previousAt !== undefined && startedAt !== undefined && startedAt < previousAt)
    seenIds.add(scan.id)
    if (invalid) {
      corrupted = true
      currentScans = []
      continue
    }
    currentScans.push(scan)
  }

  return { currentScans, corrupted, recovered: corrupted && currentScans.length > 0 }
}

export function hasValidScanHistory(scans: Scan[], now?: string): boolean {
  if (scans.length === 0) return true
  return assessScanHistory(scans, now).currentScans.length > 0
}

export function getLatestScan(scans: Scan[], now?: string): Scan | undefined {
  return assessScanHistory(scans, now).currentScans.reduce<Scan | undefined>((latest, scan) => {
    if (!latest) return scan
    return parseFiniteTimestamp(scan.startedAt)! >= parseFiniteTimestamp(latest.startedAt)! ? scan : latest
  }, undefined)
}

export function getLatestSuccessfulClosedScan(scans: Scan[], now?: string): Scan | undefined {
  return assessScanHistory(scans, now).currentScans
    .filter((scan) => scan.status === 'completed' && scan.bagState === 'closed' && scan.completedAt)
    .reduce<Scan | undefined>((latest, scan) => {
      if (!latest) return scan
      return parseFiniteTimestamp(scan.completedAt)! >= parseFiniteTimestamp(latest.completedAt)! ? scan : latest
    }, undefined)
}

function isStrongEvidence(observation: TagObservation, config: InventoryConfig): boolean {
  const hintOk = observation.testLocationHint !== 'outside'
  const readsOk = observation.consecutiveReads >= config.minimumConsecutiveReads
  const signalOk =
    observation.signalStrength === undefined || observation.signalStrength >= config.minimumSignalStrength
  return observation.bagState === 'closed' && hintOk && readsOk && signalOk
}

export function isValidObservation(
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
    typeof observation.id !== 'string' ||
    observation.id.trim().length === 0 ||
    typeof observation.scanId !== 'string' ||
    observation.scanId.trim().length === 0 ||
    !scan ||
    !item ||
    observation.source !== 'simulated-rfid' ||
    scan.status !== 'completed' ||
    scan.completedAt === undefined ||
    observation.tagId !== item.tagId ||
    observation.bagState !== scan.bagState ||
    !Number.isInteger(observation.consecutiveReads) ||
    observation.consecutiveReads < 1 ||
    (observation.testLocationHint !== undefined &&
      !['inside', 'outside', 'unknown'].includes(observation.testLocationHint)) ||
    (observation.signalStrength !== undefined && !Number.isFinite(observation.signalStrength)) ||
    detectedAt === undefined ||
    nowMs === undefined ||
    detectedAt > nowMs
  ) {
    return false
  }
  return isOrderedInterval(scan.startedAt, observation.detectedAt, scan.completedAt)
}

export function isValidInventoryState(state: InventoryState, context: InventoryValidationContext): boolean {
  const config = context.config ?? DEFAULT_CONFIG
  const nowMs = parseFiniteTimestamp(context.now)
  const updatedAt = parseFiniteTimestamp(state.updatedAt)
  const item = context.items.find((candidate) => candidate.id === state.itemId)
  const latestSuccessfulScan = getLatestSuccessfulClosedScan(context.scans, context.now)
  const supportIds = state.supportingObservationIds
  if (
    !item ||
    typeof state.reasonCode !== 'string' ||
    state.reasonCode.length === 0 ||
    !ITEM_STATE_STATUSES.has(state.status) ||
    !Number.isFinite(state.confidence) ||
    state.confidence < 0 ||
    state.confidence > 1 ||
    !Array.isArray(supportIds) ||
    supportIds.some((id) => typeof id !== 'string' || id.trim().length === 0) ||
    new Set(supportIds).size !== supportIds.length ||
    nowMs === undefined ||
    updatedAt === undefined ||
    updatedAt > nowMs ||
    !isValidConfig(config) ||
    !(state.sourceScanId === null || (typeof state.sourceScanId === 'string' && state.sourceScanId.length > 0))
  ) {
    return false
  }

  if (state.sourceScanId === null) {
    return state.status === 'unknown' && state.confidence === 0 && supportIds.length === 0
  }
  if (!latestSuccessfulScan || state.sourceScanId !== latestSuccessfulScan.id) return false

  const currentObservations = context.observations.filter(
    (observation) => observation.scanId === latestSuccessfulScan.id,
  )
  if (
    new Set(currentObservations.map((observation) => observation.id)).size !== currentObservations.length ||
    currentObservations.some(
      (observation) => !isValidObservation(observation, context.items, context.scans, context.now),
    )
  ) {
    return false
  }

  const supportingObservations = supportIds.map((id) =>
    context.observations.find((observation) => observation.id === id),
  )
  if (
    supportingObservations.some((observation) => !observation) ||
    supportingObservations.some(
      (observation) =>
        observation!.scanId !== state.sourceScanId ||
        observation!.itemId !== state.itemId ||
        !isValidObservation(observation!, context.items, context.scans, context.now),
    )
  ) {
    return false
  }

  const observations = supportingObservations as TagObservation[]
  const itemObservations = currentObservations.filter((observation) => observation.itemId === state.itemId)
  const exactObservationSet =
    itemObservations.length === observations.length &&
    itemObservations.every((observation) => supportIds.includes(observation.id))
  const strongest = [...itemObservations].sort(
    (left, right) => right.consecutiveReads - left.consecutiveReads,
  )[0]
  const hasStrongEvidence = strongest ? isStrongEvidence(strongest, config) : false
  const hasFreshEvidence = strongest
    ? isFreshPastTimestamp(strongest.detectedAt, context.now, config.observationStaleMinutes)
    : false
  if (state.status === 'confirmed-present') {
    return (
      exactObservationSet &&
      observations.length > 0 &&
      hasStrongEvidence &&
      hasFreshEvidence &&
      state.confidence === 0.96 &&
      state.reasonCode === 'strong-inside-closed-bag-evidence' &&
      strongest?.detectedAt === state.updatedAt
    )
  }
  if (state.status === 'probably-present') {
    const expectedConfidence = strongest
      ? Math.max(0.25, Math.min(0.72, strongest.consecutiveReads / 10))
      : undefined
    return (
      exactObservationSet &&
      observations.length > 0 &&
      !hasStrongEvidence &&
      hasFreshEvidence &&
      state.confidence === expectedConfidence &&
      state.reasonCode === 'weak-or-inconsistent-evidence' &&
      strongest?.detectedAt === state.updatedAt
    )
  }
  if (state.status === 'not-detected') {
    return (
      itemObservations.length === 0 &&
      observations.length === 0 &&
      state.confidence === 0.05 &&
      state.reasonCode === 'absent-from-closed-bag-scan' &&
      state.updatedAt === (latestSuccessfulScan.completedAt ?? latestSuccessfulScan.startedAt)
    )
  }
  if (state.status === 'stale') {
    return (
      exactObservationSet &&
      observations.length > 0 &&
      state.confidence === 0.38 &&
      ['bag-opened-after-scan', 'observation-exceeded-stale-threshold'].includes(state.reasonCode)
    )
  }
  return state.confidence === 0 && observations.length === 0
}

export function hasEvidenceCorruption(
  items: Item[],
  scans: Scan[],
  observations: TagObservation[],
  now: string,
): boolean {
  return (
    assessScanHistory(scans, now).corrupted ||
    new Set(observations.map((observation) => observation.id)).size !== observations.length ||
    observations.some((observation) => !isValidObservation(observation, items, scans, now))
  )
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
  const history = assessScanHistory(scans, options.now)
  if (
    nowMs === undefined ||
    !isValidConfig(config) ||
    (scans.length > 0 && history.currentScans.length === 0) ||
    (options.lastBagOpenedAt !== undefined &&
      (lastBagOpenedAt === undefined || lastBagOpenedAt > nowMs))
  ) {
    return items.map((item) => unknownState(item.id, options.now, 'invalid-current-evidence'))
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

  const currentObservations = observations.filter((observation) => observation.scanId === successfulScan.id)
  if (
    new Set(currentObservations.map((observation) => observation.id)).size !== currentObservations.length ||
    currentObservations.some(
      (observation) => !isValidObservation(observation, items, history.currentScans, options.now),
    )
  ) {
    return items.map((item) =>
      unknownState(item.id, options.now, 'invalid-current-observation', successfulScan.id),
    )
  }

  const scanTime = successfulScan.completedAt ?? successfulScan.startedAt
  const scanTimeMs = parseFiniteTimestamp(scanTime)!
  const openedAfterScan = options.bagIsOpen || (lastBagOpenedAt !== undefined && lastBagOpenedAt > scanTimeMs)

  return items.map((item) => {
    const scanObservations = currentObservations.filter((observation) => observation.itemId === item.id)
    if (openedAfterScan) {
      return scanObservations.length > 0
        ? {
            itemId: item.id,
            status: 'stale',
            confidence: 0.38,
            reasonCode: 'bag-opened-after-scan',
            sourceScanId: successfulScan.id,
            supportingObservationIds: scanObservations.map((observation) => observation.id),
            updatedAt: options.lastBagOpenedAt ?? options.now,
          }
        : unknownState(item.id, options.lastBagOpenedAt ?? options.now, 'no-evidence-after-bag-open', successfulScan.id)
    }

    if (scanObservations.length === 0) {
      return {
        itemId: item.id,
        status: 'not-detected',
        confidence: 0.05,
        reasonCode: 'absent-from-closed-bag-scan',
        sourceScanId: successfulScan.id,
        supportingObservationIds: [],
        updatedAt: scanTime,
      }
    }

    const strongest = [...scanObservations].sort((left, right) => right.consecutiveReads - left.consecutiveReads)[0]!
    if (!isFreshPastTimestamp(strongest.detectedAt, options.now, config.observationStaleMinutes)) {
      return {
        itemId: item.id,
        status: 'stale',
        confidence: 0.38,
        reasonCode: 'observation-exceeded-stale-threshold',
        sourceScanId: successfulScan.id,
        supportingObservationIds: scanObservations.map((observation) => observation.id),
        updatedAt: strongest.detectedAt,
      }
    }

    const confirmed = isStrongEvidence(strongest, config)
    return {
      itemId: item.id,
      status: confirmed ? 'confirmed-present' : 'probably-present',
      confidence: confirmed ? 0.96 : Math.max(0.25, Math.min(0.72, strongest.consecutiveReads / 10)),
      reasonCode: confirmed ? 'strong-inside-closed-bag-evidence' : 'weak-or-inconsistent-evidence',
      sourceScanId: successfulScan.id,
      supportingObservationIds: scanObservations.map((observation) => observation.id),
      updatedAt: strongest.detectedAt,
    }
  })
}
