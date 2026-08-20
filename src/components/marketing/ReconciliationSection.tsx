import { buildLandingProof } from '@/application/landing-proof'

const rowTone = {
  matched: 'border-[var(--confirm)]/20 bg-[var(--confirm)]/8 text-[var(--confirm-strong)]',
  missing: 'border-[var(--caution)]/35 bg-[var(--caution)]/12 text-[var(--caution-strong)]',
  uncertain: 'border-black/10 bg-[var(--paper)] text-[var(--ink-soft)]',
}

export function ReconciliationSection() {
  const { rows, matchedCount, missingCount } = buildLandingProof()

  return (
    <section id="reconciliation" className="bg-[var(--paper-strong)] px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--graphite)]">04 / Reconciliation</p>
          <h2 className="mt-4 max-w-xl text-5xl leading-[0.92] sm:text-6xl">Expected is not the same as observed.</h2>
          <p className="mt-5 max-w-lg text-lg leading-8 text-[var(--ink-soft)]">
            Carry compares the approved requirements against the latest closed-bag evidence. The missing calculator is isolated because the other three required items matched.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-[var(--confirm)] px-4 py-2 text-[var(--paper)]">{matchedCount} matched</span>
            <span className="rounded-full bg-[var(--caution)] px-4 py-2 text-[var(--ink)]">{missingCount} missing</span>
          </div>
        </div>
        <div className="rounded-[2rem] border border-black/10 bg-[var(--paper)] p-4 sm:p-6">
          <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-black/10 px-2 pb-3 text-xs uppercase tracking-[0.14em] text-[var(--graphite)]">
            <span>Required item</span>
            <span>Observed</span>
          </div>
          <div className="mt-3 space-y-2">
            {rows.map((row) => (
              <div key={row.itemId} className={`grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border px-4 py-4 ${rowTone[row.relationship]}`}>
                <div>
                  <p className="font-medium">{row.itemName}</p>
                  <p className="mt-1 text-xs opacity-75">Requirement from {row.required ? 'approved activity context' : 'inventory registry'}</p>
                </div>
                <span className="mono text-xs uppercase tracking-[0.1em]">{row.observedLabel}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-2xl bg-[var(--forest)] px-4 py-4 text-sm leading-6 text-[var(--paper)]">
            The result is evidence-backed: one required item is absent, so the global state cannot be Ready.
          </p>
        </div>
      </div>
    </section>
  )
}
