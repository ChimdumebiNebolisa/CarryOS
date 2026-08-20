import { DEMO_NOW } from '@/domain/types'

export interface Clock {
  now(): string
}

export class FixedClock implements Clock {
  constructor(private readonly iso = DEMO_NOW) {}

  now(): string {
    return this.iso
  }
}

export const demoClock = new FixedClock()
