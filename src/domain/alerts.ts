import { getLatestSuccessfulClosedScan, hasValidScanHistory, isValidInventoryState } from '@/domain/inventory'
import { alertId } from '@/lib/ids'
import type {
  Activity,
  Alert,
  AlertEvidence,
  AlertStatus,
  AlertType,
  InventoryConfig,
  InventoryState,
  Item,
  Scan,
} from '@/domain/types'
import { DEFAULT_CONFIG } from '@/domain/types'
import { isFreshPastTimestamp, parseFiniteTimestamp } from '@/domain/time'

interface AlertStatusSemantics {
  unresolved: boolean
  visible: boolean
  countable: boolean
  actionable: boolean
  transitions: readonly AlertStatus[]
}

export const ALERT_STATUS_SEMANTICS = {
  active: {
    unresolved: true,
    visible: true,
    countable: true,
    actionable: true,
    transitions: ['acknowledged', 'suppressed', 'resolved', 'expired'],
  },
  acknowledged: {
    unresolved: true,
    visible: true,
    countable: false,
    actionable: false,
    transitions: ['active', 'suppressed', 'resolved', 'expired'],
  },
  suppressed: {
    unresolved: true,
    visible: false,
    countable: false,
    actionable: false,
    transitions: ['active', 'resolved', 'expired'],
  },
  resolved: {
    unresolved: false,
    visible: false,
    countable: false,
    actionable: false,
    transitions: [],
  },
  expired: {
    unresolved: false,
    visible: false,
    countable: false,
    actionable: false,
    transitions: [],
  },
} as const satisfies Record<AlertStatus, AlertStatusSemantics>

export function canAlertTransition(from: AlertStatus, to: AlertStatus): boolean {
  return ALERT_STATUS_SEMANTICS[from].transitions.some((candidate) => candidate === to)
}

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

export function isAlertUnresolved(alert: Alert): boolean {
  return ALERT_STATUS_SEMANTICS[alert.status].unresolved
}

export function isAlertVisible(alert: Alert): boolean {
  return ALERT_STATUS_SEMANTICS[alert.status].visible
}

export function isAlertCountable(alert: Alert): boolean {
  return ALERT_STATUS_SEMANTICS[alert.status].countable
}

export function isAlertActionable(alert: Alert): boolean {
  return ALERT_STATUS_SEMANTICS[alert.status].actionable
}

function evidenceChanged(current: AlertEvidence, next: AlertEvidence): boolean {
  return (
    current.activityName !== next.activityName ||
    current.itemName !== next.itemName ||
    current.latestScanAt !== next.latestScanAt ||
    current.inventoryState !== next.inventoryState ||
    current.confidence !== next.confidence ||
    current.leaveBy !== next.leaveBy ||
    current.nextAction !== next.nextAction ||
    current.summary !== next.summary
  )
}

function snoozeExpired(alert: Alert, now: string): boolean {
  const nowMs = parseFiniteTimestamp(now)
  const snoozedUntilMs = parseFiniteTimestamp(alert.snoozedUntil)
  return nowMs !== undefined && snoozedUntilMs !== undefined && nowMs >= snoozedUntilMs
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
): {
  alerts: Alert[]
  created: Alert[]
  updated: Alert[]
  resolved: Alert[]
  expired: Alert[]
  reactivated: Alert[]
} {
  const config = options.config ?? DEFAULT_CONFIG
  const nowMs = parseFiniteTimestamp(options.now)
  const startMs = parseFiniteTimestamp(activity.startTime)
  const leaveByMs = parseFiniteTimestamp(options.leaveBy)
  const timingValid =
    nowMs !== undefined &&
    startMs !== undefined &&
    (options.leaveBy === undefined || (leaveByMs !== undefined && leaveByMs <= startMs))
  const activityEnded =
    timingValid &&
    (activity.status === 'active' || activity.status === 'completed' || activity.status === 'cancelled' || nowMs >= startMs)
  const withinWindow =
    timingValid &&
    leaveByMs !== undefined &&
    nowMs >= leaveByMs - config.alertLeadMinutes * 60_000 &&
    nowMs < startMs &&
    activity.status === 'upcoming'
  const successfulScan = getLatestSuccessfulClosedScan(scans, options.now)
  const validRecentScan =
    successfulScan?.completedAt !== undefined &&
    isFreshPastTimestamp(successfulScan.completedAt, options.now, config.observationStaleMinutes)

  let alerts = existingAlerts.map((alert) => ({ ...alert }))
  const created: Alert[] = []
  const updated: Alert[] = []
  const resolved: Alert[] = []
  const expired: Alert[] = []
  const reactivated: Alert[] = []

  if (!timingValid || !hasValidScanHistory(scans, options.now)) {
    return { alerts, created, updated, resolved, expired, reactivated }
  }

  alerts = alerts.map((alert) => {
    if (!isAlertUnresolved(alert) || alert.activityId !== activity.id) return alert
    if (activity.status === 'cancelled') {
      const next = { ...alert, status: 'resolved' as const, updatedAt: options.now, resolvedAt: options.now }
      resolved.push(next)
      return next
    }
    if (activityEnded) {
      const next = { ...alert, status: 'expired' as const, updatedAt: options.now, resolvedAt: options.now }
      expired.push(next)
      return next
    }
    return alert
  })

  if (activity.status === 'cancelled' || activityEnded) {
    return { alerts, created, updated, resolved, expired, reactivated }
  }

  alerts = alerts.map((alert) => {
    if (alert.activityId !== activity.id || alert.status !== 'suppressed' || !snoozeExpired(alert, options.now)) {
      return alert
    }
    const next = { ...alert, status: 'active' as const, snoozedUntil: undefined, updatedAt: options.now }
    reactivated.push(next)
    return next
  })

  const requiredItems = activity.requiredItemIds
    .map((itemId) => items.find((item) => item.id === itemId))
    .filter((item): item is Item => item !== undefined)

  for (const open of alerts.filter((alert) => isAlertUnresolved(alert) && alert.activityId === activity.id)) {
    if (!activity.requiredItemIds.includes(open.itemId)) {
      const next = { ...open, status: 'resolved' as const, updatedAt: options.now, resolvedAt: options.now }
      alerts = alerts.map((alert) => (alert.id === open.id ? next : alert))
      resolved.push(next)
    }
  }

  if (
    new Set(activity.requiredItemIds).size !== activity.requiredItemIds.length ||
    requiredItems.length !== activity.requiredItemIds.length ||
    activity.requiredItemIds.some((itemId) => {
      const states = inventory.filter((state) => state.itemId === itemId)
      return states.length !== 1 || !isValidInventoryState(states[0]!, options.now)
    })
  ) {
    return { alerts, created, updated, resolved, expired, reactivated }
  }

  for (const item of requiredItems) {
    const state = inventory.find((candidate) => candidate.itemId === item.id)
    const matching = alerts.filter((alert) => alert.activityId === activity.id && alert.itemId === item.id)
    const unresolved = matching.filter(isAlertUnresolved)

    if (unresolved.length > 1) {
      const keep = unresolved[unresolved.length - 1]
      alerts = alerts.map((alert) =>
        unresolved.some((candidate) => candidate.id === alert.id) && alert.id !== keep.id
          ? (() => {
              const next = { ...alert, status: 'expired' as const, updatedAt: options.now, resolvedAt: options.now }
              expired.push(next)
              return next
            })()
          : alert,
      )
    }

    const open = alerts.find(
      (alert) => alert.activityId === activity.id && alert.itemId === item.id && isAlertUnresolved(alert),
    )

    if (!state) {
      continue
    }

    if (state.status === 'confirmed-present' && open) {
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
      const changed = evidenceChanged(open.evidence, nextEvidence)
      if (open.type === nextType && !changed) {
        continue
      }
      const materiallyChanged = open.type !== nextType
      const next = {
        ...open,
        type: nextType,
        stateVersion: open.stateVersion + 1,
        updatedAt: options.now,
        evidence: nextEvidence,
        status: materiallyChanged ? ('active' as const) : open.status,
        snoozedUntil: materiallyChanged ? undefined : open.snoozedUntil,
      }
      alerts = alerts.map((alert) => (alert.id === open.id ? next : alert))
      updated.push(next)
      if (materiallyChanged && open.status !== 'active') reactivated.push(next)
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

  return { alerts, created, updated, resolved, expired, reactivated }
}

export function acknowledgeAlert(alerts: Alert[], alertIdValue: string, now: string): Alert[] {
  return alerts.map((alert) =>
    alert.id === alertIdValue && canAlertTransition(alert.status, 'acknowledged')
      ? { ...alert, status: 'acknowledged', updatedAt: now }
      : alert,
  )
}

export function suppressAlert(
  alerts: Alert[],
  alertIdValue: string,
  now: string,
  config: InventoryConfig = DEFAULT_CONFIG,
): Alert[] {
  const nowMs = parseFiniteTimestamp(now)
  const durationMs = config.alertDeduplicationMinutes * 60_000
  if (nowMs === undefined || !Number.isFinite(durationMs) || durationMs < 0) return alerts
  const snoozedUntil = new Date(nowMs + durationMs).toISOString()
  return alerts.map((alert) =>
    alert.id === alertIdValue && canAlertTransition(alert.status, 'suppressed')
      ? { ...alert, status: 'suppressed', snoozedUntil, updatedAt: now }
      : alert,
  )
}
