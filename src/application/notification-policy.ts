import type { Alert } from '@/domain/types'

export interface NotificationDecision {
  emitInApp: boolean
  emitBrowser: boolean
  alerts: Alert[]
}

export function shouldNotify(
  previous: Alert[],
  next: Alert[],
  browserPermission: NotificationPermission | 'unsupported',
): NotificationDecision {
  const previousById = new Map(previous.map((alert) => [alert.id, alert]))
  const newlyActionable = next.filter(
    (alert) => alert.status === 'active' && previousById.get(alert.id)?.status !== 'active',
  )

  const emitInApp = newlyActionable.length > 0
  return {
    emitInApp,
    emitBrowser: emitInApp && browserPermission === 'granted',
    alerts: newlyActionable,
  }
}
