import type { LandingScenario } from '@/application/landing-scenario'

export function MissingBeforeLeaveSection({ scenario }: { scenario: LandingScenario }) {
  const packedItems = scenario.packingItems.filter((item) => item.state === 'packed')

  return (
    <section id="inside-the-bag" className="landing-section landing-contents-section">
      <div className="landing-container">
        <div className="landing-contents-intro">
          <h2>Carry knows what’s already with you.</h2>
          <p>Before you leave, Carry checks what’s packed and what is still missing.</p>
        </div>
        <div className="landing-grid landing-contents-layout">
          <div className="landing-inventory-composition" aria-label="Laptop, Charger, and Umbrella packed.">
            {packedItems.map((item) => (
              <div key={item.id} className={`landing-inventory-item landing-inventory-item--${item.slot}`}>
                <strong>{item.name}</strong>
                <span>PACKED</span>
              </div>
            ))}
          </div>
          <div className="landing-contents-result">
            <h3>{scenario.primaryMissingItem.name} missing.</h3>
            <p>{scenario.primaryReason}</p>
            <span>From your calendar</span>
          </div>
        </div>
      </div>
    </section>
  )
}
