import { Button } from '@/components/ui/button'
import { BackpackVisual } from '@/components/marketing/BackpackVisual'
import { getPublicEnv } from '@/lib/env'
import Link from 'next/link'

export function Hero() {
  const { repositoryUrl } = getPublicEnv()

  return (
    <section className="landing-hero">
      <div className="landing-container landing-hero-grid">
        <div className="landing-hero-copy">
          <p className="landing-hero-kicker">Context-aware inventory</p>
          <h1><span>Know before</span><span>you go.</span></h1>
          <p className="landing-hero-lede">CarryOS knows what you’ll need today, checks what’s already with you, and warns you before you leave something important behind.</p>
          <div className="landing-actions">
            <Button asChild className="landing-primary-cta" size="lg" variant="paper"><Link href="/demo">Open simulated demo</Link></Button>
            <a className="landing-secondary-link" href={repositoryUrl} rel="noreferrer" target="_blank">View source</a>
          </div>
        </div>
        <div className="landing-hero-product">
          <BackpackVisual />
        </div>
      </div>
    </section>
  )
}
