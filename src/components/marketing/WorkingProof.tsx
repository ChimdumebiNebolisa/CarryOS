'use client'

import { useMemo, useState } from 'react'
import { Check, CircleAlert, CircleDashed, ScanLine } from 'lucide-react'
import { closeBagAndScan, createDemoSession, openBag, setItemPresent } from '@/application/demo-scenario'
import { ITEM_STATE_LABELS } from '@/domain/types'
import { DEMO_MISSING_ITEM_ID } from '@/fixtures/demo-scenario'
import { Button } from '@/components/ui/button'
import { formatClock } from '@/lib/utils'

export function WorkingProof() {
  const [session, setSession] = useState(() => closeBagAndScan(createDemoSession()))
  const missingItem = useMemo(
    () => session.inventory.find((state) => state.itemId === DEMO_MISSING_ITEM_ID),
    [session],
  )
  const missingItemName = session.items.find((item) => item.id === DEMO_MISSING_ITEM_ID)?.name ?? 'Required item'

  return (
    <section id="system" className="landing-section landing-proof">
      <div className="landing-section-heading landing-centered-heading">
        <p className="landing-eyebrow">The working proof</p>
        <h2>Context in. Evidence out.</h2>
        <p>Close the bag and let the deterministic CarryOS engine reconcile what today requires with what the reader observed.</p>
      </div>
      <div className="landing-proof-grid">
        <article className="landing-proof-card landing-proof-context">
          <p className="landing-panel-label">Input / context</p>
          <strong>{formatClock(session.activity.startTime)} / {session.activity.name}</strong>
          <span>{session.activity.destination.name}</span>
          <div className="landing-mini-list">
            {session.activity.requiredItemIds.map((itemId) => (
              <span key={itemId}>{session.items.find((item) => item.id === itemId)?.name ?? itemId}</span>
            ))}
          </div>
        </article>

        <div className="landing-proof-core" aria-live="polite">
          <span className="landing-core-kicker">Process / CarryOS</span>
          <strong>{session.readiness.state === 'scan-required' ? 'Awaiting evidence' : session.readiness.label}</strong>
          <span>{session.readiness.confirmedRequiredCount} / {session.readiness.requiredCount} confirmed</span>
          <ScanLine className="landing-core-icon" size={28} aria-hidden="true" />
        </div>

        <article className="landing-proof-card landing-proof-observed">
          <p className="landing-panel-label">Output / evidence</p>
          {session.inventory.length === 0 ? (
            <p className="landing-proof-empty">No closed-bag evidence yet.</p>
          ) : (
            <ul className="landing-observed-list">
              {session.activity.requiredItemIds.map((itemId) => {
                const state = session.inventory.find((candidate) => candidate.itemId === itemId)
                const isMissing = state?.status === 'not-detected'
                const isConfirmed = state?.status === 'confirmed-present'
                return (
                  <li key={itemId} className={isMissing ? 'is-missing' : isConfirmed ? '' : 'is-neutral'}>
                    <span>{session.items.find((item) => item.id === itemId)?.name ?? itemId}</span>
                    {isMissing ? <CircleAlert size={15} aria-hidden="true" /> : isConfirmed ? <Check size={15} aria-hidden="true" /> : <CircleDashed size={15} aria-hidden="true" />}
                  </li>
                )
              })}
            </ul>
          )}
        </article>
      </div>
      <div className="landing-proof-actions">
        <div>
          <p className="landing-proof-status" data-testid="proof-status">{session.readiness.detail}</p>
          <p className="landing-proof-disclosure">
            Simulated RFID input. {missingItemName} is absent in the canonical initial bag state. A scan does not invent a percentage.
          </p>
          {missingItem ? <p className="landing-proof-item-state">{missingItemName}: {ITEM_STATE_LABELS[missingItem.status]}</p> : null}
        </div>
        <div className="landing-actions">
          <Button
            type="button"
            data-testid="close-scan"
            onClick={() => setSession((current) => closeBagAndScan(current))}
            disabled={session.sensorStatus === 'disconnected'}
          >
            Rescan the closed bag
          </Button>
          <Button
            type="button"
            variant="paper"
            data-testid="add-notebook"
            onClick={() => setSession((current) => {
              const opened = current.bagIsOpen ? current : openBag(current)
              return setItemPresent(opened, DEMO_MISSING_ITEM_ID, true)
            })}
          >
            Add {missingItemName.toLowerCase()}
          </Button>
        </div>
      </div>
    </section>
  )
}
