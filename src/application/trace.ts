import { traceId } from '@/lib/ids'
import type { TraceEvent, TraceEventName } from '@/domain/types'

export function createTraceEvent(
  name: TraceEventName,
  now: string,
  detail: string,
  sequence: number,
): TraceEvent {
  return {
    id: traceId(name, now, sequence),
    name,
    at: now,
    detail,
  }
}

export function redactTraceDetail(detail: string): string {
  return detail
    .replace(/sk-[A-Za-z0-9]+/g, '[redacted]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
}
