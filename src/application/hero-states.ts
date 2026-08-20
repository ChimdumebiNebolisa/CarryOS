import { closeBagAndScan, createDemoSession, openBag, setItemPresent, type DemoSession } from '@/application/demo-scenario'
import { ITEM_STATE_LABELS, type Readiness } from '@/domain/types'
import { DEMO_MISSING_ITEM_ID } from '@/fixtures/demo-scenario'
import { ITEMS } from '@/fixtures/items'

export type HeroStateId = 'awaiting' | 'scanning' | 'missing' | 'ready'

export interface HeroSnapshot {
  id: HeroStateId
  kicker: string
  activityName: string
  destination: string
  title: string
  detail: string
  readiness: Readiness
  confirmed: number
  required: number
  leaveBy?: string
  itemLine: string
}

function snapshotFrom(session: DemoSession, id: HeroStateId, overlay?: Partial<HeroSnapshot>): HeroSnapshot {
  const trackedItem = session.inventory.find((state) => state.itemId === DEMO_MISSING_ITEM_ID)
  const trackedItemName = ITEMS.find((item) => item.id === DEMO_MISSING_ITEM_ID)?.name ?? 'Required item'
  return {
    id,
    kicker: session.activity.name,
    activityName: session.activity.name,
    destination: session.activity.destination.name,
    title: session.readiness.label,
    detail: session.readiness.detail,
    readiness: session.readiness,
    confirmed: session.readiness.confirmedRequiredCount,
    required: session.readiness.requiredCount,
    leaveBy: session.travel?.leaveBy,
    itemLine: trackedItem
      ? `${trackedItemName} ${ITEM_STATE_LABELS[trackedItem.status].toLowerCase()}`
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
  ready = setItemPresent(ready, DEMO_MISSING_ITEM_ID, true)
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
      title: `${ITEMS.find((item) => item.id === DEMO_MISSING_ITEM_ID)?.name ?? 'Required item'} not detected`,
      detail: `${missing.readiness.confirmedRequiredCount} of ${missing.readiness.requiredCount} required items confirmed.`,
    }),
    ready: snapshotFrom(ready, 'ready', {
      title: `Ready for ${ready.activity.name}`,
      detail: `${ready.readiness.confirmedRequiredCount} of ${ready.readiness.requiredCount} required items confirmed. Scanned just now.`,
    }),
  }
}

export const HERO_STATE_ORDER: HeroStateId[] = ['awaiting', 'scanning', 'missing', 'ready']
