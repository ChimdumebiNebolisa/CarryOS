import { DEMO_NOW } from '@/domain/types'

export const DEMO_SESSION_NOW = DEMO_NOW

export const DEMO_REQUIRED_ITEM_IDS = ['laptop', 'charger', 'notebook', 'umbrella'] as const
export const DEMO_PRESENT_ITEM_IDS = ['laptop', 'charger', 'umbrella'] as const
export const DEMO_MISSING_ITEM_ID = 'notebook' as const
