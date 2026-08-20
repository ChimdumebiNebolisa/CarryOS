import { calculateLeaveBy } from '@/domain/timing'
import type { Activity, TravelEstimate } from '@/domain/types'

export type TravelResult =
  | { ok: true; estimate: TravelEstimate }
  | { ok: false; reason: 'unavailable' }

export function estimateTravel(activity: Activity, unavailable = false): TravelResult {
  if (unavailable || activity.travelMinutes === undefined) {
    return { ok: false, reason: 'unavailable' }
  }

  return {
    ok: true,
    estimate: {
      durationMinutes: activity.travelMinutes,
      bufferMinutes: activity.departureBufferMinutes,
      leaveBy: calculateLeaveBy(activity.startTime, activity.travelMinutes, activity.departureBufferMinutes),
      provider: 'simulated',
    },
  }
}
