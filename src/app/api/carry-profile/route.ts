import { handleCarryProfile } from '@/adapters/ai/carry-profile-service'
import { ITEMS } from '@/fixtures/items'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const clientKey = forwarded || request.headers.get('x-real-ip') || 'local'
  const result = await handleCarryProfile(rawBody, request.headers.get('content-type'), ITEMS, clientKey)
  return Response.json(result.body, { status: result.status })
}

export function GET() {
  return Response.json({ error: 'Method not allowed.', code: 'method-not-allowed' }, { status: 405 })
}
