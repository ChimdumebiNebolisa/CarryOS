const scenarios = [
  {
    label: 'Future scenario 01',
    title: 'Weather-aware departure',
    description: 'A future weather adapter could suggest an umbrella when the route and forecast make it relevant.',
  },
  {
    label: 'Future scenario 02',
    title: 'Security-aware carry',
    description: 'A future security layer could surface a forgotten badge or a changed routine before the user leaves.',
  },
  {
    label: 'Future scenario 03',
    title: 'Battery-aware routines',
    description: 'A future device signal could add charging to the preparation plan without changing inventory truth.',
  },
]

export function FutureScenarios() {
  return (
    <section id="future" className="bg-[var(--forest-mid)] px-4 py-20 text-[var(--paper)] sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="mono text-xs uppercase tracking-[0.18em] text-white/55">06 / Future CarryOS scenarios</p>
          <h2 className="mt-4 text-5xl leading-[0.92] sm:text-6xl">The same loop can learn more contexts.</h2>
          <p className="mt-5 text-lg leading-8 text-white/70">
            These are product directions, not connected capabilities in this prototype. They stay separate from the evidence that currently decides readiness.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {scenarios.map((scenario) => (
            <article key={scenario.title} className="rounded-[1.75rem] border border-white/15 p-5 sm:p-6">
              <p className="mono text-xs uppercase tracking-[0.14em] text-white/50">{scenario.label}</p>
              <h3 className="mt-12 text-2xl">{scenario.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/70">{scenario.description}</p>
              <p className="mt-8 text-xs uppercase tracking-[0.14em] text-[var(--caution)]">Not operational here</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
