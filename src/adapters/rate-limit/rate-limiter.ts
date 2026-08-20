export interface RateLimitStore {
  hits: Map<string, number[]>
}

export function createRateLimitStore(): RateLimitStore {
  return { hits: new Map() }
}

export function consumeRateLimit(
  store: RateLimitStore,
  key: string,
  nowMs: number,
  limit = 8,
  windowMs = 10 * 60_000,
): boolean {
  const existing = store.hits.get(key) ?? []
  const recent = existing.filter((stamp) => nowMs - stamp < windowMs)
  if (recent.length >= limit) {
    store.hits.set(key, recent)
    return false
  }
  recent.push(nowMs)
  store.hits.set(key, recent)
  return true
}
