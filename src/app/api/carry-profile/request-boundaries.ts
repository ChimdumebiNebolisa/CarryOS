export type BoundedBodyResult = { ok: true; body: string } | { ok: false }

export async function readBoundedRequestBody(request: Request, maximumBytes: number): Promise<BoundedBodyResult> {
  if (!Number.isFinite(maximumBytes) || maximumBytes < 0) return { ok: false }

  const declaredLength = request.headers.get('content-length')
  if (declaredLength !== null) {
    const bytes = Number(declaredLength)
    if (!Number.isFinite(bytes) || bytes < 0 || bytes > maximumBytes) return { ok: false }
  }

  if (!request.body) return { ok: true, body: '' }
  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let bytesRead = 0
  let body = ''

  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      bytesRead += chunk.value.byteLength
      if (bytesRead > maximumBytes) {
        await reader.cancel()
        return { ok: false }
      }
      body += decoder.decode(chunk.value, { stream: true })
    }
    body += decoder.decode()
    return { ok: true, body }
  } finally {
    reader.releaseLock()
  }
}

export function clientKeyForRequest(headers: Headers, trustProxy: boolean): string {
  if (!trustProxy) return 'local'
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headers.get('x-real-ip')?.trim() || 'local'
}
