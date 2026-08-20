import { buildLandingProof } from '@/application/landing-proof'
import { formatClock } from '@/lib/utils'

export function ContextRequirements() {
  const { activity, travel, rows } = buildLandingProof()

  return (
    <section id="context" className="border-b border-black/8 bg-[var(--paper)] px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--graphite)]">02 / Context to requirements</p>
          <h2 className="mt-4 max-w-xl text-5xl leading-[0.92] sm:text-6xl">The day gives the bag a job.</h2>
          <p className="mt-5 max-w-lg text-lg leading-8 text-[var(--ink-soft)]">
            Carry starts with the commitment ahead, then turns that context into a checklist you can inspect and approve.
          </p>
        </div>
        <article className="rounded-[2rem] border border-black/10 bg-[var(--paper-strong)] p-6 shadow-[0_20px_60px_rgba(26,24,20,0.08)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5 border-b border-black/8 pb-6">
            <div>
              <p className="mono text-xs uppercase tracking-[0.16em] text-[var(--graphite)]">Upcoming activity</p>
              <h3 className="mt-2 text-3xl">{activity.name}</h3>
              <p className="mt-2 text-[var(--ink-soft)]">{activity.destination.name}</p>
            </div>
            <p className="rounded-full bg-[var(--forest)] px-3 py-2 text-xs text-[var(--paper)]">Requirements ready</p>
          </div>
          <dl className="grid gap-5 py-6 sm:grid-cols-3">
            <div>
              <dt className="mono text-xs uppercase tracking-[0.16em] text-[var(--graphite)]">Starts</dt>
              <dd className="mt-2 text-xl">{formatClock(activity.startTime)}</dd>
            </div>
            <div>
              <dt className="mono text-xs uppercase tracking-[0.16em] text-[var(--graphite)]">Leave by</dt>
              <dd className="mt-2 text-xl">{travel ? formatClock(travel.leaveBy) : 'Unavailable'}</dd>
            </div>
            <div>
              <dt className="mono text-xs uppercase tracking-[0.16em] text-[var(--graphite)]">Required</dt>
              <dd className="mt-2 text-xl">{rows.length} items</dd>
            </div>
          </dl>
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map((row) => (
              <div key={row.itemId} className="flex items-center justify-between rounded-2xl bg-[var(--paper)] px-4 py-3 text-sm">
                <span>{row.itemName}</span>
                <span className="mono text-xs uppercase tracking-[0.12em] text-[var(--graphite)]">Required</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
