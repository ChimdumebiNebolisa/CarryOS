import { ArrowRight, CalendarDays, CloudRain, Laptop, NotebookTabs, Plug, Umbrella } from 'lucide-react'
import { buildLandingProof } from '@/application/landing-proof'
import { DEMO_WEATHER_NOTE } from '@/fixtures/demo-scenario'
import { formatClock } from '@/lib/utils'

const itemIcons = {
  laptop: Laptop,
  charger: Plug,
  notebook: NotebookTabs,
  umbrella: Umbrella,
} as const

export function ContextRequirements() {
  const { activity, rows } = buildLandingProof()

  return (
    <section id="context" className="landing-section landing-context">
      <div className="landing-section-heading landing-centered-heading">
        <p className="landing-eyebrow">Context creates requirements</p>
        <h2>Your bag changes because your day changes.</h2>
        <p>Contextual signals become a concrete packing plan before sensing begins.</p>
      </div>
      <div className="landing-context-flow">
        <article className="landing-context-source">
          <p className="landing-panel-label">Context</p>
          <div className="landing-signal-list">
            <div className="landing-signal-row">
              <span><CalendarDays size={16} aria-hidden="true" /> {formatClock(activity.startTime)} / {activity.name}</span>
              <CalendarDays size={18} aria-hidden="true" />
            </div>
            <div className="landing-signal-row">
              <span><CloudRain size={16} aria-hidden="true" /> {DEMO_WEATHER_NOTE}</span>
              <CloudRain size={18} aria-hidden="true" />
            </div>
          </div>
        </article>
        <div className="landing-context-derivation" aria-hidden="true">
          <span>derive</span>
          <ArrowRight size={22} />
        </div>
        <article className="landing-context-output">
          <p className="landing-panel-label">Requirements</p>
          <div className="landing-requirement-grid">
            {rows.map((row) => {
              const Icon = itemIcons[row.itemId as keyof typeof itemIcons] ?? NotebookTabs
              const source = row.itemId === 'umbrella' ? 'Rain' : activity.name
              return (
                <div className="landing-requirement-chip" key={row.itemId}>
                  <Icon size={16} aria-hidden="true" />
                  <span><strong>{row.itemName}</strong><small>{source}</small></span>
                </div>
              )
            })}
          </div>
        </article>
      </div>
    </section>
  )
}
