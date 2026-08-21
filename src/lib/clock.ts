import { DEMO_NOW } from '@/domain/types'
import { parseFiniteTimestamp } from '@/domain/time'

export interface Clock {
  now(): string
}

export class AdvancingClock implements Clock {
  private readonly startedAtMs: number
  private readonly demoStartMs: number
  private lastMs: number

  constructor(
    start = DEMO_NOW,
    private readonly wallNow: () => number = () => Date.now(),
  ) {
    const parsed = parseFiniteTimestamp(start)
    if (parsed === undefined) throw new Error('Clock start must be a strict RFC 3339 timestamp.')
    this.demoStartMs = parsed
    this.lastMs = parsed
    this.startedAtMs = wallNow()
  }

  now(): string {
    const candidate = this.demoStartMs + Math.max(0, this.wallNow() - this.startedAtMs)
    this.lastMs = Math.max(this.lastMs, candidate)
    return new Date(this.lastMs).toISOString()
  }
}

export class ManualClock implements Clock {
  private currentMs: number

  constructor(start = DEMO_NOW) {
    const parsed = parseFiniteTimestamp(start)
    if (parsed === undefined) throw new Error('Clock start must be a strict RFC 3339 timestamp.')
    this.currentMs = parsed
  }

  now(): string {
    return new Date(this.currentMs).toISOString()
  }

  advanceBy(milliseconds: number): string {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) throw new Error('Clock advance must be finite and non-negative.')
    this.currentMs += milliseconds
    return this.now()
  }
}
