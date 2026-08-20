import Link from 'next/link'
import { CarryStateStack } from '@/components/marketing/CarryStateStack'
import { Button } from '@/components/ui/button'
import { getPublicEnv } from '@/lib/env'

export function Hero() {
  const { repositoryUrl } = getPublicEnv()

  return (
    <section className="relative overflow-hidden bg-[var(--forest)] text-[var(--paper)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-0 pt-5 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <p className="mono text-xs tracking-[0.22em] uppercase">CarryOS</p>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/demo" className="hover:text-white">
              Demo
            </Link>
            <a href={repositoryUrl} rel="noreferrer" target="_blank">
              Source ↗
            </a>
          </nav>
        </header>
        <div className="mx-auto mt-16 max-w-3xl text-center sm:mt-20">
          <h1 className="text-5xl leading-[0.92] sm:text-7xl">Carry less uncertainty.</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
            Your backpack should understand what matters before you leave.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/demo" data-testid="run-demo">Run the live demo</Link>
            </Button>
            <Button asChild variant="ghost">
              <a href={repositoryUrl} rel="noreferrer" target="_blank">
                View source ↗
              </a>
            </Button>
          </div>
          <p className="mx-auto mt-6 max-w-lg text-sm text-white/60">
            RFID input in this prototype is simulated. Carry does not claim physical reader validation.
          </p>
        </div>
        <div className="mt-16 flex-1 translate-y-8 sm:translate-y-12">
          <CarryStateStack />
        </div>
      </div>
    </section>
  )
}
