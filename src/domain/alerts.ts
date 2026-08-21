import {
  getLatestScan,
  getLatestSuccessfulClosedScan,
  hasValidScanHistory,
  isValidInventoryState,
} from '@/domain/inventory'
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
  TagObservation,
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
    scanId: scan.id,
    latestScanAt: scan.completedAt ?? scan.startedAt,
    inventoryUpdatedAt: state.updatedAt,
    supportingObservationIds: [...state.supportingObservationIds],
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
    current.scanId !== next.scanId ||
    current.latestScanAt !== next.latestScanAt ||
    current.inventoryUpdatedAt !== next.inventoryUpdatedAt ||
    current.supportingObservationIds.length !== next.supportingObservationIds.length ||
    current.supportingObservationIds.some((id, index) => id !== next.supportingObservationIds[index]) ||
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

function newestAlert(alerts: Alert[]): Alert {
  return [...alerts].sort((left, right) => {
    const leftAt = parseFiniteTimestamp(left.updatedAt) ?? parseFiniteTimestamp(left.createdAt) ?? 0
    const rightAt = parseFiniteTimestamp(right.updatedAt) ?? parseFiniteTimestamp(right.createdAt) ?? 0
    return leftAt - rightAt || left.id.localeCompare(right.id)
  })[alerts.length - 1]!
}

export function evaluateAlerts(
  activity: Activity,
  items: Item[],
  inventory: InventoryState[],
  scans: Scan[],
  existingAlerts: Alert[],
  options: {
    now: string
    observations: TagObservation[]
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
  let alerts = existingAlerts.map((alert) => ({ ...alert, evidence: { ...alert.evidence } }))
  const created: Alert[] = []
  const updated: Alert[] = []
  const resolved: Alert[] = []
  const expired: Alert[] = []
  const reactivated: Alert[] = []

  const replace = (current: Alert, next: Alert) => {
    alerts = alerts.map((alert) => (alert.id === current.id ? next : alert))
  }
  const resolve = (current: Alert) => {
    const next = { ...current, status: 'resolved' as const, updatedAt: options.now, resolvedAt: options.now }
    replace(current, next)
    resolved.push(next)
  }
  const expire = (current: Alert) => {
    const next = { ...current, status: 'expired' as const, updatedAt: options.now, resolvedAt: options.now }
    replace(current, next)
    expired.push(next)
  }

  for (const open of alerts.filter((alert) => isAlertUnresolved(alert) && alert.activityId === activity.id)) {
    if (!activity.requiredItemIds.includes(open.itemId)) resolve(open)
  }

  if (activity.status === 'cancelled') {
    for (const open of alerts.filter((alert) => isAlertUnresolved(alert) && alert.activityId === activity.id)) resolve(open)
    return { alerts, created, updated, resolved, expired, reactivated }
  }
  if (activity.status === 'active' || activity.status === 'completed') {
    for (const open of alerts.filter((alert) => isAlertUnresolved(alert) && alert.activityId === activity.id)) expire(open)
    return { alerts, created, updated, resolved, expired, reactivated }
  }

  const nowMs = parseFiniteTimestamp(options.now)
  const startMs = parseFiniteTimestamp(activity.startTime)
  const leaveByMs = parseFiniteTimestamp(options.leaveBy)
  const timingValid =
    nowMs !== undefined &&
    startMs !== undefined &&
    (options.leaveBy === undefined || (leaveByMs !== undefined && leaveByMs <= startMs))
  if (timingValid && nowMs >= startMs) {
    for (const open of alerts.filter((alert) => isAlertUnresolved(alert) && alert.activityId === activity.id)) expire(open)
    return { alerts, created, updated, resolved, expired, reactivated }
  }
  if (!timingValid) return { alerts, created, updated, resolved, expired, reactivated }

  const unresolvedGroups = new Map<string, Alert[]>()
  for (const alert of alerts.filter((candidate) => isAlertUnresolved(candidate) && candidate.activityId === activity.id)) {
    const group = unresolvedGroups.get(alert.itemId) ?? []
    group.push(alert)
    unresolvedGroups.set(alert.itemId, group)
  }
  for (const group of unresolvedGroups.values()) {
    if (group.length < 2) continue
    const keep = newestAlert(group)
    for (const duplicate of group) {
      if (duplicate.id !== keep.id) expire(duplicate)
    }
  }

  const requiredItems = activity.requiredItemIds
    .map((itemId) => items.find((item) => item.id === itemId))
    .filter((item): item is Item => item !== undefined)
  if (
    !hasValidScanHistory(scans, options.now) ||
    new Set(activity.requiredItemIds).size !== activity.requiredItemIds.length ||
    requiredItems.length !== activity.requiredItemIds.length ||
    activity.requiredItemIds.some((itemId) => {
      const states = inventory.filter((state) => state.itemId === itemId)
      return (
        states.length !== 1 ||
        !isValidInventoryState(states[0]!, {
          now: options.now,
          items,
          scans,
          observations: options.observations,
          config,
        })
      )
    })
  ) {
    return { alerts, created, updated, resolved, expired, reactivated }
  }

  for (const item of requiredItems) {
    const state = inventory.find((candidate) => candidate.itemId === item.id)!
    const open = alerts.find(
      (alert) => alert.activityId === activity.id && alert.itemId === item.id && isAlertUnresolved(alert),
    )
    if (state.status === 'confirmed-present') {
      if (open) resolve(open)
      continue
    }

    const successfulScan = getLatestSuccessfulClosedScan(scans, options.now)
    const latestScan = getLatestScan(scans, options.now)
    const withinWindow =
      leaveByMs !== undefined &&
      nowMs >= leaveByMs - config.alertLeadMinutes * 60_000 &&
      nowMs < startMs &&
      activity.status === 'upcoming'
    const validRecentScan =
      successfulScan?.completedAt !== undefined &&
      isFreshPastTimestamp(successfulScan.completedAt, options.now, config.observationStaleMinutes)
    const nextType = alertTypeForState(state)
    if (!withinWindow || !successfulScan || latestScan?.status === 'failed' || !nextType || !options.leaveBy) {
      continue
    }

    const nextEvidence = evidenceFor(activity, item, state, successfulScan, options.leaveBy)
    if (open) {
      const changed = evidenceChanged(open.evidence, nextEvidence)
      const materiallyChanged = open.type !== nextType
      const deadlineReached = open.status === 'suppressed' && snoozeExpired(open, options.now)
      const becomesActive = (materiallyChanged || deadlineReached) && open.status !== 'active'
      if (!changed && !becomesActive) continue

      const next: Alert = {
        ...open,
        type: nextType,
        status: becomesActive ? 'active' : open.status,
        stateVersion: changed ? open.stateVersion + 1 : open.stateVersion,
        updatedAt: options.now,
        snoozedUntil: becomesActive ? undefined : open.snoozedUntil,
        evidence: nextEvidence,
      }
      replace(open, next)
      if (changed) updated.push(next)
      if (becomesActive) reactivated.push(next)
      continue
    }

    if (!validRecentScan) continue

    const matching = alerts.filter((alert) => alert.activityId === activity.id && alert.itemId === item.id)
    const alert: Alert = {
      id: alertId({
        activityId: activity.id,
        itemId: item.id,
        type: nextType,
        scanId: successfulScan.id,
        revision: matching.length + 1,
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
