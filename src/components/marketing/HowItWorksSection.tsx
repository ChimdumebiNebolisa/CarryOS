import type { LandingScenario } from '@/application/landing-scenario'
import { DecisionTrace } from '@/components/marketing/DecisionTrace'

export function HowItWorksSection({ scenario }: { scenario: LandingScenario }) {
  return (
    <section id="how-it-works" className="landing-section landing-how-it-works">
      <div className="landing-container">
        <div className="landing-grid landing-how-intro">
          <p className="landing-section-kicker">A decision, not a checklist</p>
          <h2>How Carry decides.</h2>
          <p>Carry connects where you’re headed to what you approved, then asks what the latest evidence can actually prove.</p>
        </div>
        <DecisionTrace scenario={scenario} />
        <p className="landing-simulation-note">Sensing and travel are simulated in this prototype. Readiness comes only from the latest valid closed-bag scan.</p>
      </div>
    </section>
  )
}
