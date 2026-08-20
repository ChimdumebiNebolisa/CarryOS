import { AlertTriangle, Clock3, Database, Radio } from 'lucide-react'

const limitations = [
  { icon: Radio, title: 'Simulated sensing', detail: 'Physical RFID, NFC, and inside-versus-outside classification are not validated.' },
  { icon: Clock3, title: 'Simulated travel', detail: 'There is no live Maps adapter and no invented leave-by time when travel is unavailable.' },
  { icon: Database, title: 'No persistence', detail: 'There are no accounts, database, or cross-session inventory claims in this prototype.' },
  { icon: AlertTriangle, title: 'Honest uncertainty', detail: 'A failed, stale, incomplete, or missing scan cannot produce Ready.' },
]

export function LimitationsSection() {
  return (
    <section id="limitations" className="landing-section landing-limitations">
      <div className="landing-limitations-layout">
        <div>
          <p className="landing-eyebrow">Honest limitations</p>
          <h2>What this prototype does not claim.</h2>
          <p>Carry is software-first. The boundary stays visible while the hardware layer is still future work.</p>
        </div>
        <div className="landing-limitations-list">
          {limitations.map(({ icon: Icon, title, detail }) => (
            <div className="landing-limitation-row" key={title}><Icon size={18} aria-hidden="true" /><div><strong>{title}</strong><span>{detail}</span></div></div>
          ))}
        </div>
      </div>
    </section>
  )
}
