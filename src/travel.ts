import { calculateLeaveBy } from './domain'
import type { Location, TravelEstimate } from './domain'

export interface TravelTimeProvider {
  getTravelEstimate(origin: Location, destination: Location, departureTime: string): Promise<TravelEstimate>
}

export class SimulatedTravelTimeProvider implements TravelTimeProvider {
  constructor(
    private readonly durationMinutes: number,
    private readonly bufferMinutes: number,
    private readonly trafficMultiplier = 1,
  ) {}

  async getTravelEstimate(_origin: Location, _destination: Location, departureTime: string): Promise<TravelEstimate> {
    const durationMinutes = Math.round(this.durationMinutes * this.trafficMultiplier)
    return {
      durationMinutes,
      bufferMinutes: this.bufferMinutes,
      leaveBy: calculateLeaveBy(departureTime, durationMinutes, this.bufferMinutes),
      provider: 'simulated',
      trafficMultiplier: this.trafficMultiplier,
    }
  }
}

/** Placeholder boundary for a future maps-backed implementation. */
export class MapsTravelTimeProvider implements TravelTimeProvider {
  async getTravelEstimate(): Promise<TravelEstimate> {
    throw new Error('Maps travel-time integration is intentionally outside the MVP.')
  }
}
