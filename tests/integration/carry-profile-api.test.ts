import { handleCarryProfile } from '@/adapters/ai/carry-profile-service'
import { OpenAIProvider } from '@/adapters/ai/openai-provider'
import { createRateLimitStore } from '@/adapters/rate-limit/rate-limiter'
import { ITEMS } from '@/fixtures/items'
import { describe, expect, it } from 'vitest'

const validBody = JSON.stringify({
  event: {
    name: 'Calculus II exam',
    type: 'exam-lab',
    description: 'Closed-book exam. Non-graphing calculators are allowed.',
    location: 'Science Building',
    explicitInstructions: 'Bring student ID.',
  },
  registeredItems: ITEMS.map((item) => ({ itemId: item.id, name: item.name, category: item.category })),
})

class FakeProvider extends OpenAIProvider {
  constructor(private readonly impl: () => Promise<unknown>) {
    super('test-key', 'test-model')
  }

  configured(): boolean {
    return true
  }

  async infer(): Promise<unknown> {
    return this.impl()
  }
}

describe('carry-profile API', () => {
  it('rejects non-json content type', async () => {
    const result = await handleCarryProfile(validBody, 'text/plain', ITEMS, 'a')
    expect(result.status).toBe(415)
  })

  it('rejects oversized bodies', async () => {
    const result = await handleCarryProfile('{"x":"' + 'a'.repeat(9000) + '"}', 'application/json', ITEMS, 'b')
    expect(result.status).toBe(413)
  })

  it('returns fallback when the provider is not configured', async () => {
    const result = await handleCarryProfile(validBody, 'application/json', ITEMS, 'c', {
      provider: new OpenAIProvider(undefined, undefined),
    })
    expect(result.status).toBe(200)
    if ('source' in result.body) {
      expect(result.body.source).toBe('fallback')
      expect(result.body.requiredItems.length).toBeGreaterThan(0)
    }
  })

  it('returns model suggestions when validation passes', async () => {
    const provider = new FakeProvider(async () => ({
      requiredItems: [
        { itemId: 'calculator', confidence: 0.9, reason: 'Exam allows a calculator.', evidenceType: 'explicit' },
      ],
      optionalItems: [],
      excludedItems: [{ itemId: 'headphones', confidence: 0.4, reason: 'Not needed.', evidenceType: 'inferred' }],
      unregisteredSuggestions: [],
    }))
    const result = await handleCarryProfile(validBody, 'application/json', ITEMS, 'd', { provider })
    expect(result.status).toBe(200)
    if ('source' in result.body) {
      expect(result.body.source).toBe('model')
      expect(result.body.requiredItems[0]?.itemId).toBe('calculator')
    }
  })

  it('falls back on malformed output after retry', async () => {
    const provider = new FakeProvider(async () => ({ nope: true }))
    const result = await handleCarryProfile(validBody, 'application/json', ITEMS, 'e', { provider })
    expect(result.status).toBe(200)
    if ('source' in result.body) expect(result.body.source).toBe('fallback')
  })

  it('does not leak provider output on failure', async () => {
    const provider = new FakeProvider(async () => {
      throw new Error('secret stack')
    })
    const result = await handleCarryProfile(validBody, 'application/json', ITEMS, 'f', { provider })
    expect(JSON.stringify(result.body)).not.toContain('secret stack')
  })

  it('returns 429 when throttled', async () => {
    const store = createRateLimitStore()
    const nowMs = 1_000_000
    let last = await handleCarryProfile(validBody, 'application/json', ITEMS, 'throttle', {
      nowMs,
      store,
      provider: new OpenAIProvider(undefined, undefined),
    })
    for (let i = 0; i < 8; i += 1) {
      last = await handleCarryProfile(validBody, 'application/json', ITEMS, 'throttle', {
        nowMs,
        store,
        provider: new OpenAIProvider(undefined, undefined),
      })
    }
    expect(last.status).toBe(429)
    if ('code' in last.body) expect(last.body.code).toBe('rate-limited')
  })
})
