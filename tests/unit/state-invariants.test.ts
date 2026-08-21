import { closeBagAndScan, createDemoSession } from '@/application/demo-scenario'
import { simulateClosedBagScan } from '@/adapters/inventory/simulated-rfid'
import {
  assessScanHistory,
  evaluateInventory,
  hasEvidenceCorruption,
  isValidInventoryState,
} from '@/domain/inventory'
import { getReadiness } from '@/domain/readiness'
import { parseFiniteTimestamp } from '@/domain/time'
import { ManualClock } from '@/lib/clock'
import type { Activity, InventoryState, Scan, TagObservation } from '@/domain/types'
import { ACTIVITIES } from '@/fixtures/activities'
import { DEMO_SESSION_NOW } from '@/fixtures/demo-scenario'
import { ITEMS } from '@/fixtures/items'
import { describe, expect, it } from 'vitest'

const activity = ACTIVITIES[0]

function completedScan(id = 'scan_current', at = DEMO_SESSION_NOW): Scan {
  return {
    id,
    startedAt: at,
    completedAt: at,
    bagState: 'closed',
    status: 'completed',
    source: 'simulated-rfid',
    readsEvaluated: ITEMS.length,
  }
}

function observationsFor(scan: Scan, present = activity.requiredItemIds): TagObservation[] {
  return simulateClosedBagScan({
    scan,
    items: ITEMS,
    now: scan.completedAt!,
    tags: Object.fromEntries(
      ITEMS.map((item) => [
        item.id,
        { present: present.includes(item.id), quality: 'strong' as const, locationHint: 'inside' as const },
      ]),
    ),
  })
}

function derive(scans: Scan[], observations: TagObservation[], now = DEMO_SESSION_NOW): InventoryState[] {
  return evaluateInventory(ITEMS, scans, observations, { now, bagIsOpen: false })
}

function readiness(
  inventory: InventoryState[],
  scans: Scan[],
  observations: TagObservation[],
  now = DEMO_SESSION_NOW,
  candidate: Activity = activity,
) {
  return getReadiness(candidate, inventory, scans, 'connected', { now, items: ITEMS, observations })
}

describe('strict timestamp parsing', () => {
  it.each([
    '2026-08-05T09:21:00-05:00',
    '2026-08-05T14:21:00Z',
    '2026-08-05T14:21:00.1Z',
    '2024-02-29T23:59:59.999+00:00',
  ])('accepts supported RFC 3339 timestamp %s', (value) => {
    expect(parseFiniteTimestamp(value)).toEqual(expect.any(Number))
  })

  it.each([
    '0',
    '08/05/2026 09:21:00',
    '2026-08-05T09:21:00',
    '2026-02-30T09:21:00Z',
    '2026-08-05T24:00:00Z',
    '2026-08-05T09:21:60Z',
    '2026-08-05T09:21:00+24:00',
    '2026-8-5T9:21:00Z',
    '',
  ])('rejects unsupported timestamp %s', (value) => {
    expect(parseFiniteTimestamp(value)).toBeUndefined()
  })

  it('rejects non-string and non-finite inputs', () => {
    expect(parseFiniteTimestamp(0)).toBeUndefined()
    expect(parseFiniteTimestamp(Number.NaN)).toBeUndefined()
  })

  it('supports deterministic manual time advancement for lifecycle tests', () => {
    const clock = new ManualClock(DEMO_SESSION_NOW)
    expect(clock.advanceBy(29 * 60_000)).toBe('2026-08-05T14:50:00.000Z')
    expect(clock.advanceBy(2 * 60_000)).toBe('2026-08-05T14:52:00.000Z')
    expect(() => clock.advanceBy(Number.NaN)).toThrow()
  })
})

describe('Ready evidence provenance', () => {
  const scan = completedScan()
  const observations = observationsFor(scan)
  const validInventory = derive([scan], observations)

  it('returns Ready only for states derived from the latest scan and its observations', () => {
    expect(readiness(validInventory, [scan], observations).state).toBe('ready')
    for (const state of validInventory.filter((candidate) => activity.requiredItemIds.includes(candidate.itemId))) {
      expect(state.sourceScanId).toBe(scan.id)
      expect(state.supportingObservationIds.length).toBeGreaterThan(0)
    }
  })

  it.each([
    ['stale confirmed state', { updatedAt: '2026-08-05T09:20:00-05:00' }],
    ['confirmed state without observations', { supportingObservationIds: [] }],
    ['confirmed state with zero confidence', { confidence: 0 }],
    ['missing provenance', { sourceScanId: null }],
    ['duplicate supporting observations', {
      supportingObservationIds: [
        validInventory.find((state) => state.itemId === 'notebook')!.supportingObservationIds[0]!,
        validInventory.find((state) => state.itemId === 'notebook')!.supportingObservationIds[0]!,
      ],
    }],
  ])('fails closed for %s', (_name, overrides) => {
    const inventory = validInventory.map((state) =>
      state.itemId === 'notebook' ? { ...state, ...overrides } : state,
    )
    expect(readiness(inventory, [scan], observations).state).toBe('scan-required')
  })

  it('rejects a state derived from an earlier successful scan', () => {
    const earlier = completedScan('scan_earlier', '2026-08-05T09:20:00-05:00')
    const later = completedScan('scan_later', DEMO_SESSION_NOW)
    const earlierObservations = observationsFor(earlier)
    const laterObservations = observationsFor(later)
    const earlierInventory = derive([earlier], earlierObservations)
    expect(
      readiness(earlierInventory, [earlier, later], [...earlierObservations, ...laterObservations]).state,
    ).toBe('scan-required')
  })

  it('rejects an otherwise consistent confirmed state after its observation becomes stale', () => {
    const laterNow = '2026-08-05T09:52:01-05:00'
    expect(
      isValidInventoryState(validInventory.find((state) => state.itemId === 'notebook')!, {
        now: laterNow,
        items: ITEMS,
        scans: [scan],
        observations,
      }),
    ).toBe(false)
  })

  it('rejects contradictory status, confidence, and support', () => {
    const inventory = validInventory.map((state) =>
      state.itemId === 'notebook'
        ? { ...state, status: 'not-detected' as const, confidence: 0.96 }
        : state,
    )
    expect(readiness(inventory, [scan], observations).state).toBe('scan-required')
  })

  it('rejects duplicate observation provenance records', () => {
    expect(readiness(validInventory, [scan], [...observations, { ...observations[0]! }]).state).toBe(
      'scan-required',
    )
  })

  it.each([
    ['empty observation ID', { id: '' }],
    ['zero-read detection', { consecutiveReads: 0 }],
    ['invalid observation source', { source: 'physical-rfid' }],
  ])('rejects malformed current provenance: %s', (_name, overrides) => {
    const malformed = observations.map((observation) =>
      observation.itemId === 'notebook' ? { ...observation, ...overrides } : observation,
    ) as TagObservation[]
    expect(readiness(validInventory, [scan], malformed).state).toBe('scan-required')
  })

  it('requires exactly one registered state for every unique required item', () => {
    const duplicate = [...validInventory, { ...validInventory.find((state) => state.itemId === 'notebook')! }]
    expect(readiness(duplicate, [scan], observations).state).toBe('scan-required')
    expect(
      readiness(
        validInventory,
        [scan],
        observations,
        DEMO_SESSION_NOW,
        { ...activity, requiredItemIds: [...activity.requiredItemIds, 'notebook'] },
      ).state,
    ).toBe('scan-required')
  })

  it('rejects malformed, future, and impossible latest scans', () => {
    for (const invalid of [
      completedScan('malformed', 'not-a-timestamp'),
      completedScan('future', '2026-08-05T09:22:00-05:00'),
      { ...completedScan('backwards'), startedAt: '2026-08-05T09:21:01-05:00' },
    ]) {
      expect(readiness(validInventory, [invalid], observations).state).toBe('scan-required')
    }
  })
})

describe('corruption recovery', () => {
  it('quarantines malformed history and recovers at a later valid scan boundary', () => {
    const malformed = completedScan('scan_malformed', 'not-a-timestamp')
    const valid = completedScan('scan_recovery')
    const observations = observationsFor(valid)
    const inventory = derive([malformed, valid], observations)
    expect(assessScanHistory([malformed, valid], DEMO_SESSION_NOW)).toMatchObject({ corrupted: true, recovered: true })
    expect(hasEvidenceCorruption(ITEMS, [malformed, valid], observations, DEMO_SESSION_NOW)).toBe(true)
    expect(readiness(inventory, [malformed, valid], observations).state).toBe('ready')
  })

  it('keeps a malformed latest scan fail-closed', () => {
    const valid = completedScan('scan_valid')
    const malformed = completedScan('scan_malformed', 'not-a-timestamp')
    const observations = observationsFor(valid)
    const inventory = derive([valid, malformed], observations)
    expect(inventory.every((state) => state.status === 'unknown')).toBe(true)
    expect(readiness(inventory, [valid, malformed], observations).state).toBe('scan-required')
  })

  it('retains an explicit corruption trace after application recovery', () => {
    let session = createDemoSession()
    session = { ...session, scans: [completedScan('scan_malformed', 'not-a-timestamp')] }
    session = closeBagAndScan(session)
    expect(session.trace.some((event) => event.name === 'evidence-corruption-detected')).toBe(true)
    expect(session.readiness.state).toBe('missing')
  })
})

describe('activity-aware readiness', () => {
  const scan = completedScan()
  const observations = observationsFor(scan)
  const inventory = derive([scan], observations)

  it.each([
    ['cancelled', { status: 'cancelled' as const }, DEMO_SESSION_NOW],
    ['completed', { status: 'completed' as const }, DEMO_SESSION_NOW],
    ['active', { status: 'active' as const }, DEMO_SESSION_NOW],
    ['started', { status: 'upcoming' as const }, activity.startTime],
  ])('does not report Ready for a %s activity', (_name, overrides, now) => {
    expect(readiness(inventory, [scan], observations, now, { ...activity, ...overrides }).state).toBe(
      'not-applicable',
    )
  })
})
