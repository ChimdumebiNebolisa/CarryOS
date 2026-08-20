import {
  getLatestScan,
  getLatestSuccessfulClosedScan,
  hasValidScanHistory,
  isValidInventoryState,
} from '@/domain/inventory'
import type { Activity, InventoryState, Readiness, Scan, SensorStatus } from '@/domain/types'
import { DEFAULT_CONFIG, type InventoryConfig } from '@/domain/types'
import { isFreshPastTimestamp, parseFiniteTimestamp } from '@/domain/time'

export function getReadiness(
  activity: Activity,
  inventory: InventoryState[],
  scans: Scan[],
  sensorStatus: SensorStatus,
  options: { now: string; config?: InventoryConfig } = { now: activity.startTime },
): Readiness {
  const requiredCount = activity.requiredItemIds.length
  const requiredStateGroups = activity.requiredItemIds.map((itemId) =>
    inventory.filter((state) => state.itemId === itemId),
  )
  const requiredStates = requiredStateGroups.map((states) => states[0])
  const confirmedRequiredCount = requiredStates.filter((state) => state?.status === 'confirmed-present').length
  const latestScan = getLatestScan(scans, options.now)
  const successfulScan = getLatestSuccessfulClosedScan(scans, options.now)
  const config = options.config ?? DEFAULT_CONFIG

  const nowMs = parseFiniteTimestamp(options.now)
  const startMs = parseFiniteTimestamp(activity.startTime)
  if (nowMs === undefined || startMs === undefined) {
    return {
      state: 'scan-required',
      label: 'Time unavailable',
      detail: 'Carry cannot evaluate readiness until activity and demonstration times are valid.',
      confirmedRequiredCount,
      requiredCount,
    }
  }

  if (activity.status !== 'upcoming' || nowMs >= startMs) {
    const label =
      activity.status === 'cancelled'
        ? 'Activity canceled'
        : activity.status === 'completed'
          ? 'Activity completed'
          : 'Activity underway'
    return {
      state: 'not-applicable',
      label,
      detail: 'Packing readiness is only evaluated for an upcoming activity before it starts.',
      confirmedRequiredCount,
      requiredCount,
    }
  }

  if (!hasValidScanHistory(scans, options.now)) {
    return {
      state: 'scan-required',
      label: 'Scan required',
      detail: 'Scan history contains invalid or future timing evidence.',
      confirmedRequiredCount,
      requiredCount,
    }
  }

  if (sensorStatus === 'disconnected' || latestScan?.status === 'failed') {
    return {
      state: 'sensor-unavailable',
      label: 'Sensor unavailable',
      detail: 'Reconnect the simulated reader and capture a fresh closed-bag snapshot.',
      confirmedRequiredCount,
      requiredCount,
    }
  }

  if (!successfulScan) {
    return {
      state: 'scan-required',
      label: 'Scan required',
      detail: 'No fresh closed-bag evidence yet.',
      confirmedRequiredCount,
      requiredCount,
    }
  }

  const completedAt = successfulScan.completedAt ?? successfulScan.startedAt
  if (!isFreshPastTimestamp(completedAt, options.now, config.observationStaleMinutes)) {
    return {
      state: 'scan-required',
      label: 'Scan required',
      detail: 'The last closed-bag snapshot is too old to trust.',
      confirmedRequiredCount,
      requiredCount,
    }
  }

  if (
    new Set(activity.requiredItemIds).size !== activity.requiredItemIds.length ||
    requiredStateGroups.some(
      (states) => states.length !== 1 || !isValidInventoryState(states[0]!, options.now),
    )
  ) {
    return {
      state: 'scan-required',
      label: 'Scan required',
      detail: 'Every required item must have exactly one registered inventory state.',
      confirmedRequiredCount,
      requiredCount,
    }
  }

  const states = requiredStates as InventoryState[]
  if (states.some((state) => state.status === 'not-detected')) {
    const missing = states.filter((state) => state.status === 'not-detected').length
    return {
      state: 'missing',
      label: missing === 1 ? 'Item missing' : `${missing} items missing`,
      detail: 'A required item was not detected in the latest closed-bag scan.',
      confirmedRequiredCount,
      requiredCount,
    }
  }

  if (states.some((state) => state.status === 'probably-present' || state.status === 'stale')) {
    return {
      state: 'uncertain',
      label: 'Uncertain',
      detail: 'A required item has weak, inconsistent, or stale evidence.',
      confirmedRequiredCount,
      requiredCount,
    }
  }

  if (states.some((state) => state.status === 'unknown')) {
    return {
      state: 'scan-required',
      label: 'Scan required',
      detail: 'Carry cannot evaluate every required item yet.',
      confirmedRequiredCount,
      requiredCount,
    }
  }

  return {
    state: 'ready',
    label: `Ready for ${activity.name}`,
    detail: `All ${requiredCount} required items were confirmed in the latest scan.`,
    confirmedRequiredCount,
    requiredCount,
  }
}
