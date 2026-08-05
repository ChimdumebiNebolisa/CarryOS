import { describe, expect, it } from 'vitest'
import {
  calculateLeaveBy,
  DEFAULT_CONFIG,
  DEMO_NOW,
  evaluateAlerts,
  evaluateInventory,
  formatTime,
  getReadiness,
  type InventoryConfig,
  type Scan,
  type TagObservation,
} from './domain'
import { ACTIVITIES, ITEMS } from './demoData'
import { SimulatedRFIDReader } from './simulator'

const config: InventoryConfig = { ...DEFAULT_CONFIG, observationStaleMinutes: 30 }

function makeScan(overrides: Partial<Scan> = {}): Scan {
  return {
    id: 'scan-1',
    startedAt: '2026-08-05T08:20:00-05:00',
    completedAt: '2026-08-05T08:20:00-05:00',
    bagState: 'closed',
    status: 'completed',
    source: 'simulated-rfid',
    ...overrides,
  }
}

function makeObservation(itemId: string, overrides: Partial<TagObservation> = {}): TagObservation {
  const item = ITEMS.find((candidate) => candidate.id === itemId)!
  return {
    id: `observation-${itemId}`,
    itemId,
    tagId: item.tagId,
    scanId: 'scan-1',
    detectedAt: '2026-08-05T08:20:00-05:00',
    signalStrength: -48,
    consecutiveReads: 6,
    bagState: 'closed',
    source: 'simulated-rfid',
    locationHint: 'inside',
    confidenceContribution: 0.96,
    evidence: 'test observation',
    ...overrides,
  }
}

describe('Carry inventory state engine', () => {
  it('distinguishes confirmed, probable, not detected, and unknown evidence', () => {
    const states = evaluateInventory(
      ITEMS.slice(0, 4),
      [makeScan()],
      [
        makeObservation('laptop'),
        makeObservation('notebook', { consecutiveReads: 2, signalStrength: -72, confidenceContribution: 0.63 }),
      ],
      { now: DEMO_NOW, bagState: 'scan-complete', config },
    )

    expect(states.find((state) => state.itemId === 'laptop')?.status).toBe('confirmed-present')
    expect(states.find((state) => state.itemId === 'notebook')?.status).toBe('probably-present')
    expect(states.find((state) => state.itemId === 'calculator')?.status).toBe('not-detected')

    const unknownStates = evaluateInventory(ITEMS.slice(0, 4), [], [], { now: DEMO_NOW, bagState: 'open', config })
    expect(unknownStates.every((state) => state.status === 'unknown')).toBe(true)
  })

  it('reduces confidence when the bag opens after a closed-bag observation', () => {
    const states = evaluateInventory(
      ITEMS.slice(0, 2),
      [makeScan()],
      [makeObservation('laptop')],
      {
        now: DEMO_NOW,
        bagState: 'open',
        lastBagOpenedAt: '2026-08-05T08:21:00-05:00',
        config,
      },
    )

    expect(states[0].status).toBe('stale')
    expect(states[0].reasonCode).toBe('bag-opened-after-scan')
  })

  it('does not confirm a tag marked outside the backpack', () => {
    const states = evaluateInventory(
      ITEMS.slice(0, 2),
      [makeScan()],
      [makeObservation('laptop', { locationHint: 'outside', consecutiveReads: 6, confidenceContribution: 0.32 })],
      { now: DEMO_NOW, bagState: 'scan-complete', config },
    )

    expect(states[0].status).toBe('probably-present')
    expect(states[0].confidence).toBe(0.32)
  })

  it('keeps a failed scan from producing a ready state', () => {
    const failedScan = makeScan({ status: 'failed', completedAt: '2026-08-05T08:21:00-05:00', error: 'Reader unavailable' })
    const states = evaluateInventory(ITEMS.slice(0, 4), [failedScan], [], { now: DEMO_NOW, bagState: 'sensor-unavailable', config })
    const readiness = getReadiness(ACTIVITIES[0], states, failedScan, 'connected')

    expect(states.every((state) => state.status === 'unknown')).toBe(true)
    expect(readiness.state).toBe('sensor-unavailable')
  })
})

describe('Carry timing and alert policy', () => {
  it('calculates the demo leave-by time', () => {
    expect(formatTime(calculateLeaveBy(ACTIVITIES[0].startTime, 18, 7))).toBe('8:35 AM')
  })

  it('creates one missing-item alert and deduplicates repeated evaluation', () => {
    const inventory = evaluateInventory(
      ITEMS,
      [makeScan()],
      [makeObservation('laptop'), makeObservation('notebook'), makeObservation('student-id')],
      { now: DEMO_NOW, bagState: 'scan-complete', config },
    )
    const first = evaluateAlerts(ACTIVITIES[0], ITEMS, inventory, [makeScan()], [], { now: DEMO_NOW, config })
    const second = evaluateAlerts(ACTIVITIES[0], ITEMS, inventory, [makeScan()], first, { now: DEMO_NOW, config })

    expect(first).toHaveLength(1)
    expect(first[0].type).toBe('missing-item')
    expect(first[0].evidence.itemName).toBe('Calculator')
    expect(second).toHaveLength(1)
  })

  it('resolves the alert after the missing item is confirmed', () => {
    const missingInventory = evaluateInventory(
      ITEMS,
      [makeScan()],
      [makeObservation('laptop'), makeObservation('notebook'), makeObservation('student-id')],
      { now: DEMO_NOW, bagState: 'scan-complete', config },
    )
    const alert = evaluateAlerts(ACTIVITIES[0], ITEMS, missingInventory, [makeScan()], [], { now: DEMO_NOW, config })
    const resolvedInventory = evaluateInventory(
      ITEMS,
      [makeScan()],
      [makeObservation('laptop'), makeObservation('notebook'), makeObservation('calculator'), makeObservation('student-id')],
      { now: DEMO_NOW, bagState: 'scan-complete', config },
    )
    const resolved = evaluateAlerts(ACTIVITIES[0], ITEMS, resolvedInventory, [makeScan()], alert, { now: DEMO_NOW, config })

    expect(resolved[0].status).toBe('resolved')
    expect(resolved[0].resolvedAt).toBe(DEMO_NOW)
  })
})

describe('SimulatedRFIDReader', () => {
  it('uses the hardware-neutral interface to emit observations', async () => {
    const reader = new SimulatedRFIDReader(ITEMS, {
      presentTagIds: new Set(['TAG-CALC-001']),
      signalStrengthByTag: { 'TAG-CALC-001': -48 },
      scanDelayMs: 0,
    })
    const result = await reader.scan({ scanId: 'scan-interface', startedAt: DEMO_NOW, bagState: 'closed' })

    expect(result.scan.status).toBe('completed')
    expect(result.observations[0].tagId).toBe('TAG-CALC-001')
    expect(result.observations[0].consecutiveReads).toBe(6)
    expect(reader.getStatus()).toBe('connected')
  })
})
