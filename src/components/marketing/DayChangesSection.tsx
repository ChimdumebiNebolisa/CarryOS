import type { LandingScenario } from '@/application/landing-scenario'

export function DayChangesSection({ scenario }: { scenario: LandingScenario }) {
  return (
    <section className="landing-section landing-day-changes">
      <div className="landing-container">
        <div className="landing-grid landing-day-layout">
          <div className="landing-day-intro">
            <h2>Your bag changes because your day changes.</h2>
            <p>Class, weather, plans, and where you’re headed can all change what you need to bring.</p>
          </div>
          <ol className="landing-day-agenda">
            {scenario.events.map((event) => (
              <li key={event.id} className={`landing-day-agenda-row landing-day-agenda-row--${event.id}`}>
                <time>{event.time}</time>
                <h3>{event.name}</h3>
                <p>{event.needs.map((need) => need.name).join(' · ')}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
