import { ArrowDown, ArrowRight, Box, BrainCircuit, CalendarDays, CircleAlert, Radio, ShieldCheck } from 'lucide-react'

export function ArchitectureSection() {
  return (
    <section id="how-it-works" className="landing-section landing-architecture">
      <div className="landing-section-heading">
        <p className="landing-eyebrow">System architecture</p>
        <h2>How Carry works.</h2>
      </div>
      <div className="landing-architecture-map">
        <div className="landing-architecture-inputs">
          <article className="landing-architecture-node">
            <CalendarDays size={20} aria-hidden="true" />
            <div><strong>Context</strong><span>Context → Requirements</span></div>
          </article>
          <article className="landing-architecture-node">
            <Radio size={20} aria-hidden="true" />
            <div><strong>Bag / sensing</strong><span>Bag sensing → Observed state</span></div>
          </article>
        </div>
        <div className="landing-architecture-arrow"><ArrowRight size={20} aria-hidden="true" /></div>
        <article className="landing-architecture-core">
          <BrainCircuit size={24} aria-hidden="true" />
          <strong>CarryOS</strong>
          <span>Requirements + Observed state → Reconciliation</span>
        </article>
        <div className="landing-architecture-arrow"><ArrowRight size={20} aria-hidden="true" /></div>
        <div className="landing-architecture-outputs">
          <article className="landing-architecture-node"><ShieldCheck size={20} aria-hidden="true" /><div><strong>Readiness</strong><span>Ready / missing / uncertain</span></div></article>
          <article className="landing-architecture-node"><Box size={20} aria-hidden="true" /><div><strong>Evidence</strong><span>Why the state changed</span></div></article>
          <article className="landing-architecture-node"><CircleAlert size={20} aria-hidden="true" /><div><strong>Action</strong><span>Alert or ready</span></div></article>
        </div>
      </div>
      <div className="landing-flow-steps" aria-label="CarryOS internal flow">
        {['Context → Requirements', 'Bag sensing → Observed state', 'Requirements + Observed state → Reconciliation', 'Reconciliation → Readiness + Evidence + Action'].map((step, index) => (
          <div className="landing-flow-step" key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}{index < 3 ? <ArrowDown size={16} aria-hidden="true" /> : null}</div>
        ))}
      </div>
    </section>
  )
}
