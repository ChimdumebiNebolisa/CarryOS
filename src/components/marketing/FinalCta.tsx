import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getPublicEnv } from '@/lib/env'

export function FinalCta() {
  const { repositoryUrl } = getPublicEnv()

  return (
    <section className="landing-final-cta">
      <Image src="/carryos-backpack.png" alt="" aria-hidden="true" width={1465} height={1024} />
      <div className="landing-container landing-final-cta-content">
        <p className="landing-section-kicker">One bag. A clearer departure.</p>
        <h2>Know what you need. Know what’s with you. Know before you go.</h2>
        <div className="landing-actions landing-final-actions">
          <Button asChild className="landing-primary-cta" size="lg" variant="paper"><Link href="/demo">Open simulated demo</Link></Button>
          <a className="landing-secondary-link" href={repositoryUrl} rel="noreferrer" target="_blank">View source</a>
        </div>
      </div>
    </section>
  )
}
