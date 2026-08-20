import { closeBagAndScan, createDemoSession, openBag, setItemPresent } from '@/application/demo-scenario'
import { describe, expect, it } from 'vitest'

describe('decision loop integration', () => {
  it('connects simulated reader to inventory, readiness, alert, and notification', () => {
    let session = createDemoSession()
    session = closeBagAndScan(session)
    expect(session.inventory.find((state) => state.itemId === 'calculator')?.status).toBe('not-detected')
    expect(session.readiness.state).toBe('missing')
    expect(session.alerts).toHaveLength(1)
    expect(session.notifications).toHaveLength(1)
    session = openBag(session)
    session = setItemPresent(session, 'calculator', true)
    session = closeBagAndScan(session)
    expect(session.readiness.state).toBe('ready')
    expect(session.alerts[0]?.status).toBe('resolved')
  })
})
