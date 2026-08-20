import { observationId } from '@/lib/ids'
import type { Item, Scan, TagObservation, LocationHint } from '@/domain/types'

export type ReadQuality = 'strong' | 'weak' | 'intermittent'

export interface SimulatedTagConfig {
  present: boolean
  quality: ReadQuality
  locationHint: LocationHint
}

export interface SimulatedScanInput {
  scan: Scan
  items: Item[]
  tags: Record<string, SimulatedTagConfig>
  now: string
}

function qualityToReads(quality: ReadQuality): { consecutiveReads: number; signalStrength: number } {
  if (quality === 'strong') return { consecutiveReads: 5, signalStrength: -48 }
  if (quality === 'weak') return { consecutiveReads: 1, signalStrength: -72 }
  return { consecutiveReads: 2, signalStrength: -68 }
}

export function simulateClosedBagScan(input: SimulatedScanInput): TagObservation[] {
  if (input.scan.bagState !== 'closed' || input.scan.status !== 'completed') return []

  return input.items.flatMap((item) => {
    const tag = input.tags[item.id]
    if (!tag?.present) return []
    const quality = qualityToReads(tag.quality)
    const observation: TagObservation = {
      id: observationId(input.scan.id, item.tagId),
      scanId: input.scan.id,
      itemId: item.id,
      tagId: item.tagId,
      detectedAt: input.now,
      signalStrength: quality.signalStrength,
      consecutiveReads: quality.consecutiveReads,
      source: 'simulated-rfid',
      bagState: 'closed',
      testLocationHint: tag.locationHint,
    }
    return [observation]
  })
}

export const DEFAULT_PRESENT_ITEM_IDS = ['laptop', 'notebook', 'student-id'] as const
