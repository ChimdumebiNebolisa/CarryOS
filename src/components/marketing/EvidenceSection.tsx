import { buildLandingProof } from '@/application/landing-proof'
import { formatClock } from '@/lib/utils'

export function EvidenceSection() {
  const { activity, travel, calculator, alert } = buildLandingProof()

  return (
    <section id="evidence" className="border-y border-black/8 bg-[var(--paper)] px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--graphite)]">05 / Evidence</p>
          <h2 className="mt-4 max-w-xl text-5xl leading-[0.92] sm:text-6xl">Every intervention has a reason.</h2>
          <p className="mt-5 max-w-lg text-lg leading-8 text-[var(--ink-soft)]">
            Carry explains what happened, which commitment it affects, and what the next action is. It does not hide a decision behind a score or a vague AI label.
          </p>
        </div>
        <article className="rounded-[2rem] bg-[var(--forest)] p-6 text-[var(--paper)] sm:p-8">
          <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-5">
            <div>
              <p className="mono text-xs uppercase tracking-[0.16em] text-white/55">Evidence record</p>
              <h3 className="mt-2 text-3xl">{calculator?.itemName ?? 'Required item'}</h3>
            </div>
            <span className="rounded-full bg-[var(--caution)] px-3 py-2 text-xs text-[var(--ink)]">Not detected</span>
          </div>
          <dl className="grid gap-5 py-6 sm:grid-cols-2">
            <div>
              <dt className="mono text-xs uppercase tracking-[0.16em] text-white/50">Activity</dt>
              <dd className="mt-2">{activity.name}</dd>
            </div>
            <div>
              <dt className="mono text-xs uppercase tracking-[0.16em] text-white/50">Context</dt>
              <dd className="mt-2">{activity.destination.name}</dd>
            </div>
            <div>
              <dt className="mono text-xs uppercase tracking-[0.16em] text-white/50">Confidence</dt>
              <dd className="mt-2">{alert ? `${Math.round(alert.evidence.confidence * 100)}% demonstration policy` : 'Unavailable'}</dd>
            </div>
            <div>
              <dt className="mono text-xs uppercase tracking-[0.16em] text-white/50">Leave by</dt>
              <dd className="mt-2">{travel?.leaveBy ? formatClock(travel.leaveBy) : 'Unavailable'}</dd>
            </div>
          </dl>
          <p className="border-t border-white/15 pt-5 text-sm leading-6 text-white/75">
            {alert?.evidence.nextAction ?? 'Capture a fresh closed-bag scan.'}
          </p>
        </article>
      </div>
    </section>
  )
}
