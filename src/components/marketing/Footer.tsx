import Link from 'next/link'
import { getPublicEnv } from '@/lib/env'

export function Footer() {
  const { repositoryUrl } = getPublicEnv()

  return (
    <footer className="border-t border-white/10 bg-[var(--forest)] px-4 py-8 text-[var(--paper)] sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mono text-xs uppercase tracking-[0.2em]">CarryOS</p>
          <p className="mt-2 text-white/55">Software-first backpack readiness, with simulated RFID evidence.</p>
        </div>
        <nav className="flex flex-wrap gap-4 text-white/70" aria-label="Footer navigation">
          <Link href="/demo" className="hover:text-white">Demo</Link>
          <a href={repositoryUrl} rel="noreferrer" target="_blank" className="hover:text-white">Source ↗</a>
        </nav>
      </div>
    </footer>
  )
}
