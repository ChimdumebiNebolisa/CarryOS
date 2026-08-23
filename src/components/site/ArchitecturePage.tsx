'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArchitectureExplorer } from '@/components/site/ArchitectureExplorer'
import { DEFAULT_SELECTED_SUBSYSTEM_ID } from '@/components/site/architecture'
import { getPublicEnv } from '@/lib/env'

export function ArchitecturePage() {
  const [selectedId, setSelectedId] = useState<string | null>(DEFAULT_SELECTED_SUBSYSTEM_ID)
  const { repositoryUrl } = getPublicEnv()

  return (
    <main className="arch-page">
      <header className="arch-bar">
        <p className="arch-bar-brand">
          <Link className="arch-wordmark" href="/">
            CarryOS
          </Link>
          <span className="arch-bar-label">/ Architecture</span>
        </p>
        <nav className="arch-bar-nav" aria-label="Site">
          <a className="arch-source" href={repositoryUrl} rel="noreferrer" target="_blank">
            Source
          </a>
          <Link className="arch-source" href="/">
            ← Home
          </Link>
        </nav>
      </header>

      <div className="arch-shell">
        <section className="arch-intro">
          <h1>How context becomes an intervention.</h1>
          <p className="mono">
            Context → approved requirements + observed inventory → readiness → intervention
          </p>
        </section>

        <ArchitectureExplorer selectedId={selectedId} onSelect={setSelectedId} />

        <p className="arch-disclosure mono">
          RFID observation is simulated — physical reader integration is future work (docs/hardware-plan.md).
        </p>
      </div>
    </main>
  )
}
