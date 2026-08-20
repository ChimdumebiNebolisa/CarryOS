import { getLatestSuccessfulClosedScan } from '@/domain/inventory'
import { alertId } from '@/lib/ids'
import type {
  Activity,
  Alert,
  AlertEvidence,
  AlertType,
  InventoryConfig,
  InventoryState,
  Item,
  Scan,
} from '@/domain/types'
import { DEFAULT_CONFIG, UNRESOLVED_ALERT_STATUSES } from '@/domain/types'

function alertTypeForState(state: InventoryState): AlertType | undefined {
  if (state.status === 'not-detected') return 'missing-item'
  if (state.status === 'probably-present' || state.status === 'stale') return 'uncertain-item'
  return undefined
}

function evidenceFor(
  activity: Activity,
  item: Item,
  state: InventoryState,
  scan: Scan,
  leaveBy: string | undefined,
): AlertEvidence {
  const missing = state.status === 'not-detected'
  return {
    activityName: activity.name,
    itemName: item.name,
    latestScanAt: scan.completedAt ?? scan.startedAt,
    inventoryState: state.status,
    confidence: state.confidence,
    leaveBy,
    nextAction: missing
      ? `Open the bag, add ${item.name.toLowerCase()}, and scan again.`
      : `Open the bag and rescan ${item.name.toLowerCase()} before leaving.`,
    summary: missing
      ? `${item.name} not detected. ${activity.name} requires it. The latest closed-bag scan found no matching observation.`
      : `${item.name} has weak or inconsistent evidence. ${activity.name} still needs a stronger closed-bag read.`,
  }
}

function isUnresolved(alert: Alert): boolean {
  return UNRESOLVED_ALERT_STATUSES.includes(alert.status)
}

export function evaluateAlerts(
  activity: Activity,
  items: Item[],
  inventory: InventoryState[],
  scans: Scan[],
  existingAlerts: Alert[],
  options: {
    now: string
    leaveBy?: string
    config?: InventoryConfig
  },
): { alerts: Alert[]; created: Alert[]; updated: Alert[]; resolved: Alert[] } {
  const config = options.config ?? DEFAULT_CONFIG
  const nowMs = Date.parse(options.now)
  const startMs = Date.parse(activity.startTime)
  const leaveByMs = options.leaveBy ? Date.parse(options.leaveBy) : Number.NaN
  const activityEnded = activity.status === 'completed' || activity.status === 'cancelled' || nowMs >= startMs
  const withinWindow =
    Number.isFinite(leaveByMs) &&
    nowMs >= leaveByMs - config.alertLeadMinutes * 60_000 &&
    nowMs < startMs &&
    activity.status === 'upcoming'
  const successfulScan = getLatestSuccessfulClosedScan(scans)
  const validRecentScan =
    successfulScan?.completedAt !== undefined &&
    nowMs - Date.parse(successfulScan.completedAt) <= config.observationStaleMinutes * 60_000

  let alerts = existingAlerts.map((alert) => ({ ...alert }))
  const created: Alert[] = []
  const updated: Alert[] = []
  const resolved: Alert[] = []

  alerts = alerts.map((alert) => {
    if (!isUnresolved(alert) || alert.activityId !== activity.id) return alert
    if (activity.status === 'cancelled') {
      const next = { ...alert, status: 'resolved' as const, updatedAt: options.now, resolvedAt: options.now }
      resolved.push(next)
      return next
    }
    if (activityEnded) {
      const next = { ...alert, status: 'expired' as const, updatedAt: options.now, resolvedAt: options.now }
      return next
    }
    return alert
  })

  if (activity.status === 'cancelled' || activityEnded) {
    return { alerts, created, updated, resolved }
  }

  const requiredItems = activity.requiredItemIds
    .map((itemId) => items.find((item) => item.id === itemId))
    .filter((item): item is Item => item !== undefined)

  for (const item of requiredItems) {
    const state = inventory.find((candidate) => candidate.itemId === item.id)
    const matching = alerts.filter((alert) => alert.activityId === activity.id && alert.itemId === item.id)
    const unresolved = matching.filter(isUnresolved)

    if (unresolved.length > 1) {
      const keep = unresolved[unresolved.length - 1]
      alerts = alerts.map((alert) =>
        unresolved.some((candidate) => candidate.id === alert.id) && alert.id !== keep.id
          ? { ...alert, status: 'expired', updatedAt: options.now, resolvedAt: options.now }
          : alert,
      )
    }

    const open = alerts.find((alert) => alert.activityId === activity.id && alert.itemId === item.id && isUnresolved(alert))

    if (!state) {
      continue
    }

    if (state.status === 'confirmed-present' && open) {
      const next = { ...open, status: 'resolved' as const, updatedAt: options.now, resolvedAt: options.now }
      alerts = alerts.map((alert) => (alert.id === open.id ? next : alert))
      resolved.push(next)
      continue
    }

    if (!activity.requiredItemIds.includes(item.id) && open) {
      const next = { ...open, status: 'resolved' as const, updatedAt: options.now, resolvedAt: options.now }
      alerts = alerts.map((alert) => (alert.id === open.id ? next : alert))
      resolved.push(next)
      continue
    }

    const nextType = alertTypeForState(state)
    if (!withinWindow || !validRecentScan || !successfulScan || !nextType || !options.leaveBy) {
      continue
    }

    const nextEvidence = evidenceFor(activity, item, state, successfulScan, options.leaveBy)

    if (open) {
      if (open.type === nextType) {
        continue
      }
      const next = {
        ...open,
        type: nextType,
        stateVersion: open.stateVersion + 1,
        updatedAt: options.now,
        evidence: nextEvidence,
      }
      alerts = alerts.map((alert) => (alert.id === open.id ? next : alert))
      updated.push(next)
      continue
    }

    const revision = matching.length + 1
    const alert: Alert = {
      id: alertId({
        activityId: activity.id,
        itemId: item.id,
        type: nextType,
        scanId: successfulScan.id,
        revision,
      }),
      activityId: activity.id,
      itemId: item.id,
      type: nextType,
      status: 'active',
      stateVersion: 1,
      createdAt: options.now,
      updatedAt: options.now,
      evidence: nextEvidence,
    }
    alerts.push(alert)
    created.push(alert)
  }

  for (const open of alerts.filter((alert) => isUnresolved(alert) && alert.activityId === activity.id)) {
    if (!activity.requiredItemIds.includes(open.itemId)) {
      const next = { ...open, status: 'resolved' as const, updatedAt: options.now, resolvedAt: options.now }
      alerts = alerts.map((alert) => (alert.id === open.id ? next : alert))
      resolved.push(next)
    }
  }

  return { alerts, created, updated, resolved }
}

export function acknowledgeAlert(alerts: Alert[], alertIdValue: string, now: string): Alert[] {
  return alerts.map((alert) =>
    alert.id === alertIdValue && alert.status === 'active'
      ? { ...alert, status: 'acknowledged', updatedAt: now }
      : alert,
  )
}

export function suppressAlert(alerts: Alert[], alertIdValue: string, now: string): Alert[] {
  return alerts.map((alert) =>
    alert.id === alertIdValue && (alert.status === 'active' || alert.status === 'acknowledged')
      ? { ...alert, status: 'suppressed', updatedAt: now }
      : alert,
  )
}
