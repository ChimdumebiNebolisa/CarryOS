import { closeBagAndScan, createDemoSession } from '@/application/demo-scenario'
import { ITEM_STATE_LABELS, type InventoryState } from '@/domain/types'
import { ITEMS } from '@/fixtures/items'
import { DEMO_MISSING_ITEM_ID } from '@/fixtures/demo-scenario'

export interface LandingReconciliationRow {
  itemId: string
  itemName: string
  required: boolean
  observedStatus: InventoryState['status']
  observedLabel: string
  relationship: 'matched' | 'missing' | 'uncertain'
}

export function buildLandingProof() {
  const session = closeBagAndScan(createDemoSession())
  const requiredIds = new Set(session.activity.requiredItemIds)
  const rows: LandingReconciliationRow[] = session.activity.requiredItemIds.map((itemId) => {
    const item = ITEMS.find((candidate) => candidate.id === itemId)
    const state = session.inventory.find((candidate) => candidate.itemId === itemId)
    const observedStatus = state?.status ?? 'unknown'

    return {
      itemId,
      itemName: item?.name ?? itemId,
      required: requiredIds.has(itemId),
      observedStatus,
      observedLabel: ITEM_STATE_LABELS[observedStatus],
      relationship: observedStatus === 'confirmed-present'
        ? 'matched'
        : observedStatus === 'not-detected'
          ? 'missing'
          : 'uncertain',
    }
  })

  const missingItem = rows.find((row) => row.itemId === DEMO_MISSING_ITEM_ID)
  const alert = session.alerts.find((candidate) => candidate.itemId === DEMO_MISSING_ITEM_ID)

  return {
    activity: session.activity,
    travel: session.travel,
    rows,
    missingItem,
    alert,
    matchedCount: rows.filter((row) => row.relationship === 'matched').length,
    missingCount: rows.filter((row) => row.relationship === 'missing').length,
  }
}
