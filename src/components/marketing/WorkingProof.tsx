'use client'

import { useMemo, useState } from 'react'
import { closeBagAndScan, createDemoSession, openBag, setItemPresent } from '@/application/demo-scenario'
import { ITEM_STATE_LABELS } from '@/domain/types'
import { Button } from '@/components/ui/button'

export function WorkingProof() {
  const [session, setSession] = useState(() => createDemoSession())
  const calculator = useMemo(
    () => session.inventory.find((state) => state.itemId === 'calculator'),
    [session],
  )

  return (
    <section id="observed" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--graphite)]">03 / Observed bag state</p>
          <h2 className="mt-3 text-5xl leading-[0.92] sm:text-6xl">The bag tells a different story.</h2>
          <p className="mt-4 max-w-xl text-[var(--ink-soft)]">
            Close the bag and let the real CarryOS engine compare the requirements with the observed contents. The calculator is missing, so Carry says so.
          </p>
          <p className="mt-4 text-sm text-[var(--graphite)]">
            Simulated RFID. The bag starts with a laptop sleeve, notebook, and student ID. The calculator is absent.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-black/8 bg-[var(--paper-strong)] p-5 shadow-[0_20px_50px_rgba(26,24,20,0.08)]">
          <p className="mono text-xs uppercase tracking-[0.16em] text-[var(--graphite)]" aria-live="polite">
            {session.readiness.label}
          </p>
          <p className="mt-2 text-2xl">{session.readiness.detail}</p>
          <p className="mt-3 text-sm">
            Calculator: {calculator ? ITEM_STATE_LABELS[calculator.status] : 'Unknown'}
          </p>
          {session.alerts[0] ? (
            <p className="mt-3 rounded-2xl bg-[var(--forest)] px-4 py-3 text-sm text-[var(--paper)]">
              {session.alerts[0].evidence.summary} Leave by 8:35 AM.
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => setSession((current) => closeBagAndScan(current))}
              disabled={session.sensorStatus === 'disconnected' || session.scans.some((scan) => scan.status === 'running')}
            >
              Close bag and scan
            </Button>
            <Button
              type="button"
              variant="paper"
              onClick={() =>
                setSession((current) => {
                  const opened = current.bagIsOpen ? current : openBag(current)
                  return setItemPresent(opened, 'calculator', true)
                })
              }
            >
              Add calculator
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
