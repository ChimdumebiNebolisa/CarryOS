import Link from 'next/link'
import { CarryStateStack } from '@/components/marketing/CarryStateStack'
import { Button } from '@/components/ui/button'
import { getPublicEnv } from '@/lib/env'

export function Hero() {
  const { repositoryUrl } = getPublicEnv()

  return (
    <section className="relative overflow-hidden bg-[var(--forest)] text-[var(--paper)]">
      <div className="mx-auto flex min-h-[min(900px,100svh)] max-w-7xl flex-col px-4 pb-8 pt-5 sm:px-6 lg:pb-12">
        <header className="flex items-center justify-between gap-4">
          <p className="mono text-xs tracking-[0.22em] uppercase">CarryOS</p>
          <nav className="flex items-center gap-4 text-sm text-white/70" aria-label="Primary navigation">
            <Link href="/demo" className="hover:text-white">
              Demo
            </Link>
            <a href={repositoryUrl} rel="noreferrer" target="_blank" className="hover:text-white">
              Source ↗
            </a>
          </nav>
        </header>
        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8 lg:py-12">
          <div className="max-w-2xl">
            <p className="mono text-xs uppercase tracking-[0.2em] text-white/55">Backpack intelligence, made inspectable</p>
            <h1 className="mt-5 max-w-2xl text-6xl leading-[0.86] sm:text-8xl lg:text-[7.75rem]">Your backpack should know what the day asks of you.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-white/72 sm:text-xl">
              Carry turns the next commitment into requirements, compares them with what was actually observed, and tells you what to do before you leave.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/demo" data-testid="run-demo">Run the live demo</Link>
              </Button>
              <Button asChild variant="ghost">
                <a href={repositoryUrl} rel="noreferrer" target="_blank">
                  View the source ↗
                </a>
              </Button>
            </div>
            <p className="mt-6 max-w-lg text-sm leading-6 text-white/55">
              This prototype uses simulated RFID input. It demonstrates the decision loop, not validated physical hardware.
            </p>
          </div>
          <div className="min-w-0 lg:translate-y-6">
            <CarryStateStack />
          </div>
        </div>
      </div>
    </section>
  )
}
