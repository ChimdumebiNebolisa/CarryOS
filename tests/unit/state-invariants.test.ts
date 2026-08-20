import { evaluateAlerts } from '@/domain/alerts'
import { evaluateInventory } from '@/domain/inventory'
import { getReadiness } from '@/domain/readiness'
import { calculateLeaveBy } from '@/domain/timing'
import type { Activity, InventoryState, Scan, TagObservation } from '@/domain/types'
import { ACTIVITIES } from '@/fixtures/activities'
import { DEMO_SESSION_NOW } from '@/fixtures/demo-scenario'
import { ITEMS } from '@/fixtures/items'
import { describe, expect, it } from 'vitest'

const activity = ACTIVITIES[0]

function completedScan(overrides: Partial<Scan> = {}): Scan {
  return {
    id: 'scan_invariant',
    startedAt: DEMO_SESSION_NOW,
    completedAt: DEMO_SESSION_NOW,
    bagState: 'closed',
    status: 'completed',
    source: 'simulated-rfid',
    readsEvaluated: ITEMS.length,
    ...overrides,
  }
}

function confirmedInventory(): InventoryState[] {
  return ITEMS.map((item) => ({
    itemId: item.id,
    status: 'confirmed-present',
    confidence: 0.96,
    reasonCode: 'test-confirmed',
    supportingObservationIds: [`observation_${item.id}`],
    updatedAt: DEMO_SESSION_NOW,
  }))
}

function strongObservation(scan: Scan, itemId = 'laptop', detectedAt = DEMO_SESSION_NOW): TagObservation {
  const item = ITEMS.find((candidate) => candidate.id === itemId)
  if (!item) throw new Error(`Unknown test item ${itemId}`)
  return {
    id: `observation_${itemId}`,
    scanId: scan.id,
    itemId,
    tagId: item.tagId,
    detectedAt,
    signalStrength: -45,
    consecutiveReads: 5,
    source: 'simulated-rfid',
    bagState: 'closed',
    testLocationHint: 'inside',
  }
}

describe('temporal and inventory invariants', () => {
  it.each([
    ['malformed completion timestamp', { completedAt: 'not-a-timestamp' }],
    ['future scan', { startedAt: '2026-08-05T09:22:00-05:00', completedAt: '2026-08-05T09:22:00-05:00' }],
    ['completion before start', { startedAt: '2026-08-05T09:20:00-05:00', completedAt: '2026-08-05T09:19:00-05:00' }],
  ])('does not become ready for a %s', (_name, overrides) => {
    const scan = completedScan(overrides)
    const readiness = getReadiness(activity, confirmedInventory(), [scan], 'connected', { now: DEMO_SESSION_NOW })
    expect(readiness.state).toBe('scan-required')
  })

  it('does not fall back to Ready when corrupted scan history also contains a valid scan', () => {
    const scans = [completedScan({ id: 'scan_valid' }), completedScan({ id: 'scan_future', startedAt: '2026-08-05T09:22:00-05:00', completedAt: '2026-08-05T09:22:00-05:00' })]
    const readiness = getReadiness(activity, confirmedInventory(), scans, 'connected', { now: DEMO_SESSION_NOW })
    expect(readiness.state).toBe('scan-required')
  })

  it('does not become ready when freshness inputs are non-finite', () => {
    const scan = completedScan()
    const readiness = getReadiness(activity, confirmedInventory(), [scan], 'connected', {
      now: DEMO_SESSION_NOW,
      config: {
        minimumConsecutiveReads: 3,
        minimumSignalStrength: -65,
        observationStaleMinutes: Number.NaN,
        alertLeadMinutes: 20,
        alertDeduplicationMinutes: 30,
      },
    })
    expect(readiness.state).toBe('scan-required')
  })

  it('requires exactly one inventory state for every required item', () => {
    const inventory = confirmedInventory()
    inventory.push({
      ...inventory.find((state) => state.itemId === 'notebook')!,
      status: 'not-detected',
      confidence: 0.05,
      reasonCode: 'conflicting-duplicate',
    })
    const readiness = getReadiness(activity, inventory, [completedScan()], 'connected', { now: DEMO_SESSION_NOW })
    expect(readiness.state).toBe('scan-required')
  })

  it.each([
    ['malformed inventory timestamp', { updatedAt: 'not-a-timestamp' }],
    ['future inventory timestamp', { updatedAt: '2026-08-05T09:22:00-05:00' }],
    ['non-finite inventory confidence', { confidence: Number.NaN }],
    ['out-of-range inventory confidence', { confidence: 1.1 }],
  ])('rejects a %s', (_name, overrides) => {
    const inventory = confirmedInventory()
    inventory[0] = { ...inventory[0]!, ...overrides }
    const readiness = getReadiness(activity, inventory, [completedScan()], 'connected', {
      now: DEMO_SESSION_NOW,
    })
    expect(readiness.state).toBe('scan-required')
  })

  it('rejects observations outside their scan interval', () => {
    const scan = completedScan({
      startedAt: '2026-08-05T09:20:00-05:00',
      completedAt: '2026-08-05T09:21:00-05:00',
    })
    const observation = strongObservation(scan, 'laptop', '2026-08-05T09:19:59-05:00')
    const inventory = evaluateInventory(ITEMS, [scan], [observation], { now: DEMO_SESSION_NOW, bagIsOpen: false })
    expect(inventory.every((state) => state.status === 'unknown')).toBe(true)
  })

  it.each(['not-a-timestamp', '2026-08-05T09:22:00-05:00'])(
    'rejects an invalid bag-open timestamp: %s',
    (lastBagOpenedAt) => {
      const inventory = evaluateInventory(ITEMS, [completedScan()], [], {
        now: DEMO_SESSION_NOW,
        bagIsOpen: false,
        lastBagOpenedAt,
      })
      expect(inventory.every((state) => state.status === 'unknown')).toBe(true)
    },
  )

  it('invalidates a scan when the bag was opened after it, even if the bag is closed again', () => {
    const scan = completedScan({
      startedAt: '2026-08-05T09:19:00-05:00',
      completedAt: '2026-08-05T09:20:00-05:00',
    })
    const observation = strongObservation(scan, 'laptop', '2026-08-05T09:20:00-05:00')
    const inventory = evaluateInventory(ITEMS, [scan], [observation], {
      now: DEMO_SESSION_NOW,
      bagIsOpen: false,
      lastBagOpenedAt: DEMO_SESSION_NOW,
    })
    expect(inventory.find((state) => state.itemId === 'laptop')?.status).toBe('stale')
  })

  it('rejects impossible activity timing before alert evaluation', () => {
    const impossible: Activity = { ...activity, startTime: 'not-a-timestamp' }
    const scan = completedScan()
    const result = evaluateAlerts(impossible, ITEMS, confirmedInventory(), [scan], [], {
      now: DEMO_SESSION_NOW,
      leaveBy: calculateLeaveBy(activity.startTime, 18, 7),
    })
    expect(result.created).toEqual([])
  })

  it('does not create an alert from conflicting required inventory states', () => {
    const scan = completedScan()
    const inventory = confirmedInventory()
    const notebook = inventory.find((state) => state.itemId === 'notebook')!
    inventory.push({ ...notebook, status: 'not-detected', confidence: 0.05 })
    const result = evaluateAlerts(activity, ITEMS, inventory, [scan], [], {
      now: DEMO_SESSION_NOW,
      leaveBy: calculateLeaveBy(activity.startTime, 18, 7),
    })
    expect(result.created).toEqual([])
  })
})

describe('activity-aware readiness', () => {
  it.each([
    ['cancelled', { status: 'cancelled' as const }, DEMO_SESSION_NOW],
    ['completed', { status: 'completed' as const }, DEMO_SESSION_NOW],
    ['active', { status: 'active' as const }, DEMO_SESSION_NOW],
    ['started', { status: 'upcoming' as const }, activity.startTime],
  ])('does not report Ready for a %s activity', (_name, overrides, now) => {
    const candidate: Activity = { ...activity, ...overrides }
    const readiness = getReadiness(candidate, confirmedInventory(), [completedScan()], 'connected', { now })
    expect(readiness.state).toBe('not-applicable')
  })
})
