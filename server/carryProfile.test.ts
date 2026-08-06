import { describe, expect, it } from 'vitest'
import { ITEMS } from '../src/demoData'
import { validateCarryProfile, type CarryProfileContext } from '../src/carryProfile'
import { handleCarryProfileRequest, OpenAIResponsesProvider, type CarryProfileModelProvider } from './carryProfile'

const context: CarryProfileContext = {
  eventName: 'Calculus II',
  eventType: 'Class',
  destination: 'Science Building',
  notes: 'Bring materials for a morning math class.',
}

const validProfile = {
  summary: 'A concise class carry profile.',
  requiredItems: [{ itemId: 'calculator', confidence: 0.91, reason: 'Math class needs calculations.' }],
  optionalItems: [{ itemId: 'headphones', confidence: 0.35, reason: 'Useful during independent work.' }],
  unregisteredSuggestions: [{ name: 'Formula card', category: 'study', confidence: 0.55, reason: 'Helpful for quick reference.' }],
}

describe('carry profile validation and provider boundary', () => {
  it('accepts the strict registered-item profile shape', () => {
    const profile = validateCarryProfile(validProfile, ITEMS)

    expect(profile?.requiredItems[0].itemId).toBe('calculator')
    expect(profile?.unregisteredSuggestions[0].name).toBe('Formula card')
  })

  it('rejects unknown registered IDs, duplicate assignments, and extra keys', () => {
    expect(validateCarryProfile({ ...validProfile, requiredItems: [{ ...validProfile.requiredItems[0], itemId: 'not-registered' }] }, ITEMS)).toBeUndefined()
    expect(validateCarryProfile({ ...validProfile, optionalItems: [{ ...validProfile.requiredItems[0] }] }, ITEMS)).toBeUndefined()
    expect(validateCarryProfile({ ...validProfile, extra: true }, ITEMS)).toBeUndefined()
  })

  it('returns model output only as an unapproved suggestion', async () => {
    const provider: CarryProfileModelProvider = {
      name: 'openai-responses',
      infer: async () => validProfile,
    }
    const result = await handleCarryProfileRequest(context, ITEMS, provider)

    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({ mode: 'ai', approved: false, provider: 'openai-responses' })
  })

  it('falls back when the provider is unavailable or returns invalid output', async () => {
    const provider: CarryProfileModelProvider = {
      name: 'openai-responses',
      infer: async () => ({ nope: true }),
    }
    const result = await handleCarryProfileRequest(context, ITEMS, provider)

    expect(result.body).toMatchObject({ mode: 'fallback', approved: false, provider: 'deterministic-fallback' })
  })

  it('uses Responses API structured JSON schema and parses output_text', async () => {
    let requestBody: Record<string, unknown> | undefined
    const provider = new OpenAIResponsesProvider('test-key', 'test-model', 'https://example.test/responses', async (_input, init) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>
      return new Response(JSON.stringify({ status: 'completed', output_text: JSON.stringify(validProfile) }), { status: 200 })
    })
    const result = await handleCarryProfileRequest(context, ITEMS, provider)

    const text = requestBody?.text as { format: { type: string; strict: boolean; schema: unknown } }
    expect(result.body).toMatchObject({ mode: 'ai', approved: false })
    expect(text.format.type).toBe('json_schema')
    expect(text.format.strict).toBe(true)
    expect(text.format.schema).toBeTruthy()
  })
})
