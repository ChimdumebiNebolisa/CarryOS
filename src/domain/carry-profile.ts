import { z } from 'zod'
import type {
  CarryProfileRequest,
  CarryProfileResult,
  CarrySuggestion,
  EventType,
  Item,
  UnregisteredSuggestion,
} from '@/domain/types'

export const EVENT_TYPES: EventType[] = ['class', 'exam-lab', 'internship', 'other']

export const INPUT_LIMITS = {
  eventName: 120,
  description: 1500,
  location: 200,
  explicitInstructions: 800,
  registeredItems: 20,
  bodyBytes: 8 * 1024,
  reason: 280,
  suggestionCap: 8,
} as const

const suggestionSchema = z.object({
  itemId: z.string().min(1),
  confidence: z.number().min(0).max(1),
  reason: z.string().trim().min(1).max(INPUT_LIMITS.reason),
  evidenceType: z.enum(['explicit', 'inferred']).optional(),
})

const unregisteredSchema = z.object({
  name: z.string().trim().min(1).max(80),
  confidence: z.number().min(0).max(1),
  reason: z.string().trim().min(1).max(INPUT_LIMITS.reason),
})

export const modelOutputSchema = z.object({
  requiredItems: z.array(suggestionSchema).default([]),
  optionalItems: z.array(suggestionSchema).default([]),
  excludedItems: z.array(suggestionSchema).default([]),
  unregisteredSuggestions: z.array(unregisteredSchema).default([]),
})

export const carryProfileRequestSchema = z.object({
  event: z.object({
    name: z.string().trim().min(1).max(INPUT_LIMITS.eventName),
    type: z.enum(['class', 'exam-lab', 'internship', 'other']),
    description: z.string().trim().min(1).max(INPUT_LIMITS.description),
    location: z.string().trim().max(INPUT_LIMITS.location).optional(),
    explicitInstructions: z.string().trim().max(INPUT_LIMITS.explicitInstructions).optional(),
  }),
  registeredItems: z
    .array(
      z.object({
        itemId: z.string().min(1),
        name: z.string().trim().min(1),
        category: z.string().trim().min(1),
      }),
    )
    .min(1)
    .max(INPUT_LIMITS.registeredItems),
})

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term))
}

function toSuggestion(item: Item, confidence: number, reason: string, evidenceType: 'explicit' | 'inferred'): CarrySuggestion {
  return { itemId: item.id, confidence, reason, evidenceType }
}

export function createFallbackCarryProfile(request: CarryProfileRequest, items: Item[]): CarryProfileResult {
  const text = [
    request.event.name,
    request.event.type,
    request.event.description,
    request.event.location ?? '',
    request.event.explicitInstructions ?? '',
  ]
    .join(' ')
    .toLowerCase()

  const find = (...terms: string[]) => items.find((item) => includesAny(`${item.name} ${item.id}`.toLowerCase(), terms))
  const laptop = find('laptop')
  const notebook = find('notebook')
  const calculator = find('calculator')
  const studentId = find('student-id', 'student id', 'id holder')
  const keys = find('keys')
  const charger = find('charger')
  const headphones = find('headphone')
  const water = find('water')

  const required: Item[] = []
  const push = (item: Item | undefined) => {
    if (item && !required.includes(item)) required.push(item)
  }

  if (request.event.type === 'exam-lab' || includesAny(text, ['exam', 'lab', 'calculus', 'test', 'quiz'])) {
    push(notebook)
    push(calculator)
    push(studentId)
    push(keys)
  } else if (request.event.type === 'internship' || includesAny(text, ['intern', 'work', 'office', 'shift'])) {
    push(laptop)
    push(charger)
    push(studentId)
    push(keys)
  } else {
    push(laptop)
    push(notebook)
    push(calculator)
    push(studentId)
  }

  for (const item of items) {
    const mentioned = includesAny(text, item.name.toLowerCase().split(' ').filter((part) => part.length > 3))
    if (mentioned) push(item)
  }

  const optional = [headphones, water].filter((item): item is Item => item !== undefined && !required.includes(item)).slice(0, 2)
  const excluded = items.filter((item) => !required.includes(item) && !optional.includes(item)).slice(0, 2)

  return {
    source: 'fallback',
    requiredItems: required.slice(0, 4).map((item) =>
      toSuggestion(item, 0.64, `Matched the event type and wording to the registered ${item.name.toLowerCase()}.`, 'inferred'),
    ),
    optionalItems: optional.map((item) =>
      toSuggestion(item, 0.42, `${item.name} is useful for this event but not required.`, 'inferred'),
    ),
    excludedItems: excluded.map((item) =>
      toSuggestion(item, 0.4, `${item.name} is not required for this event type.`, 'inferred'),
    ),
    unregisteredSuggestions: includesAny(text, ['gym', 'workout'])
      ? [{ name: 'Gym pouch', confidence: 0.38, reason: 'The event text mentions a gym context not covered by the registry.' }]
      : [],
  }
}

export function normalizeCarryProfile(
  raw: unknown,
  items: Item[],
  source: CarryProfileResult['source'],
): CarryProfileResult | undefined {
  const parsed = modelOutputSchema.safeParse(raw)
  if (!parsed.success) return undefined

  const registry = new Map(items.map((item) => [item.id, item]))
  const seen = new Set<string>()
  const unregistered: UnregisteredSuggestion[] = [...parsed.data.unregisteredSuggestions]
  const required: CarrySuggestion[] = []
  const optional: CarrySuggestion[] = []
  const excluded: CarrySuggestion[] = []

  const take = (
    list: z.infer<typeof suggestionSchema>[],
    target: CarrySuggestion[],
  ) => {
    for (const suggestion of list) {
      if (!registry.has(suggestion.itemId)) {
        unregistered.push({
          name: suggestion.itemId,
          confidence: suggestion.confidence,
          reason: suggestion.reason,
        })
        continue
      }
      if (seen.has(suggestion.itemId)) return false
      seen.add(suggestion.itemId)
      target.push({
        itemId: suggestion.itemId,
        confidence: suggestion.confidence,
        reason: suggestion.reason,
        evidenceType: suggestion.evidenceType ?? 'inferred',
      })
    }
    return true
  }

  if (!take(parsed.data.requiredItems, required)) return undefined
  if (!take(parsed.data.optionalItems, optional)) return undefined
  if (!take(parsed.data.excludedItems, excluded)) return undefined

  const total =
    required.length + optional.length + excluded.length + unregistered.length
  if (total === 0 || total > INPUT_LIMITS.suggestionCap) return undefined

  return {
    source,
    requiredItems: required,
    optionalItems: optional,
    excludedItems: excluded,
    unregisteredSuggestions: unregistered.slice(0, INPUT_LIMITS.suggestionCap),
  }
}

export function registeredItemsFromCatalog(items: Item[]): CarryProfileRequest['registeredItems'] {
  return items.map((item) => ({ itemId: item.id, name: item.name, category: item.category }))
}
