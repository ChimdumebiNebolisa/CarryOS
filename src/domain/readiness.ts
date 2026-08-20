import { getLatestScan, getLatestSuccessfulClosedScan } from '@/domain/inventory'
import type { Activity, InventoryState, Readiness, Scan, SensorStatus } from '@/domain/types'
import { DEFAULT_CONFIG, type InventoryConfig } from '@/domain/types'

export function getReadiness(
  activity: Activity,
  inventory: InventoryState[],
  scans: Scan[],
  sensorStatus: SensorStatus,
  options: { now: string; config?: InventoryConfig } = { now: activity.startTime },
): Readiness {
  const requiredCount = activity.requiredItemIds.length
  const requiredStates = activity.requiredItemIds.map((itemId) =>
    inventory.find((state) => state.itemId === itemId),
  )
  const confirmedRequiredCount = requiredStates.filter((state) => state?.status === 'confirmed-present').length
  const latestScan = getLatestScan(scans)
  const successfulScan = getLatestSuccessfulClosedScan(scans)
  const config = options.config ?? DEFAULT_CONFIG

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
  if (Date.parse(options.now) - Date.parse(completedAt) > config.observationStaleMinutes * 60_000) {
    return {
      state: 'scan-required',
      label: 'Scan required',
      detail: 'The last closed-bag snapshot is too old to trust.',
      confirmedRequiredCount,
      requiredCount,
    }
  }

  if (requiredStates.some((state) => state === undefined)) {
    return {
      state: 'scan-required',
      label: 'Scan required',
      detail: 'A required item has no registered inventory state.',
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
