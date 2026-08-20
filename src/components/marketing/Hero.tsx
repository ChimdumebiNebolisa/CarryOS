import Link from 'next/link'
import Image from 'next/image'
import { Check } from 'lucide-react'
import { buildLandingProof } from '@/application/landing-proof'
import { Button } from '@/components/ui/button'
import { getPublicEnv } from '@/lib/env'
import { formatClock } from '@/lib/utils'

export function Hero() {
  const { repositoryUrl } = getPublicEnv()
  const { activity, missingItem, rows } = buildLandingProof()

  return (
    <section className="landing-hero relative overflow-hidden">
      <div className="landing-shell">
        <header className="landing-nav">
          <Link href="/" className="landing-wordmark">CarryOS</Link>
          <nav className="landing-nav-links" aria-label="Primary navigation">
            <a className="is-active" href="#system">System</a>
            <a href="#sensing">Technology</a>
            <a href="#future">Vision</a>
          </nav>
          <Link className="landing-nav-button" href="/demo">Watch demo</Link>
        </header>

        <div className="landing-hero-grid">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">CarryOS / Physical intelligence</p>
            <h1>Your backpack should know what the day asks of you.</h1>
            <p className="landing-hero-lede">
              CarryOS turns the day ahead into a clear packing plan, then checks the closed bag before you leave.
            </p>
            <div className="landing-actions">
              <Button asChild size="lg">
                <Link href="/demo" data-testid="run-demo">Run the live demo</Link>
              </Button>
              <a className="landing-source-link" href={repositoryUrl} rel="noreferrer" target="_blank">View the source ↗</a>
            </div>
            <p className="landing-hero-proof-line">Context. Inventory belief. Leave by. Action.</p>
          </div>

          <div className="landing-hero-product" aria-labelledby="hero-product-title">
            <div className="landing-hero-image-wrap">
              <Image
                src="/carryos-backpack.png"
                alt="A matte black backpack presented as the physical object CarryOS reasons about"
                className="landing-backpack-image"
                width={1465}
                height={1024}
                priority
              />
              <span className="landing-hero-glow" aria-hidden="true" />
            </div>
            <div className="landing-intelligence-overlay">
              <div className="landing-overlay-heading">
                <span id="hero-product-title" className="landing-status-critical">{missingItem ? `${rows.filter((row) => row.relationship === 'missing').length} ITEM MISSING` : 'NO OPEN ALERT'}</span>
                <span>{formatClock(activity.startTime)} / {activity.name}</span>
              </div>
              <ul>
                {rows.map((row) => (
                  <li key={row.itemId} className={row.relationship === 'missing' ? 'is-missing' : ''}>
                    <span>{row.itemName}</span>
                    {row.relationship === 'missing' ? <span className="landing-missing-chip">Missing</span> : <Check size={14} aria-hidden="true" />}
                  </li>
                ))}
              </ul>
              <span className="landing-overlay-connector" aria-hidden="true" />
            </div>
            <p className="landing-image-note">A physical anchor for inventory belief</p>
          </div>
        </div>
      </div>
    </section>
  )
}
