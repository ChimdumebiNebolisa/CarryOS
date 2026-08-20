import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getPublicEnv } from '@/lib/env'

export function FinalCta() {
  const { repositoryUrl } = getPublicEnv()

  return (
    <section className="bg-[var(--ink)] px-4 py-20 text-[var(--paper)] sm:px-6 lg:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-white/50">09 / Next action</p>
          <h2 className="mt-4 max-w-2xl text-5xl leading-[0.92] sm:text-7xl">Leave with less to wonder about.</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/70">Run the deterministic loop, then inspect how Carry keeps AI suggestions separate from readiness.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/demo">Run the live demo</Link>
          </Button>
          <Button asChild variant="ghost">
            <a href={repositoryUrl} rel="noreferrer" target="_blank">View the source ↗</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
