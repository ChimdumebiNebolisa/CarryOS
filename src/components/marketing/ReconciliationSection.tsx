import { Check, Minus } from 'lucide-react'
import { buildLandingProof } from '@/application/landing-proof'
import { formatClock } from '@/lib/utils'

export function ReconciliationSection() {
  const { activity, rows, matchedCount, missingCount, missingItem } = buildLandingProof()

  return (
    <section id="reconciliation" className="landing-section landing-reconciliation">
      <div className="landing-section-heading landing-centered-heading">
        <p className="landing-eyebrow">Reconciliation</p>
        <h2>The reconciliation engine.</h2>
        <p>Carry compares the approved requirement against the latest closed-bag observation.</p>
      </div>
      <div className="landing-reconciliation-grid">
        <article className="landing-reconciliation-column landing-requirements-column">
          <h3>What today requires</h3>
          <ul>
            {rows.map((row) => (
              <li key={row.itemId}><span>{row.itemName}</span><span className="mono">Required</span></li>
            ))}
          </ul>
        </article>
        <article className="landing-reconciliation-engine">
          <span className="landing-engine-label">CarryOS / Reconciliation</span>
          <strong>{missingCount ? `${missingCount} ITEM MISSING` : 'READY'}</strong>
          <p>{missingItem?.itemName ?? 'All required items'} {missingItem ? `required for ${activity.name} at ${formatClock(activity.startTime)}` : 'confirmed'}</p>
        </article>
        <article className="landing-reconciliation-column landing-observed-column">
          <h3>What you have</h3>
          <ul>
            {rows.map((row) => (
              <li key={row.itemId} className={row.relationship === 'missing' ? 'is-missing' : ''}>
                <span>{row.itemName}</span>
                <span>{row.relationship === 'missing' ? <><Minus size={14} aria-hidden="true" /> Missing</> : <><Check size={14} aria-hidden="true" /> Packed</>}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
      <p className="landing-reconciliation-note">{matchedCount} of {rows.length} required items matched the simulated closed-bag evidence. The global state cannot be Ready while {missingItem?.itemName ?? 'an item'} is absent.</p>
    </section>
  )
}
