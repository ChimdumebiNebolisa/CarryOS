import { Check, CircleAlert, Laptop, NotebookTabs, Plug, Umbrella } from 'lucide-react'
import Image from 'next/image'
import { buildLandingProof } from '@/application/landing-proof'

const itemIcons = {
  laptop: Laptop,
  charger: Plug,
  notebook: NotebookTabs,
  umbrella: Umbrella,
} as const

export function SensingSection() {
  const { rows } = buildLandingProof()

  return (
    <section id="sensing" className="landing-section landing-sensing">
      <div className="landing-section-heading landing-centered-heading">
        <p className="landing-eyebrow">Bag / sensing</p>
        <h2>Carry understands what is already there.</h2>
        <p>A closed-bag observation becomes an inventory belief, not a claim about exact physical hardware layout.</p>
      </div>
      <div className="landing-sensing-stage">
        <div className="landing-sensing-grid" aria-hidden="true" />
        <div className="landing-sensing-object">
          <Image src="/carryos-backpack.png" alt="" aria-hidden="true" width={1465} height={1024} />
          <div className="landing-bag-zone zone-laptop" />
          <div className="landing-bag-zone zone-charger" />
          <div className="landing-bag-zone zone-notebook" />
          <div className="landing-bag-zone zone-umbrella" />
        </div>
        <div className="landing-sensing-label sensing-laptop"><span><Check size={13} /> Detected</span><strong>Laptop</strong></div>
        <div className="landing-sensing-label sensing-charger"><span><Check size={13} /> Detected</span><strong>Charger</strong></div>
        <div className="landing-sensing-label sensing-notebook is-missing"><span><CircleAlert size={13} /> Not detected</span><strong>Notebook</strong></div>
        <div className="landing-sensing-label sensing-umbrella"><span><Check size={13} /> Detected</span><strong>Umbrella</strong></div>
      </div>
      <div className="landing-sensing-summary" aria-label="Accessible sensing state description">
        {rows.map((row) => {
          const Icon = itemIcons[row.itemId as keyof typeof itemIcons] ?? NotebookTabs
          return (
            <span key={row.itemId} className={row.relationship === 'missing' ? 'is-missing' : ''}>
              <Icon size={15} aria-hidden="true" /> {row.itemName}: {row.relationship === 'missing' ? 'not detected' : 'detected'}
            </span>
          )
        })}
      </div>
      <p className="landing-concept-note">Conceptual sensing visualization. The production demo remains the source of truth for inventory state.</p>
    </section>
  )
}
