import { UNRESOLVED_ALERT_STATUSES, type Alert } from '@/domain/types'

export interface NotificationDecision {
  emitInApp: boolean
  emitBrowser: boolean
}

export function shouldNotify(
  previous: Alert[],
  next: Alert[],
  browserPermission: NotificationPermission | 'unsupported',
): NotificationDecision {
  const previousUnresolved = new Set(
    previous
      .filter((alert) => UNRESOLVED_ALERT_STATUSES.includes(alert.status))
      .map((alert) => `${alert.activityId}:${alert.itemId}`),
  )
  const newUnresolved = next.filter(
    (alert) =>
      alert.status === 'active' &&
      !previousUnresolved.has(`${alert.activityId}:${alert.itemId}`),
  )

  const emitInApp = newUnresolved.length > 0
  return {
    emitInApp,
    emitBrowser: emitInApp && browserPermission === 'granted',
  }
}
