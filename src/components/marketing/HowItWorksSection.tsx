import type { LandingScenario } from '@/application/landing-scenario'

export function HowItWorksSection({ scenario }: { scenario: LandingScenario }) {
  const [algorithms] = scenario.events

  return (
    <section id="how-it-works" className="landing-section landing-how-it-works">
      <div className="landing-container">
        <div className="landing-grid landing-how-intro">
          <h2>How Carry works</h2>
          <p>Carry follows the day ahead, checks what you’re carrying, and catches what you forgot.</p>
        </div>
        <div className="landing-grid landing-how-sequence" aria-label="Algorithms packing check sequence">
          <div className="landing-how-origin"><time>{algorithms.time}</time><strong>{algorithms.name}</strong></div>
          <span className="landing-how-arrow" aria-hidden="true">→</span>
          <div className="landing-how-needs"><span>Today you’ll need</span><p>{scenario.requiredItems.map((item) => item.name).join(' · ')}</p></div>
          <span className="landing-how-arrow" aria-hidden="true">→</span>
          <div className="landing-how-check"><span>Carry checks what’s packed</span></div>
          <div className="landing-how-result">
            <span className="landing-how-result-arrow" aria-hidden="true">→</span>
            <strong>{scenario.primaryMissingItem.name}<br />missing</strong>
          </div>
        </div>
      </div>
    </section>
  )
}
