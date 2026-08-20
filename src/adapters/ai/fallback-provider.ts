import { createFallbackCarryProfile } from '@/domain/carry-profile'
import type { CarryProfileRequest, CarryProfileResult, Item } from '@/domain/types'

export function fallbackProfile(request: CarryProfileRequest, items: Item[]): CarryProfileResult {
  return createFallbackCarryProfile(request, items)
}
