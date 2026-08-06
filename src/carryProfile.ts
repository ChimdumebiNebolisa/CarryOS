import type { Item } from './domain'

export type CarryProfileMode = 'ai' | 'fallback'

export interface CarryProfileContext {
  eventName: string
  eventType: string
  destination: string
  notes: string
}

export interface CarryProfileItemSuggestion {
  itemId: string
  confidence: number
  reason: string
}

export interface CarryProfileUnknownSuggestion {
  name: string
  category: string
  confidence: number
  reason: string
}

export interface CarryProfile {
  summary: string
  requiredItems: CarryProfileItemSuggestion[]
  optionalItems: CarryProfileItemSuggestion[]
  unregisteredSuggestions: CarryProfileUnknownSuggestion[]
}

export interface CarryProfileApiResponse {
  requestId: string
  mode: CarryProfileMode
  approved: false
  provider: 'openai-responses' | 'deterministic-fallback'
  profile: CarryProfile
  note: string
}

export const CARRY_PROFILE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'requiredItems', 'optionalItems', 'unregisteredSuggestions'],
  properties: {
    summary: { type: 'string' },
    requiredItems: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['itemId', 'confidence', 'reason'],
        properties: {
          itemId: { type: 'string' },
          confidence: { type: 'number' },
          reason: { type: 'string' },
        },
      },
    },
    optionalItems: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['itemId', 'confidence', 'reason'],
        properties: {
          itemId: { type: 'string' },
          confidence: { type: 'number' },
          reason: { type: 'string' },
        },
      },
    },
    unregisteredSuggestions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'category', 'confidence', 'reason'],
        properties: {
          name: { type: 'string' },
          category: { type: 'string' },
          confidence: { type: 'number' },
          reason: { type: 'string' },
        },
      },
    },
  },
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteConfidence(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
}

function isText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value).sort()
  return actual.length === keys.length && actual.every((key, index) => key === [...keys].sort()[index])
}

function parseRegisteredSuggestion(value: unknown, itemIds: Set<string>): CarryProfileItemSuggestion | undefined {
  if (!isRecord(value) || !hasExactKeys(value, ['itemId', 'confidence', 'reason'])) return undefined
  if (typeof value.itemId !== 'string' || !itemIds.has(value.itemId)) return undefined
  if (!isFiniteConfidence(value.confidence) || !isText(value.reason, 280)) return undefined
  return { itemId: value.itemId, confidence: value.confidence, reason: value.reason.trim() }
}

function parseUnknownSuggestion(value: unknown): CarryProfileUnknownSuggestion | undefined {
  if (!isRecord(value) || !hasExactKeys(value, ['name', 'category', 'confidence', 'reason'])) return undefined
  if (!isText(value.name, 80) || !isText(value.category, 60) || !isFiniteConfidence(value.confidence) || !isText(value.reason, 280)) {
    return undefined
  }
  return {
    name: value.name.trim(),
    category: value.category.trim(),
    confidence: value.confidence,
    reason: value.reason.trim(),
  }
}

export function validateCarryProfile(value: unknown, items: Item[]): CarryProfile | undefined {
  if (!isRecord(value) || !hasExactKeys(value, ['summary', 'requiredItems', 'optionalItems', 'unregisteredSuggestions'])) return undefined
  if (!isText(value.summary, 320) || !Array.isArray(value.requiredItems) || !Array.isArray(value.optionalItems) || !Array.isArray(value.unregisteredSuggestions)) {
    return undefined
  }

  const itemIds = new Set(items.map((item) => item.id))
  const requiredItems = value.requiredItems.map((item) => parseRegisteredSuggestion(item, itemIds))
  const optionalItems = value.optionalItems.map((item) => parseRegisteredSuggestion(item, itemIds))
  const unregisteredSuggestions = value.unregisteredSuggestions.map(parseUnknownSuggestion)
  if (requiredItems.some((item) => item === undefined) || optionalItems.some((item) => item === undefined) || unregisteredSuggestions.some((item) => item === undefined)) {
    return undefined
  }

  const required = requiredItems as CarryProfileItemSuggestion[]
  const optional = optionalItems as CarryProfileItemSuggestion[]
  const allIds = [...required, ...optional].map((item) => item.itemId)
  if (new Set(allIds).size !== allIds.length || required.some((item) => optional.some((candidate) => candidate.itemId === item.itemId))) {
    return undefined
  }

  return {
    summary: value.summary.trim(),
    requiredItems: required,
    optionalItems: optional,
    unregisteredSuggestions: unregisteredSuggestions as CarryProfileUnknownSuggestion[],
  }
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term))
}

export function createFallbackCarryProfile(context: CarryProfileContext, items: Item[]): CarryProfile {
  const text = `${context.eventName} ${context.eventType} ${context.destination} ${context.notes}`.toLowerCase()
  const find = (...terms: string[]) => items.find((item) => includesAny(`${item.name} ${item.category}`.toLowerCase(), terms))
  const required: Item[] = []

  const laptop = find('laptop', 'computer')
  const studentId = find('student id', 'id')
  const notebook = find('notebook', 'notes')
  const calculator = find('calculator', 'math')
  const keys = find('keys')
  const charger = find('charger')

  if (includesAny(text, ['exam', 'test', 'calculus', 'math'])) {
    for (const item of [laptop, notebook, calculator, studentId]) if (item && !required.includes(item)) required.push(item)
  } else if (includesAny(text, ['intern', 'work', 'office', 'interview'])) {
    for (const item of [laptop, charger, studentId, keys]) if (item && !required.includes(item)) required.push(item)
  } else {
    for (const item of [laptop, studentId, notebook]) if (item && !required.includes(item)) required.push(item)
  }

  const optional = items
    .filter((item) => !required.includes(item))
    .filter((item) => includesAny(text, item.name.toLowerCase().split(' ').concat(item.category.toLowerCase().split(' '))))
    .slice(0, 2)

  return {
    summary: required.length ? `Fallback profile matched ${required.length} registered items to “${context.eventName}”.` : 'Fallback profile found no strong registered-item matches.',
    requiredItems: required.map((item) => ({ itemId: item.id, confidence: 0.64, reason: `Matched the event context to the registered ${item.name.toLowerCase()} item.` })),
    optionalItems: optional.map((item) => ({ itemId: item.id, confidence: 0.42, reason: `The event text mentioned a related ${item.name.toLowerCase()} item, but not as a hard requirement.` })),
    unregisteredSuggestions: includesAny(text, ['gym', 'workout'])
      ? [{ name: 'Waterproof gym pouch', category: 'organization', confidence: 0.38, reason: 'The event context suggests a small organizer could reduce loose-item friction.' }]
      : [],
  }
}
