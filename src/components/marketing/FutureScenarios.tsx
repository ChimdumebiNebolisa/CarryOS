import { BatteryMedium, Plane, ShieldCheck } from 'lucide-react'

const scenarios = [
  { label: 'Device readiness', title: 'Battery-aware routines', description: 'A future device signal could add charging to the preparation plan without changing inventory truth.' },
  { label: 'Security', title: 'Bag movement', description: 'A future security layer could surface a changed routine before the user leaves.' },
  { label: 'Travel', title: 'Context-aware carry', description: 'A future travel adapter could create a separate plan for longer trips and new requirements.' },
]

export function FutureScenarios() {
  return (
    <section id="future" className="landing-section landing-future">
      <div className="landing-section-heading landing-centered-heading">
        <p className="landing-eyebrow">Future capability</p>
        <h2>What Carry can become.</h2>
      </div>
      <div className="landing-future-layout">
        <article className="landing-future-card landing-future-primary">
          <div className="landing-future-visual future-battery-visual">
            <BatteryMedium size={28} aria-hidden="true" />
            <div className="future-battery"><span /><span /><span /><span /><span /></div>
            <strong>18%</strong>
            <span>LOW / FUTURE SIGNAL</span>
          </div>
          <div className="landing-future-copy">
            <span className="landing-panel-label">{scenarios[0].label}</span>
            <h3>{scenarios[0].title}</h3>
            <p>{scenarios[0].description}</p>
            <span className="landing-future-status">Not operational here</span>
          </div>
        </article>
        <div className="landing-future-side">
          <article className="landing-future-card landing-future-compact">
            <div className="landing-future-visual future-security-visual"><ShieldCheck size={32} aria-hidden="true" /><span>trusted zone</span></div>
            <div className="landing-future-copy"><span className="landing-panel-label">{scenarios[1].label}</span><h3>{scenarios[1].title}</h3><p>{scenarios[1].description}</p></div>
          </article>
          <article className="landing-future-card landing-future-compact">
            <div className="landing-future-visual future-travel-visual"><Plane size={28} aria-hidden="true" /><span>context / route / time</span></div>
            <div className="landing-future-copy"><span className="landing-panel-label">{scenarios[2].label}</span><h3>{scenarios[2].title}</h3><p>{scenarios[2].description}</p></div>
          </article>
        </div>
      </div>
    </section>
  )
}
