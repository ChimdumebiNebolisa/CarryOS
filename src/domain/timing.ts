export function calculateLeaveBy(
  startTime: string,
  travelMinutes: number,
  departureBufferMinutes: number,
): string {
  const start = Date.parse(startTime)
  if (!Number.isFinite(start)) {
    throw new Error('Activity start time is invalid.')
  }
  return new Date(start - (travelMinutes + departureBufferMinutes) * 60_000).toISOString()
}

export function minutesBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 60_000)
}

export function isIsoBefore(left: string, right: string): boolean {
  return Date.parse(left) < Date.parse(right)
}
