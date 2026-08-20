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
  maximumKeys = 1_000,
): boolean {
  if (
    !key ||
    !Number.isFinite(nowMs) ||
    !Number.isFinite(limit) ||
    limit <= 0 ||
    !Number.isFinite(windowMs) ||
    windowMs <= 0 ||
    !Number.isFinite(maximumKeys) ||
    maximumKeys <= 0
  ) {
    return false
  }

  for (const [storedKey, stamps] of store.hits) {
    const recent = stamps.filter((stamp) => Number.isFinite(stamp) && nowMs - stamp < windowMs)
    if (recent.length === 0) store.hits.delete(storedKey)
    else store.hits.set(storedKey, recent)
  }

  if (!store.hits.has(key) && store.hits.size >= maximumKeys) return false
  const existing = store.hits.get(key) ?? []
  const recent = existing.filter((stamp) => Number.isFinite(stamp) && nowMs - stamp < windowMs)
  if (recent.length >= limit) {
    store.hits.set(key, recent)
    return false
  }
  recent.push(nowMs)
  store.hits.set(key, recent)
  return true
}
