export function BeliefSection() {
  return (
    <section className="border-t border-black/8 bg-[var(--paper-strong)] px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--graphite)]">Belief</p>
          <h2 className="mt-3 text-4xl">Inventory is a belief, not a database row.</h2>
        </div>
        <ul className="space-y-4 text-[var(--ink-soft)]">
          <li>Confirmed only after a recent closed-bag scan with strong evidence.</li>
          <li>Probable when the item was seen but the read is weak or inconsistent.</li>
          <li>Not detected only after a valid scan finds no matching observation.</li>
          <li>Unknown when Carry cannot evaluate safely.</li>
          <li>Stale as soon as the bag opens after the evidence.</li>
        </ul>
      </div>
    </section>
  )
}
