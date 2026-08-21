import type { LandingScenario } from '@/application/landing-scenario'

export function MissingBeforeLeaveSection({ scenario }: { scenario: LandingScenario }) {
  const [warning, ready] = scenario.decisionStates

  return (
    <section id="the-proof" className="landing-section landing-contents-section">
      <div className="landing-container">
        <div className="landing-contents-intro">
          <p className="landing-section-kicker">Warning → fix → Ready</p>
          <h2>The answer changes when the evidence does.</h2>
          <p>Carry doesn’t assume the problem is fixed. It waits for a new closed-bag scan, then updates the decision.</p>
        </div>
        <div className="landing-recovery-sequence">
          <div className="landing-recovery-state landing-recovery-state--warning">
            <span>Before leaving</span>
            <p><strong>{warning.confirmedCount}</strong>/{warning.requiredCount}</p>
            <h3>{warning.label}</h3>
            <small>{scenario.primaryReason}</small>
          </div>
          <ol className="landing-recovery-actions">
            <li><span>01</span><strong>Add Notebook</strong></li>
            <li><span>02</span><strong>Close bag</strong></li>
            <li><span>03</span><strong>Run a new scan</strong></li>
          </ol>
          <div className="landing-recovery-state landing-recovery-state--ready">
            <span>After rescan</span>
            <p><strong>{ready.confirmedCount}</strong>/{ready.requiredCount}</p>
            <h3>{ready.label}</h3>
            <small>Confirmed from the latest closed-bag scan.</small>
          </div>
        </div>
      </div>
    </section>
  )
}
