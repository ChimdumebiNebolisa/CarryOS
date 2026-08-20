import { CalendarDays } from 'lucide-react'
import { buildLandingProof } from '@/application/landing-proof'
import { formatClock } from '@/lib/utils'

export function EvidenceSection() {
  const { activity, travel, missingItem, alert } = buildLandingProof()

  return (
    <section id="evidence" className="landing-section landing-evidence">
      <div className="landing-section-heading landing-centered-heading">
        <p className="landing-eyebrow">Evidence record</p>
        <h2>Carry explains why.</h2>
        <p>Every intervention is tied to the commitment, observation, and next action that produced it.</p>
      </div>
      <article className="landing-evidence-card">
        <div className="landing-evidence-card-top">
          <div>
            <span className="landing-panel-label">Evidence card</span>
            <h3>{missingItem?.itemName ?? 'Required item'} missing / Why Carry flagged it</h3>
          </div>
          <span className="landing-alert-mark" aria-label="Critical evidence">!</span>
        </div>
        <div className="landing-evidence-split">
          <div className="landing-evidence-source">
            <CalendarDays size={20} aria-hidden="true" />
            <div>
              <strong>Source: Calendar invite</strong>
              <span>{activity.name} / {activity.destination.name}</span>
              <span>{formatClock(activity.startTime)} / {activity.destination.description ?? 'Scheduled commitment'}</span>
            </div>
          </div>
          <div className="landing-evidence-confidence">
            <div className="landing-confidence-row">
              <span>Confidence: {alert ? 'High' : 'Unavailable'}</span>
              <span className="mono">Evidence-backed policy</span>
            </div>
            <div className="landing-confidence-bar"><span style={{ width: `${alert ? Math.round(alert.evidence.confidence * 100) : 0}%` }} /></div>
          </div>
        </div>
        <div className="landing-reasoning">
          <strong>Reasoning</strong>
          <p>{alert?.evidence.summary ?? 'A fresh closed-bag scan is required before Carry can explain this state.'} {travel?.leaveBy ? `Leave by ${formatClock(travel.leaveBy)}.` : ''}</p>
        </div>
      </article>
    </section>
  )
}
