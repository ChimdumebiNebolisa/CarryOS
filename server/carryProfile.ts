import { randomUUID } from 'node:crypto'
import {
  CARRY_PROFILE_JSON_SCHEMA,
  createFallbackCarryProfile,
  validateCarryProfile,
  type CarryProfileApiResponse,
  type CarryProfileContext,
} from '../src/carryProfile'
import type { Item } from '../src/domain'

const MAX_FIELD_LENGTH = 180

export interface CarryProfileModelProvider {
  readonly name: 'openai-responses'
  infer(context: CarryProfileContext, items: Item[]): Promise<unknown>
}

export class OpenAIResponsesProvider implements CarryProfileModelProvider {
  readonly name = 'openai-responses' as const

  constructor(
    private readonly apiKey = process.env.OPENAI_API_KEY,
    private readonly model = process.env.OPENAI_MODEL,
    private readonly baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1/responses',
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async infer(context: CarryProfileContext, items: Item[]): Promise<unknown> {
    if (!this.apiKey || !this.model) throw new Error('OpenAI provider is not configured.')

    const response = await this.fetchImpl(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        store: false,
        max_output_tokens: 700,
        input: [
          {
            role: 'system',
            content: 'You create a cautious backpack carry profile. Use only registered item IDs for requiredItems and optionalItems. Put anything not in the registry in unregisteredSuggestions. Return only the requested JSON object. Never imply that a suggestion is confirmed present.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              event: context,
              registeredItems: items.map(({ id, name, category, notes }) => ({ id, name, category, notes })),
            }),
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'carry_profile',
            strict: true,
            schema: CARRY_PROFILE_JSON_SCHEMA,
          },
        },
      }),
    })

    if (!response.ok) throw new Error(`OpenAI provider returned HTTP ${response.status}.`)
    const payload = (await response.json()) as { output_text?: unknown; output?: unknown; status?: string }
    if (payload.status === 'incomplete') throw new Error('OpenAI provider returned an incomplete response.')
    if (typeof payload.output_text === 'string') return JSON.parse(payload.output_text)

    const outputText = Array.isArray(payload.output)
      ? payload.output.flatMap((item) => (typeof item === 'object' && item !== null && 'content' in item && Array.isArray(item.content) ? item.content : []))
        .map((content) => (typeof content === 'object' && content !== null && 'text' in content ? content.text : undefined))
        .find((text): text is string => typeof text === 'string')
      : undefined
    if (!outputText) throw new Error('OpenAI provider returned no structured output.')
    return JSON.parse(outputText)
  }
}

function cleanContext(value: unknown): CarryProfileContext | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const candidate = value as Record<string, unknown>
  const fields = ['eventName', 'eventType', 'destination', 'notes']
  if (Object.keys(candidate).sort().join('|') !== fields.slice().sort().join('|')) return undefined
  if (!fields.every((field) => typeof candidate[field] === 'string' && (candidate[field] as string).trim().length > 0 && (candidate[field] as string).length <= MAX_FIELD_LENGTH)) return undefined
  return {
    eventName: (candidate.eventName as string).trim(),
    eventType: (candidate.eventType as string).trim(),
    destination: (candidate.destination as string).trim(),
    notes: (candidate.notes as string).trim(),
  }
}

export interface CarryProfileRequestResult {
  status: number
  body: CarryProfileApiResponse | { error: string }
}

export async function handleCarryProfileRequest(
  body: unknown,
  items: Item[],
  provider: CarryProfileModelProvider = new OpenAIResponsesProvider(),
): Promise<CarryProfileRequestResult> {
  const context = cleanContext(body)
  if (!context) return { status: 400, body: { error: 'Provide eventName, eventType, destination, and notes as short text fields.' } }

  const requestId = randomUUID()
  try {
    const raw = await provider.infer(context, items)
    const profile = validateCarryProfile(raw, items)
    if (!profile) throw new Error('Provider output failed carry-profile schema validation.')
    return {
      status: 200,
      body: {
        requestId,
        mode: 'ai',
        approved: false,
        provider: provider.name,
        profile,
        note: 'AI suggestion only. Approve it before it changes the activity checklist.',
      },
    }
  } catch {
    return {
      status: 200,
      body: {
        requestId,
        mode: 'fallback',
        approved: false,
        provider: 'deterministic-fallback',
        profile: createFallbackCarryProfile(context, items),
        note: 'Fallback profile: model unavailable or output failed validation. Approve it before it changes the activity checklist.',
      },
    }
  }
}

export async function readJsonBody(request: AsyncIterable<Uint8Array | string>): Promise<unknown> {
  const chunks: string[] = []
  let length = 0
  for await (const chunk of request) {
    const text = typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk)
    length += text.length
    if (length > 20_000) throw new Error('Request body is too large.')
    chunks.push(text)
  }
  return JSON.parse(chunks.join(''))
}
