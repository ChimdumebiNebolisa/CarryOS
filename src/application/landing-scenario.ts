import { buildLandingProof, type LandingReconciliationRow } from '@/application/landing-proof'
import { buildHeroSnapshots } from '@/application/hero-states'
import { formatClock } from '@/lib/utils'

export type LandingItemId = 'laptop' | 'charger' | 'umbrella' | 'notebook'
export type LandingItemState = 'packed' | 'missing'
export type LandingItemSlot = 'laptop' | 'charger' | 'umbrella' | 'notebook'

export interface LandingSceneItem {
  id: LandingItemId
  name: string
  state: LandingItemState
  slot: LandingItemSlot
}

export interface LandingNeed {
  id: 'laptop' | 'charger' | 'notebook' | 'umbrella' | 'water-bottle' | 'shoes'
  name: string
}

export interface LandingEvent {
  id: 'algorithms' | 'rain' | 'gym'
  time: string
  name: string
  needs: readonly LandingNeed[]
}

export interface LandingScenario {
  events: readonly [LandingEvent, LandingEvent, LandingEvent]
  requiredItems: readonly [LandingSceneItem, LandingSceneItem, LandingSceneItem, LandingSceneItem]
  packingItems: readonly [LandingSceneItem, LandingSceneItem, LandingSceneItem, LandingSceneItem]
  packedItems: readonly [LandingSceneItem, LandingSceneItem, LandingSceneItem]
  primaryMissingItem: LandingSceneItem
  primaryReason: string
  decisionStates: readonly [LandingDecisionState, LandingDecisionState]
}

export interface LandingDecisionState {
  id: 'warning' | 'ready'
  label: string
  detail: string
  confirmedCount: number
  requiredCount: number
  trackedItemState: 'not-detected' | 'confirmed-present'
}

const staticNeeds = {
  laptop: { id: 'laptop', name: 'Laptop' },
  charger: { id: 'charger', name: 'Charger' },
  notebook: { id: 'notebook', name: 'Notebook' },
  umbrella: { id: 'umbrella', name: 'Umbrella' },
  waterBottle: { id: 'water-bottle', name: 'Water bottle' },
  shoes: { id: 'shoes', name: 'Shoes' },
} as const satisfies Record<string, LandingNeed>

function getCanonicalRow(rows: readonly LandingReconciliationRow[], itemId: LandingItemId): LandingReconciliationRow {
  const row = rows.find((candidate) => candidate.itemId === itemId)
  if (!row) throw new Error(`Landing scenario is missing ${itemId}.`)
  return row
}

function toSceneItem(rows: readonly LandingReconciliationRow[], itemId: LandingItemId, state: LandingItemState): LandingSceneItem {
  const row = getCanonicalRow(rows, itemId)
  const expectedRelationship = state === 'packed' ? 'matched' : 'missing'
  if (row.relationship !== expectedRelationship) {
    throw new Error(`Landing scenario expected ${itemId} to be ${state}.`)
  }

  return { id: itemId, name: row.itemName, state, slot: itemId }
}

/** Adapts the deterministic demo proof into the landing's single consumer story. */
export function buildLandingScenario(): LandingScenario {
  const proof = buildLandingProof()
  const snapshots = buildHeroSnapshots()
  const laptop = toSceneItem(proof.rows, 'laptop', 'packed')
  const charger = toSceneItem(proof.rows, 'charger', 'packed')
  const umbrella = toSceneItem(proof.rows, 'umbrella', 'packed')
  const notebook = toSceneItem(proof.rows, 'notebook', 'missing')

  return {
    events: [
      { id: 'algorithms', time: formatClock(proof.activity.startTime), name: proof.activity.name, needs: [staticNeeds.laptop, staticNeeds.charger, staticNeeds.notebook] },
      { id: 'rain', time: '5:00 PM', name: 'Rain expected', needs: [staticNeeds.umbrella] },
      { id: 'gym', time: 'Later', name: 'Gym after class', needs: [staticNeeds.waterBottle, staticNeeds.shoes] },
    ],
    requiredItems: [laptop, charger, notebook, umbrella],
    packingItems: [laptop, charger, umbrella, notebook],
    packedItems: [laptop, charger, umbrella],
    primaryMissingItem: notebook,
    primaryReason: `You’ll need it for ${proof.activity.name} at ${formatClock(proof.activity.startTime)}.`,
    decisionStates: [
      {
        id: 'warning',
        label: snapshots.missing.title,
        detail: snapshots.missing.detail,
        confirmedCount: snapshots.missing.confirmed,
        requiredCount: snapshots.missing.required,
        trackedItemState: 'not-detected',
      },
      {
        id: 'ready',
        label: snapshots.ready.title,
        detail: snapshots.ready.detail,
        confirmedCount: snapshots.ready.confirmed,
        requiredCount: snapshots.ready.required,
        trackedItemState: 'confirmed-present',
      },
    ],
  }
}
