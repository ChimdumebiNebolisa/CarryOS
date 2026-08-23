'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArchitectureDiagram } from '@/components/site/ArchitectureDiagram'
import {
  DEFAULT_SELECTED_SUBSYSTEM_ID,
  kindLegend,
  subsystemById,
} from '@/components/site/architecture'
import { getPublicEnv } from '@/lib/env'

export function ArchitecturePage() {
  const [selectedId, setSelectedId] = useState<string | null>(DEFAULT_SELECTED_SUBSYSTEM_ID)
  const selected = selectedId ? subsystemById[selectedId] : undefined
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
          <p>
            An upcoming event becomes an approved list of required items. Closed-bag scans turn into evidence.
            Evidence becomes an inventory belief. Belief and requirements decide readiness, and leave-by timing
            decides when to warn. Select a subsystem to inspect it.
          </p>
          <ul className="arch-legend" aria-label="Trust boundaries">
            {kindLegend.map((entry) => (
              <li key={entry.kind}>
                <span className={`arch-legend-swatch arch-node-${entry.kind}`} aria-hidden="true" />
                {entry.label}
              </li>
            ))}
          </ul>
        </section>

        <div id="subsystems" className="arch-layout">
          <ArchitectureDiagram selectedId={selectedId} onSelect={setSelectedId} />
          <aside className="arch-panel" aria-live="polite">
            {selected ? (
              <article>
                <p className={`arch-panel-tag arch-panel-tag-${selected.kind}`}>{selected.tag}</p>
                <h2>{selected.title}</h2>
                {selected.sub ? <p className="arch-panel-sub">{selected.sub}</p> : null}
                <p className="arch-panel-body">{selected.body}</p>
                <ul className="arch-panel-facts">
                  {selected.facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              </article>
            ) : (
              <p className="arch-panel-body">Select a subsystem in the diagram to inspect it.</p>
            )}
          </aside>
        </div>

        <p className="arch-disclosure mono">
          RFID observation is simulated. Physical reader integration is future work — see docs/hardware-plan.md.
        </p>
      </div>
    </main>
  )
}
