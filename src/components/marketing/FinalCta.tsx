import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { getPublicEnv } from '@/lib/env'

export function FinalCta() {
  const { repositoryUrl } = getPublicEnv()

  return (
    <section className="landing-final-cta">
      <Image src="/carryos-backpack.png" alt="" aria-hidden="true" width={1465} height={1024} />
      <div className="landing-container landing-final-cta-content">
        <h2>Turn the things you carry into a system that understands where you’re headed.</h2>
        <Button asChild size="lg" variant="paper"><a href={repositoryUrl} rel="noreferrer" target="_blank">View on GitHub</a></Button>
      </div>
    </section>
  )
}
