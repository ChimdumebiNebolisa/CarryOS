import { handleCarryProfileRequest } from '../server/carryProfile'
import { ITEMS } from '../src/demoData'

interface ApiRequest {
  method?: string
  body?: unknown
}

interface ApiResponse {
  status(code: number): ApiResponse
  json(body: unknown): void
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed.' })
    return
  }

  let body: unknown
  try {
    body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body
  } catch {
    response.status(400).json({ error: 'Request body must be valid JSON.' })
    return
  }
  const result = await handleCarryProfileRequest(body, ITEMS)
  response.status(result.status).json(result.body)
}
