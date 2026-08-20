export function parseFiniteTimestamp(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : undefined
}

export function elapsedMilliseconds(now: string, earlier: string): number | undefined {
  const nowMs = parseFiniteTimestamp(now)
  const earlierMs = parseFiniteTimestamp(earlier)
  if (nowMs === undefined || earlierMs === undefined) return undefined
  const elapsed = nowMs - earlierMs
  return Number.isFinite(elapsed) && elapsed >= 0 ? elapsed : undefined
}

export function isFreshPastTimestamp(timestamp: string, now: string, staleMinutes: number): boolean {
  if (!Number.isFinite(staleMinutes) || staleMinutes < 0) return false
  const elapsed = elapsedMilliseconds(now, timestamp)
  return elapsed !== undefined && elapsed <= staleMinutes * 60_000
}

export function isOrderedInterval(start: string, end: string, now?: string): boolean {
  const startMs = parseFiniteTimestamp(start)
  const endMs = parseFiniteTimestamp(end)
  const nowMs = now === undefined ? undefined : parseFiniteTimestamp(now)
  if (startMs === undefined || endMs === undefined || endMs < startMs) return false
  if (now !== undefined && (nowMs === undefined || startMs > nowMs || endMs > nowMs)) return false
  return true
}
