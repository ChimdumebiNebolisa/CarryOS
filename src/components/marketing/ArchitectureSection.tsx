export function ArchitectureSection() {
  return (
    <section className="border-y border-black/8 bg-[var(--forest)] px-4 py-20 text-[var(--paper)] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="mono text-xs uppercase tracking-[0.18em] text-white/55">Architecture</p>
        <h2 className="mt-3 max-w-3xl text-4xl">Event context becomes an intervention only after evidence.</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            'Event context',
            'Profile suggestion',
            'User approval',
            'Activity requirements',
            'Simulated observation',
            'Inventory belief',
            'Readiness',
            'Intervention',
          ].map((step, index) => (
            <li key={step} className="rounded-2xl border border-white/10 px-4 py-3">
              <span className="mono mr-3 text-white/45">{String(index + 1).padStart(2, '0')}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
