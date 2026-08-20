import type { InventoryState, Item, ItemStateStatus, Scan, TagObservation } from '@/domain/types'
import { DEFAULT_CONFIG, type InventoryConfig } from '@/domain/types'

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

export function getLatestScan(scans: Scan[]): Scan | undefined {
  return scans.reduce<Scan | undefined>((latest, scan) => {
    if (!latest) return scan
    return Date.parse(scan.startedAt) >= Date.parse(latest.startedAt) ? scan : latest
  }, undefined)
}

export function getLatestSuccessfulClosedScan(scans: Scan[]): Scan | undefined {
  return getLatestScan(
    scans.filter((scan) => scan.status === 'completed' && scan.bagState === 'closed' && scan.completedAt),
  )
}

function isRecent(timestamp: string, now: string, staleMinutes: number): boolean {
  return Date.parse(now) - Date.parse(timestamp) <= staleMinutes * 60_000
}

function isStrongEvidence(observation: TagObservation, config: InventoryConfig): boolean {
  const hintOk = observation.testLocationHint !== 'outside'
  const readsOk = observation.consecutiveReads >= config.minimumConsecutiveReads
  const signalOk =
    observation.signalStrength === undefined || observation.signalStrength >= config.minimumSignalStrength
  return observation.bagState === 'closed' && hintOk && readsOk && signalOk
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
  const latestScan = getLatestScan(scans)
  const successfulScan = getLatestSuccessfulClosedScan(scans)

  if (latestScan?.status === 'failed' && !successfulScan) {
    return items.map((item) => unknownState(item.id, options.now, 'scan-failed'))
  }

  if (!successfulScan) {
    const reason = latestScan?.status === 'failed' ? 'scan-failed' : 'no-valid-scan'
    return items.map((item) => unknownState(item.id, options.now, reason))
  }

  const scanTime = successfulScan.completedAt ?? successfulScan.startedAt
  const openedAfterScan =
    options.bagIsOpen &&
    options.lastBagOpenedAt !== undefined &&
    Date.parse(options.lastBagOpenedAt) >= Date.parse(scanTime)

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
    const stale = !isRecent(strongest.detectedAt, options.now, config.observationStaleMinutes)
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
