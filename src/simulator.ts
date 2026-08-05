import type {
  InventorySensor,
  Item,
  ScanRequest,
  ScanResult,
  SensorEvent,
  SensorStatus,
  TagObservation,
} from './domain'

export class SimulatedRFIDReader implements InventorySensor {
  private status: SensorStatus = 'connected'
  private readonly listeners = new Set<(event: SensorEvent) => void>()
  private readonly presentTagIds: Set<string>
  private readonly signalStrengthByTag: Record<string, number>
  private readonly intermittentTagIds = new Set<string>()
  private readonly outsideTagIds = new Set<string>()
  private shouldFailNextScan = false
  private observationSequence = 0
  private readonly itemsByTag: Map<string, Item>
  private readonly scanDelayMs: number

  constructor(items: Item[], options: { presentTagIds?: Set<string>; signalStrengthByTag?: Record<string, number>; scanDelayMs?: number } = {}) {
    this.itemsByTag = new Map(items.map((item) => [item.tagId, item]))
    this.presentTagIds = new Set(options.presentTagIds ?? [])
    this.signalStrengthByTag = { ...(options.signalStrengthByTag ?? {}) }
    this.scanDelayMs = options.scanDelayMs ?? 140
  }

  async connect(): Promise<void> {
    this.status = 'connected'
    this.emit({ type: 'reader-status', at: new Date().toISOString(), detail: 'Simulated reader connected.' })
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected'
    this.emit({ type: 'reader-status', at: new Date().toISOString(), detail: 'Simulated reader disconnected.' })
  }

  getStatus(): SensorStatus {
    return this.status
  }

  subscribeToEvents(callback: (event: SensorEvent) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  async scan(request: ScanRequest): Promise<ScanResult> {
    this.emit({ type: 'scan-started', at: request.startedAt, detail: `Scan ${request.scanId} started.` })

    if (this.status === 'disconnected' || this.shouldFailNextScan) {
      this.shouldFailNextScan = false
      const error = this.status === 'disconnected' ? 'Reader is disconnected.' : 'Simulated timeout during scan.'
      const scan = {
        id: request.scanId,
        startedAt: request.startedAt,
        completedAt: request.startedAt,
        bagState: 'closed' as const,
        status: 'failed' as const,
        source: 'simulated-rfid' as const,
        readsEvaluated: 6,
        error,
      }
      this.emit({ type: 'scan-failed', at: request.startedAt, detail: `${scan.id}: ${error}` })
      return { scan, observations: [] }
    }

    await new Promise((resolve) => globalThis.setTimeout(resolve, this.scanDelayMs))

    const observations: TagObservation[] = []
    for (const tagId of this.presentTagIds) {
      const item = this.itemsByTag.get(tagId)
      const signalStrength = this.signalStrengthByTag[tagId] ?? -48
      const outside = this.outsideTagIds.has(tagId)
      const intermittent = this.intermittentTagIds.has(tagId)
      const consecutiveReads = outside ? 2 : intermittent ? 2 : signalStrength < -65 ? 2 : 6
      const locationHint = outside ? 'outside' : 'inside'
      const confidenceContribution = outside
        ? 0.32
        : signalStrength < -65 || intermittent
          ? 0.63
          : 0.96
      const evidence = outside
        ? 'Tag observed near the bag, but marked outside the backpack.'
        : intermittent
          ? 'Tag appeared intermittently across the scan window.'
          : signalStrength < -65
            ? 'Tag was detected with a weak signal.'
            : 'Tag was detected across consecutive closed-bag reads.'

      observations.push({
        id: `observation-${++this.observationSequence}`,
        itemId: item?.id,
        tagId,
        scanId: request.scanId,
        detectedAt: request.startedAt,
        signalStrength,
        consecutiveReads,
        bagState: 'closed',
        source: 'simulated-rfid',
        locationHint,
        confidenceContribution,
        evidence,
      })
    }

    const scan = {
      id: request.scanId,
      startedAt: request.startedAt,
      completedAt: request.startedAt,
      bagState: 'closed' as const,
      status: 'completed' as const,
      source: 'simulated-rfid' as const,
      readsEvaluated: 6,
    }
    this.emit({
      type: 'scan-completed',
      at: request.startedAt,
      detail: `Scan ${scan.id} completed with ${observations.length} tag observation${observations.length === 1 ? '' : 's'}.`,
    })
    return { scan, observations }
  }

  setTagPresence(tagId: string, present: boolean): void {
    if (present) {
      this.presentTagIds.add(tagId)
      this.emit({ type: 'tag-added', at: new Date().toISOString(), detail: `${tagId} added to the simulated bag.` })
    } else {
      this.presentTagIds.delete(tagId)
      this.emit({ type: 'tag-removed', at: new Date().toISOString(), detail: `${tagId} removed from the simulated bag.` })
    }
  }

  setSignalStrength(tagId: string, signalStrength: number): void {
    this.signalStrengthByTag[tagId] = signalStrength
  }

  setIntermittent(tagId: string, enabled: boolean): void {
    if (enabled) this.intermittentTagIds.add(tagId)
    else this.intermittentTagIds.delete(tagId)
  }

  setOutside(tagId: string, enabled: boolean): void {
    if (enabled) this.outsideTagIds.add(tagId)
    else this.outsideTagIds.delete(tagId)
  }

  setFailNextScan(enabled: boolean): void {
    this.shouldFailNextScan = enabled
  }

  getTagState(tagId: string): { present: boolean; signalStrength: number; intermittent: boolean; outside: boolean } {
    return {
      present: this.presentTagIds.has(tagId),
      signalStrength: this.signalStrengthByTag[tagId] ?? -48,
      intermittent: this.intermittentTagIds.has(tagId),
      outside: this.outsideTagIds.has(tagId),
    }
  }

  reset(presentTagIds: Set<string>, signalStrengthByTag: Record<string, number>): void {
    this.presentTagIds.clear()
    for (const tagId of presentTagIds) this.presentTagIds.add(tagId)
    for (const tagId of Object.keys(this.signalStrengthByTag)) delete this.signalStrengthByTag[tagId]
    Object.assign(this.signalStrengthByTag, signalStrengthByTag)
    this.intermittentTagIds.clear()
    this.outsideTagIds.clear()
    this.shouldFailNextScan = false
    this.status = 'connected'
    this.emit({ type: 'reader-status', at: new Date().toISOString(), detail: 'Scenario reset to the forgotten calculator demo.' })
  }

  private emit(event: SensorEvent): void {
    for (const listener of this.listeners) listener(event)
  }
}

/**
 * Future hardware boundary. It is intentionally non-functional until a physical
 * transport and calibration strategy are validated.
 */
export class M5StackRFIDReader implements InventorySensor {
  getStatus(): SensorStatus {
    return 'disconnected'
  }

  async connect(): Promise<void> {
    throw new Error('M5Stack RFID hardware adapter is not implemented or validated.')
  }

  async disconnect(): Promise<void> {
    return Promise.resolve()
  }

  async scan(): Promise<ScanResult> {
    throw new Error('M5Stack RFID hardware adapter is not implemented or validated.')
  }

  subscribeToEvents(): () => void {
    return () => undefined
  }
}
