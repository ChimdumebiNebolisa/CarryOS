import { Button } from '@/components/ui/button'
import { BackpackVisual } from '@/components/marketing/BackpackVisual'
import { getPublicEnv } from '@/lib/env'

export function Hero() {
  const { repositoryUrl } = getPublicEnv()

  return (
    <section className="landing-hero">
      <div className="landing-container landing-hero-grid">
        <div className="landing-hero-copy">
          <h1><span>Know before</span><span>you go.</span></h1>
          <p className="landing-hero-lede">CarryOS knows what you’ll need today, checks what’s already with you, and warns you before you leave something important behind.</p>
          <div className="landing-actions">
            <Button asChild size="lg" variant="paper"><a href={repositoryUrl} rel="noreferrer" target="_blank">View on GitHub</a></Button>
            <a className="landing-secondary-link" href="#how-it-works">See how it works</a>
          </div>
        </div>
        <div className="landing-hero-product">
          <BackpackVisual />
        </div>
      </div>
    </section>
  )
}
