import {
  acknowledge,
  closeBagAndScan,
  createDemoSession,
  openBag,
  setItemPresent,
  suppress,
} from '@/application/demo-scenario'
import { shouldNotify } from '@/application/notification-policy'
import { canAlertTransition, isAlertActionable, isAlertCountable, isAlertVisible } from '@/domain/alerts'
import type { Alert } from '@/domain/types'
import { describe, expect, it } from 'vitest'

function missingSession() {
  return closeBagAndScan(createDemoSession())
}

describe('alert lifecycle state machine', () => {
  it('separates visible, countable, and actionable statuses', () => {
    const alert = missingSession().alerts[0]!
    const withStatus = (status: Alert['status']): Alert => ({ ...alert, status })

    expect(isAlertVisible(withStatus('active'))).toBe(true)
    expect(isAlertVisible(withStatus('acknowledged'))).toBe(true)
    expect(isAlertVisible(withStatus('suppressed'))).toBe(false)
    expect(isAlertCountable(withStatus('active'))).toBe(true)
    expect(isAlertCountable(withStatus('acknowledged'))).toBe(false)
    expect(isAlertActionable(withStatus('active'))).toBe(true)
    expect(isAlertActionable(withStatus('acknowledged'))).toBe(false)
    expect(canAlertTransition('active', 'acknowledged')).toBe(true)
    expect(canAlertTransition('suppressed', 'acknowledged')).toBe(false)
    expect(canAlertTransition('resolved', 'active')).toBe(false)
  })

  it('emits every newly active alert once and re-emits only after reactivation', () => {
    const first = missingSession().alerts[0]!
    const second = { ...first, id: `${first.id}_second`, itemId: 'charger' }

    expect(shouldNotify([], [first, second], 'granted').alerts).toEqual([first, second])
    expect(shouldNotify([first, second], [first, second], 'granted').alerts).toEqual([])

    const acknowledged = { ...first, status: 'acknowledged' as const }
    expect(shouldNotify([acknowledged, second], [first, second], 'granted').alerts).toEqual([first])
  })

  it('acknowledges an alert, clears its notification, and traces the transition', () => {
    const session = missingSession()
    const next = acknowledge(session, session.alerts[0]!.id)

    expect(next.alerts[0]?.status).toBe('acknowledged')
    expect(next.notifications).toEqual([])
    expect(next.trace[0]?.name).toBe('alert-acknowledged')
  })

  it('suppresses an alert until the configured snooze expires, then reactivates and notifies', () => {
    let session = missingSession()
    const alertId = session.alerts[0]!.id
    session = suppress(session, alertId)

    expect(session.alerts[0]?.status).toBe('suppressed')
    expect(session.alerts[0]?.snoozedUntil).toBe('2026-08-05T14:51:00.000Z')
    expect(session.notifications).toEqual([])
    expect(session.trace[0]?.name).toBe('alert-suppressed')

    session = closeBagAndScan({ ...session, now: '2026-08-05T09:50:00-05:00' })
    expect(session.alerts[0]?.status).toBe('suppressed')

    session = closeBagAndScan({ ...session, now: '2026-08-05T09:52:00-05:00' })
    expect(session.alerts[0]?.status).toBe('active')
    expect(session.notifications[0]?.alertId).toBe(alertId)
    expect(session.trace.some((event) => event.name === 'alert-reactivated')).toBe(true)
  })

  it('does not reactivate an alert with a malformed snooze deadline', () => {
    let session = missingSession()
    session = suppress(session, session.alerts[0]!.id)
    session = {
      ...session,
      alerts: session.alerts.map((alert) => ({ ...alert, snoozedUntil: 'not-a-timestamp' })),
      now: '2026-08-05T09:52:00-05:00',
    }
    session = closeBagAndScan(session)

    expect(session.alerts[0]?.status).toBe('suppressed')
    expect(session.notifications).toEqual([])
  })

  it('refreshes evidence for a newer scan without creating a duplicate alert', () => {
    let session = missingSession()
    const original = session.alerts[0]!
    session = closeBagAndScan({ ...session, now: '2026-08-05T09:22:00-05:00' })

    expect(session.alerts.filter((alert) => alert.status === 'active')).toHaveLength(1)
    expect(session.alerts[0]?.id).toBe(original.id)
    expect(session.alerts[0]?.stateVersion).toBe(original.stateVersion + 1)
    expect(session.alerts[0]?.evidence.latestScanAt).toBe('2026-08-05T09:22:00-05:00')
  })

  it('resolves the alert and removes its notification when evidence confirms the item', () => {
    let session = missingSession()
    session = openBag(session)
    session = setItemPresent(session, 'notebook', true)
    session = closeBagAndScan(session)

    expect(session.alerts.some((alert) => alert.status === 'resolved')).toBe(true)
    expect(session.notifications).toEqual([])
  })

  it('expires an alert after the activity starts and traces the transition', () => {
    let session = missingSession()
    session = openBag({ ...session, now: session.activity.startTime })

    expect(session.alerts[0]?.status).toBe('expired')
    expect(session.notifications).toEqual([])
    expect(session.trace.some((event) => event.name === 'alert-expired')).toBe(true)
  })

  it('expires an alert when the activity status is active', () => {
    let session = missingSession()
    session = openBag({ ...session, activity: { ...session.activity, status: 'active' } })

    expect(session.alerts[0]?.status).toBe('expired')
    expect(session.notifications).toEqual([])
  })

  it('resolves an alert when its activity is canceled', () => {
    let session = missingSession()
    session = openBag({ ...session, activity: { ...session.activity, status: 'cancelled' } })

    expect(session.alerts[0]?.status).toBe('resolved')
    expect(session.readiness.state).toBe('not-applicable')
    expect(session.notifications).toEqual([])
  })

  it('resolves an alert when its requirement is removed', () => {
    let session = missingSession()
    session = openBag({
      ...session,
      activity: {
        ...session.activity,
        requiredItemIds: session.activity.requiredItemIds.filter((itemId) => itemId !== 'notebook'),
      },
    })

    expect(session.alerts.find((alert) => alert.itemId === 'notebook')?.status).toBe('resolved')
  })

  it('deduplicates corrupted unresolved history by activity and item', () => {
    let session = missingSession()
    const duplicate = { ...session.alerts[0]!, id: `${session.alerts[0]!.id}_duplicate` }
    session = closeBagAndScan({ ...session, alerts: [...session.alerts, duplicate] })

    const unresolved = session.alerts.filter(
      (alert) => alert.itemId === 'notebook' && ['active', 'acknowledged', 'suppressed'].includes(alert.status),
    )
    expect(unresolved).toHaveLength(1)
  })
})
