export function parseFiniteTimestamp(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/.exec(value)
  if (!match) return undefined

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fractionText = '', zone] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const second = Number(secondText)
  const millisecond = Number(fractionText.padEnd(3, '0'))
  if (month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59) return undefined

  const calendar = new Date(0)
  calendar.setUTCFullYear(year, month - 1, day)
  calendar.setUTCHours(hour, minute, second, millisecond)
  if (
    calendar.getUTCFullYear() !== year ||
    calendar.getUTCMonth() !== month - 1 ||
    calendar.getUTCDate() !== day ||
    calendar.getUTCHours() !== hour ||
    calendar.getUTCMinutes() !== minute ||
    calendar.getUTCSeconds() !== second ||
    calendar.getUTCMilliseconds() !== millisecond
  ) {
    return undefined
  }

  let offsetMilliseconds = 0
  if (zone !== 'Z') {
    const offsetHours = Number(zone.slice(1, 3))
    const offsetMinutes = Number(zone.slice(4, 6))
    if (offsetHours > 23 || offsetMinutes > 59) return undefined
    const direction = zone[0] === '+' ? 1 : -1
    offsetMilliseconds = direction * (offsetHours * 60 + offsetMinutes) * 60_000
  }
  const timestamp = calendar.getTime() - offsetMilliseconds
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
