import { closeBagAndScan, createDemoSession, openBag, setItemPresent, type DemoSession } from '@/application/demo-scenario'
import { ITEM_STATE_LABELS, type Readiness } from '@/domain/types'

export type HeroStateId = 'awaiting' | 'scanning' | 'missing' | 'ready'

export interface HeroSnapshot {
  id: HeroStateId
  kicker: string
  title: string
  detail: string
  readiness: Readiness
  confirmed: number
  required: number
  leaveBy?: string
  itemLine: string
}

function snapshotFrom(session: DemoSession, id: HeroStateId, overlay?: Partial<HeroSnapshot>): HeroSnapshot {
  const calculator = session.inventory.find((state) => state.itemId === 'calculator')
  return {
    id,
    kicker: session.activity.name,
    title: session.readiness.label,
    detail: session.readiness.detail,
    readiness: session.readiness,
    confirmed: session.readiness.confirmedRequiredCount,
    required: session.readiness.requiredCount,
    leaveBy: session.travel?.leaveBy,
    itemLine: calculator
      ? `Calculator ${ITEM_STATE_LABELS[calculator.status].toLowerCase()}`
      : 'No fresh closed-bag evidence',
    ...overlay,
  }
}

export function buildHeroSnapshots(): Record<HeroStateId, HeroSnapshot> {
  const awaiting = createDemoSession()
  const scanningSession = createDemoSession()
  const missing = closeBagAndScan(createDemoSession())
  let ready = createDemoSession()
  ready = closeBagAndScan(ready)
  ready = openBag(ready)
  ready = setItemPresent(ready, 'calculator', true)
  ready = closeBagAndScan(ready)

  return {
    awaiting: snapshotFrom(awaiting, 'awaiting', {
      title: 'Scan required',
      detail: '4 required items. No fresh closed-bag evidence.',
      itemLine: 'Awaiting evidence',
    }),
    scanning: snapshotFrom(scanningSession, 'scanning', {
      title: 'Reading closed-bag snapshot',
      detail: 'The bag is closed. Carry is collecting tag observations.',
      itemLine: 'No invented percentage',
    }),
    missing: snapshotFrom(missing, 'missing', {
      title: 'Calculator not detected',
      detail: `${missing.readiness.confirmedRequiredCount} of ${missing.readiness.requiredCount} required items confirmed. Leave by 8:35 AM.`,
    }),
    ready: snapshotFrom(ready, 'ready', {
      title: 'Ready for Calculus II',
      detail: `${ready.readiness.confirmedRequiredCount} of ${ready.readiness.requiredCount} required items confirmed. Scanned just now.`,
    }),
  }
}

export const HERO_STATE_ORDER: HeroStateId[] = ['awaiting', 'scanning', 'missing', 'ready']
