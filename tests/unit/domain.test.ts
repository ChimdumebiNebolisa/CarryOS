import { evaluateAlerts } from '@/domain/alerts'
import { createFallbackCarryProfile, normalizeCarryProfile } from '@/domain/carry-profile'
import { evaluateInventory } from '@/domain/inventory'
import { getReadiness } from '@/domain/readiness'
import { calculateLeaveBy } from '@/domain/timing'
import { simulateClosedBagScan } from '@/adapters/inventory/simulated-rfid'
import { closeBagAndScan, createDemoSession, openBag, setItemPresent, setItemQuality, setItemLocationHint } from '@/application/demo-scenario'
import { scanId } from '@/lib/ids'
import { DEMO_NOW, type Item, type Scan } from '@/domain/types'
import { ACTIVITIES } from '@/fixtures/activities'
import { ITEMS } from '@/fixtures/items'
import { describe, expect, it } from 'vitest'

const activity = ACTIVITIES[0]

function closedScan(id = 'scan_test'): Scan {
  return {
    id,
    startedAt: DEMO_NOW,
    completedAt: DEMO_NOW,
    bagState: 'closed',
    status: 'completed',
    source: 'simulated-rfid',
    readsEvaluated: 8,
  }
}

function tags(present: string[], quality: 'strong' | 'weak' | 'intermittent' = 'strong') {
  return Object.fromEntries(
    ITEMS.map((item) => [
      item.id,
      {
        present: present.includes(item.id),
        quality,
        locationHint: 'inside' as const,
      },
    ]),
  )
}

describe('leave-by calculation', () => {
  it('subtracts travel and buffer from start time', () => {
    const leaveBy = calculateLeaveBy(activity.startTime, 18, 7)
    expect(new Date(leaveBy).toLocaleString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' })).toBe(
      '8:35 AM',
    )
  })
})

describe('inventory evaluation', () => {
  it('is unknown without a valid scan', () => {
    const inventory = evaluateInventory(ITEMS, [], [], { now: DEMO_NOW, bagIsOpen: true })
    expect(inventory.every((state) => state.status === 'unknown')).toBe(true)
  })

  it('confirms strong closed-bag evidence and marks absent items not-detected', () => {
    const scan = closedScan()
    const observations = simulateClosedBagScan({
      scan,
      items: ITEMS,
      tags: tags(['laptop', 'notebook', 'student-id']),
      now: DEMO_NOW,
    })
    const inventory = evaluateInventory(ITEMS, [scan], observations, { now: DEMO_NOW, bagIsOpen: false })
    expect(inventory.find((state) => state.itemId === 'laptop')?.status).toBe('confirmed-present')
    expect(inventory.find((state) => state.itemId === 'calculator')?.status).toBe('not-detected')
  })

  it('marks weak reads as probable', () => {
    const scan = closedScan()
    const observations = simulateClosedBagScan({
      scan,
      items: ITEMS,
      tags: tags(['calculator'], 'weak'),
      now: DEMO_NOW,
    })
    const inventory = evaluateInventory(ITEMS, [scan], observations, { now: DEMO_NOW, bagIsOpen: false })
    expect(inventory.find((state) => state.itemId === 'calculator')?.status).toBe('probably-present')
  })

  it('does not confirm outside-bag test hints', () => {
    const scan = closedScan()
    const observations = simulateClosedBagScan({
      scan,
      items: ITEMS,
      tags: {
        ...tags(['calculator']),
        calculator: { present: true, quality: 'strong', locationHint: 'outside' },
      },
      now: DEMO_NOW,
    })
    const inventory = evaluateInventory(ITEMS, [scan], observations, { now: DEMO_NOW, bagIsOpen: false })
    expect(inventory.find((state) => state.itemId === 'calculator')?.status).toBe('probably-present')
  })

  it('stales evidence after the bag opens', () => {
    const scan = closedScan()
    const observations = simulateClosedBagScan({
      scan,
      items: ITEMS,
      tags: tags(['laptop', 'notebook', 'calculator', 'student-id']),
      now: DEMO_NOW,
    })
    const inventory = evaluateInventory(ITEMS, [scan], observations, {
      now: DEMO_NOW,
      bagIsOpen: true,
      lastBagOpenedAt: '2026-08-05T08:22:00-05:00',
    })
    expect(inventory.find((state) => state.itemId === 'laptop')?.status).toBe('stale')
  })

  it('does not create not-detected truth from a failed scan', () => {
    const failed: Scan = { ...closedScan('scan_fail'), status: 'failed', error: 'fail' }
    const inventory = evaluateInventory(ITEMS, [failed], [], { now: DEMO_NOW, bagIsOpen: false })
    expect(inventory.every((state) => state.status === 'unknown')).toBe(true)
  })
})

describe('readiness', () => {
  it('uses sensor-unavailable before missing', () => {
    const scan: Scan = { ...closedScan(), status: 'failed' }
    const inventory = evaluateInventory(ITEMS, [scan], [], { now: DEMO_NOW, bagIsOpen: false })
    const readiness = getReadiness(activity, inventory, [scan], 'connected', { now: DEMO_NOW })
    expect(readiness.state).toBe('sensor-unavailable')
  })

  it('cannot be ready when a required item has no state', () => {
    const scan = closedScan()
    const inventory = evaluateInventory(ITEMS, [scan], [], { now: DEMO_NOW, bagIsOpen: false }).filter(
      (state) => state.itemId !== 'calculator',
    )
    const readiness = getReadiness(activity, inventory, [scan], 'connected', { now: DEMO_NOW })
    expect(readiness.state).toBe('scan-required')
  })

  it('does not let optional items block ready', () => {
    const scan = closedScan()
    const observations = simulateClosedBagScan({
      scan,
      items: ITEMS,
      tags: tags(['laptop', 'notebook', 'calculator', 'student-id']),
      now: DEMO_NOW,
    })
    const inventory = evaluateInventory(ITEMS, [scan], observations, { now: DEMO_NOW, bagIsOpen: false })
    const readiness = getReadiness(activity, inventory, [scan], 'connected', { now: DEMO_NOW })
    expect(readiness.state).toBe('ready')
    expect(inventory.find((state) => state.itemId === 'headphones')?.status).toBe('not-detected')
  })
})

describe('alerts', () => {
  it('creates one missing-item alert and updates it when evidence becomes uncertain', () => {
    const missingScan = closedScan('scan_1')
    const missingObs = simulateClosedBagScan({
      scan: missingScan,
      items: ITEMS,
      tags: tags(['laptop', 'notebook', 'student-id']),
      now: DEMO_NOW,
    })
    const missingInventory = evaluateInventory(ITEMS, [missingScan], missingObs, { now: DEMO_NOW, bagIsOpen: false })
    const leaveBy = calculateLeaveBy(activity.startTime, 18, 7)
    const first = evaluateAlerts(activity, ITEMS, missingInventory, [missingScan], [], { now: DEMO_NOW, leaveBy })
    expect(first.created).toHaveLength(1)
    expect(first.created[0]?.type).toBe('missing-item')

    const weakScan = closedScan('scan_2')
    const weakObs = simulateClosedBagScan({
      scan: weakScan,
      items: ITEMS,
      tags: {
        ...tags(['laptop', 'notebook', 'student-id']),
        calculator: { present: true, quality: 'weak', locationHint: 'inside' },
      },
      now: DEMO_NOW,
    })
    const weakInventory = evaluateInventory(ITEMS, [missingScan, weakScan], [...missingObs, ...weakObs], {
      now: DEMO_NOW,
      bagIsOpen: false,
    })
    const second = evaluateAlerts(activity, ITEMS, weakInventory, [missingScan, weakScan], first.alerts, {
      now: DEMO_NOW,
      leaveBy,
    })
    const unresolved = second.alerts.filter((alert) => ['active', 'acknowledged', 'suppressed'].includes(alert.status))
    expect(unresolved).toHaveLength(1)
    expect(unresolved[0]?.type).toBe('uncertain-item')
    expect(unresolved[0]?.id).toBe(first.created[0]?.id)
  })

  it('uses deterministic alert ids', () => {
    expect(scanId(DEMO_NOW, 1)).toBe(scanId(DEMO_NOW, 1))
  })
})

describe('carry profile', () => {
  it('builds labeled fallback from event type and names', () => {
    const result = createFallbackCarryProfile(
      {
        event: {
          name: 'Calculus II exam',
          type: 'exam-lab',
          description: 'Closed-book exam. Bring student ID.',
          location: 'Science Building',
        },
        registeredItems: ITEMS.map((item: Item) => ({ itemId: item.id, name: item.name, category: item.category })),
      },
      ITEMS,
    )
    expect(result.source).toBe('fallback')
    expect(result.requiredItems.some((item) => item.itemId === 'calculator')).toBe(true)
  })

  it('rejects unknown registered ids instead of accepting them', () => {
    const normalized = normalizeCarryProfile(
      {
        requiredItems: [{ itemId: 'jetpack', confidence: 0.9, reason: 'Nope', evidenceType: 'inferred' }],
        optionalItems: [],
        excludedItems: [],
        unregisteredSuggestions: [],
      },
      ITEMS,
      'model',
    )
    expect(normalized?.requiredItems).toEqual([])
    expect(normalized?.unregisteredSuggestions[0]?.name).toBe('jetpack')
  })
})

describe('demo scenario loop', () => {
  it('moves from scan required to missing to ready', () => {
    let session = createDemoSession()
    expect(session.readiness.state).toBe('scan-required')
    session = closeBagAndScan(session)
    expect(session.readiness.state).toBe('missing')
    expect(session.alerts.filter((alert) => alert.status === 'active')).toHaveLength(1)
    session = openBag(session)
    session = setItemPresent(session, 'calculator', true)
    session = closeBagAndScan(session)
    expect(session.readiness.state).toBe('ready')
    expect(session.alerts.some((alert) => alert.status === 'resolved')).toBe(true)
    session = openBag(session)
    expect(session.inventory.find((state) => state.itemId === 'laptop')?.status).toBe('stale')
    expect(session.readiness.state).not.toBe('ready')
  })

  it('keeps quality and location helpers available for failure labs', () => {
    let session = createDemoSession()
    session = setItemQuality(session, 'calculator', 'intermittent')
    session = setItemLocationHint(session, 'keys', 'outside')
    expect(session.tags.calculator.quality).toBe('intermittent')
    expect(session.tags.keys.locationHint).toBe('outside')
  })
})
