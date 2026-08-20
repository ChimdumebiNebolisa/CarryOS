import { handleCarryProfile } from '@/adapters/ai/carry-profile-service'
import { clientKeyForRequest, readBoundedRequestBody } from '@/app/api/carry-profile/request-boundaries'
import { INPUT_LIMITS } from '@/domain/carry-profile'
import { ITEMS } from '@/fixtures/items'

export async function POST(request: Request) {
  const boundedBody = await readBoundedRequestBody(request, INPUT_LIMITS.bodyBytes)
  if (!boundedBody.ok) {
    return Response.json({ error: 'Request is too large.', code: 'payload-too-large' }, { status: 413 })
  }
  const trustProxy = process.env.VERCEL === '1' || process.env.TRUST_PROXY === 'true'
  const clientKey = clientKeyForRequest(request.headers, trustProxy)
  const result = await handleCarryProfile(boundedBody.body, request.headers.get('content-type'), ITEMS, clientKey)
  return Response.json(result.body, { status: result.status })
}

export function GET() {
  return Response.json({ error: 'Method not allowed.', code: 'method-not-allowed' }, { status: 405 })
}
