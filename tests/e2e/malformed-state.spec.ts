import { expect, test } from '@playwright/test'
import { getReadiness } from '@/domain/readiness'
import type { InventoryState, Scan } from '@/domain/types'
import { ACTIVITIES } from '@/fixtures/activities'
import { DEMO_SESSION_NOW } from '@/fixtures/demo-scenario'

const requiredInventory: InventoryState[] = ACTIVITIES[0].requiredItemIds.map((itemId) => ({
  itemId,
  status: 'confirmed-present',
  confidence: 0.96,
  reasonCode: 'e2e-adversarial-state',
  supportingObservationIds: [],
  updatedAt: DEMO_SESSION_NOW,
}))

function scan(completedAt: string): Scan {
  return {
    id: 'scan_e2e_adversarial',
    startedAt: completedAt,
    completedAt,
    bagState: 'closed',
    status: 'completed',
    source: 'simulated-rfid',
  }
}

test('malformed and future state cannot cross the product readiness boundary', () => {
  for (const timestamp of ['not-a-timestamp', '2026-08-05T09:22:00-05:00']) {
    const readiness = getReadiness(ACTIVITIES[0], requiredInventory, [scan(timestamp)], 'connected', {
      now: DEMO_SESSION_NOW,
    })
    expect(readiness.state).toBe('scan-required')
  }

  const conflicting = [
    ...requiredInventory,
    { ...requiredInventory[0], status: 'not-detected' as const, reasonCode: 'conflicting-duplicate' },
  ]
  const readiness = getReadiness(ACTIVITIES[0], conflicting, [scan(DEMO_SESSION_NOW)], 'connected', {
    now: DEMO_SESSION_NOW,
  })
  expect(readiness.state).toBe('scan-required')

  for (const invalidState of [
    { ...requiredInventory[0]!, updatedAt: 'not-a-timestamp' },
    { ...requiredInventory[0]!, updatedAt: '2026-08-05T09:22:00-05:00' },
    { ...requiredInventory[0]!, confidence: Number.NaN },
  ]) {
    const inventory = [invalidState, ...requiredInventory.slice(1)]
    const invalidReadiness = getReadiness(ACTIVITIES[0], inventory, [scan(DEMO_SESSION_NOW)], 'connected', {
      now: DEMO_SESSION_NOW,
    })
    expect(invalidReadiness.state).toBe('scan-required')
  }
})
