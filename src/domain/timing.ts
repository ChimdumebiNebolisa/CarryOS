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
