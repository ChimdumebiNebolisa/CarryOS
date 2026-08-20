import { clientKeyForRequest, readBoundedRequestBody } from '@/app/api/carry-profile/request-boundaries'
import { consumeRateLimit, createRateLimitStore } from '@/adapters/rate-limit/rate-limiter'
import { describe, expect, it } from 'vitest'

describe('request boundaries', () => {
  it('stops reading request bodies once the byte cap is exceeded', async () => {
    const accepted = new Request('http://carry.test/api', { method: 'POST', body: '12345678' })
    const rejected = new Request('http://carry.test/api', { method: 'POST', body: '123456789' })

    await expect(readBoundedRequestBody(accepted, 8)).resolves.toEqual({ ok: true, body: '12345678' })
    await expect(readBoundedRequestBody(rejected, 8)).resolves.toEqual({ ok: false })
  })

  it('ignores spoofable forwarding headers unless the deployment trusts its proxy', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.10, 198.51.100.4' })
    expect(clientKeyForRequest(headers, false)).toBe('local')
    expect(clientKeyForRequest(headers, true)).toBe('203.0.113.10')
  })
})

describe('rate-limit storage', () => {
  it('bounds client keys and prunes expired entries', () => {
    const store = createRateLimitStore()
    expect(consumeRateLimit(store, 'one', 0, 8, 100, 2)).toBe(true)
    expect(consumeRateLimit(store, 'two', 0, 8, 100, 2)).toBe(true)
    expect(consumeRateLimit(store, 'three', 0, 8, 100, 2)).toBe(false)
    expect(store.hits.size).toBe(2)

    expect(consumeRateLimit(store, 'three', 101, 8, 100, 2)).toBe(true)
    expect(store.hits.size).toBe(1)
  })

  it('rejects non-finite rate-limit inputs', () => {
    expect(consumeRateLimit(createRateLimitStore(), 'client', Number.NaN)).toBe(false)
  })
})
