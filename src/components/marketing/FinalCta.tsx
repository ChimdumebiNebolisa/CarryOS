import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { getPublicEnv } from '@/lib/env'

export function FinalCta() {
  const { repositoryUrl } = getPublicEnv()

  return (
    <section className="landing-final-cta">
      <Image src="/carryos-backpack.png" alt="" aria-hidden="true" width={1465} height={1024} />
      <div className="landing-final-cta-content">
        <p className="landing-eyebrow">CarryOS / Final state</p>
        <h2>Know before you go.</h2>
        <p>Turn the things you carry into a system that understands where you are headed.</p>
        <div className="landing-actions">
          <Button asChild size="lg"><Link href="/demo">Run the live demo</Link></Button>
          <Button asChild variant="ghost"><a href={repositoryUrl} rel="noreferrer" target="_blank">View the source ↗</a></Button>
        </div>
      </div>
    </section>
  )
}
