export function deterministicId(parts: readonly string[]): string {
  const input = parts.join(':')
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `${parts[0]}_${(hash >>> 0).toString(16)}`
}

export function alertId(input: {
  activityId: string
  itemId: string
  type: string
  scanId: string
  revision: number
}): string {
  return deterministicId(['alert', input.activityId, input.itemId, input.type, input.scanId, String(input.revision)])
}

export function scanId(now: string, sequence: number): string {
  return deterministicId(['scan', now, String(sequence)])
}

export function observationId(scanIdValue: string, tagId: string): string {
  return deterministicId(['obs', scanIdValue, tagId])
}

export function traceId(name: string, now: string, sequence: number): string {
  return deterministicId(['trace', name, now, String(sequence)])
}
