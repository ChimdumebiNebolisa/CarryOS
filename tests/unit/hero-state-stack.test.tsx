import { describe, expect, it } from 'vitest'
import { buildHeroSnapshots } from '@/application/hero-states'

describe('hero states', () => {
  it('are produced by the shared domain engine', () => {
    const snapshots = buildHeroSnapshots()
    expect(snapshots.awaiting.readiness.state).toBe('scan-required')
    expect(snapshots.missing.readiness.state).toBe('missing')
    expect(snapshots.ready.readiness.state).toBe('ready')
    expect(snapshots.missing.confirmed).toBe(3)
    expect(snapshots.ready.confirmed).toBe(4)
    expect(snapshots.missing.title).toMatch(/not detected/i)
    expect(snapshots.ready.title).toMatch(/Ready/)
  })
})
