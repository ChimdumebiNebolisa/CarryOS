import { fallbackProfile } from '@/adapters/ai/fallback-provider'
import { OpenAIProvider } from '@/adapters/ai/openai-provider'
import { consumeRateLimit, createRateLimitStore, type RateLimitStore } from '@/adapters/rate-limit/rate-limiter'
import {
  carryProfileRequestSchema,
  INPUT_LIMITS,
  normalizeCarryProfile,
} from '@/domain/carry-profile'
import type { CarryProfileResult, Item } from '@/domain/types'

export interface CarryProfileHttpResult {
  status: number
  body: CarryProfileResult | { error: string; code: string }
}

const defaultStore: RateLimitStore = createRateLimitStore()

export async function handleCarryProfile(
  rawBody: string,
  contentType: string | null,
  items: Item[],
  clientKey: string,
  options: {
    nowMs?: number
    provider?: OpenAIProvider
    store?: RateLimitStore
  } = {},
): Promise<CarryProfileHttpResult> {
  const nowMs = options.nowMs ?? Date.now()
  const provider = options.provider ?? new OpenAIProvider()
  const store = options.store ?? defaultStore
  if (!contentType?.toLowerCase().includes('application/json')) {
    return { status: 415, body: { error: 'Send JSON.', code: 'unsupported-media-type' } }
  }
  if (Buffer.byteLength(rawBody, 'utf8') > INPUT_LIMITS.bodyBytes) {
    return { status: 413, body: { error: 'Request is too large.', code: 'payload-too-large' } }
  }

  if (!consumeRateLimit(store, clientKey, nowMs)) {
    return {
      status: 429,
      body: { error: 'Suggestions are temporarily limited. Try again shortly.', code: 'rate-limited' },
    }
  }

  let json: unknown
  try {
    json = JSON.parse(rawBody)
  } catch {
    return { status: 400, body: { error: 'The request was not valid JSON.', code: 'invalid-request' } }
  }

  const parsed = carryProfileRequestSchema.safeParse(json)
  if (!parsed.success) {
    return { status: 400, body: { error: 'Check the event fields and registered items.', code: 'invalid-request' } }
  }

  const allowedIds = new Set(items.map((item) => item.id))
  if (parsed.data.registeredItems.some((item) => !allowedIds.has(item.itemId))) {
    return { status: 400, body: { error: 'Registered items must match the catalog.', code: 'invalid-request' } }
  }

  if (!provider.configured()) {
    return { status: 200, body: fallbackProfile(parsed.data, items) }
  }

  try {
    const raw = await provider.infer(parsed.data, items)
    const normalized = normalizeCarryProfile(raw, items, 'model')
    if (normalized) return { status: 200, body: normalized }

    const retry = await provider.infer(parsed.data, items)
    const repaired = normalizeCarryProfile(retry, items, 'model')
    if (repaired) return { status: 200, body: repaired }
    return { status: 200, body: fallbackProfile(parsed.data, items) }
  } catch {
    return { status: 200, body: fallbackProfile(parsed.data, items) }
  }
}
