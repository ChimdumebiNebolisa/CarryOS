'use client'

import * as Dialog from '@radix-ui/react-dialog'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  acknowledge,
  applySuggestionDecision,
  armFailedScan,
  closeBagAndScan,
  createDemoSession,
  disconnectReader,
  openBag,
  reconnectReader,
  resetDemo,
  setItemLocationHint,
  setItemPresent,
  setItemQuality,
  setSuggestions,
  type DemoSession,
} from '@/application/demo-scenario'
import { ITEM_STATE_LABELS, type CarryProfileResult } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { formatClock } from '@/lib/utils'

export function DemoWorkspace() {
  const [session, setSession] = useState(() => createDemoSession())
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null)
  const [aiStatus, setAiStatus] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const alert = session.alerts.find((item) => item.id === selectedAlert) ?? session.alerts[0]
  function update(updater: (current: DemoSession) => DemoSession) {
    setSession((current) => {
      const next = updater(current)
      if (
        typeof Notification !== 'undefined' &&
        next.browserPermission === 'granted' &&
        next.notifications[0] &&
        next.notifications[0].id !== current.notifications[0]?.id
      ) {
        new Notification(next.notifications[0].title, { body: next.notifications[0].body })
      }
      return next
    })
  }

  async function requestProfile() {
    setAiBusy(true)
    setAiStatus('Generating suggestions...')
    try {
      const response = await fetch('/api/carry-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: {
            name: session.activity.name,
            type: session.activity.type,
            description: session.activity.destination.description ?? session.activity.name,
            location: session.activity.destination.name,
            explicitInstructions: 'Bring the approved requirements for this activity.',
          },
          registeredItems: session.items.map((item) => ({
            itemId: item.id,
            name: item.name,
            category: item.category,
          })),
        }),
      })
      const body = (await response.json()) as CarryProfileResult | { error: string }
      if (!response.ok || !('source' in body)) {
        setAiStatus('error' in body ? body.error : 'Suggestions are unavailable. Try again.')
        return
      }
      setSession((current) => setSuggestions(current, body, body.source === 'fallback' ? 'Deterministic fallback' : 'Validated model output'))
      setAiStatus(body.source === 'fallback' ? 'Deterministic fallback' : 'Model suggestions ready. Approve before they change requirements.')
    } catch {
      setAiStatus('Suggestions are unavailable. Try again.')
    } finally {
      setAiBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-black/8 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link href="/" className="mono text-xs uppercase tracking-[0.2em]">
            CarryOS
          </Link>
          <div className="flex gap-2">
            <Button type="button" data-testid="reset-demo" variant="ghost" onClick={() => setSession(resetDemo())}>
              Reset demo
            </Button>
            <Button asChild variant="paper">
              <Link href="/">Back to landing</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.15fr_0.85fr] sm:px-6">
        <ActivityPanel session={session} />
        <InventoryPanel session={session} />
        <SensorLab
          session={session}
          onChange={update}
        />
        <AlertPanel
          session={session}
          onOpen={(id) => setSelectedAlert(id)}
          onAck={(id) => setSession((current) => acknowledge(current, id))}
        />
        <CarryProfilePanel
          session={session}
          busy={aiBusy}
          status={aiStatus}
          onRequest={() => void requestProfile()}
          onDecide={(itemId, decision, bucket) =>
            setSession((current) => applySuggestionDecision(current, itemId, decision, bucket))
          }
        />
        <TracePanel session={session} />
      </main>
      <Dialog.Root open={Boolean(selectedAlert && alert)} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-[var(--paper-strong)] p-6 shadow-2xl focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2">
            <Dialog.Title className="text-2xl">Alert evidence</Dialog.Title>
            {alert ? (
              <div className="mt-4 space-y-3 text-sm">
                <p data-testid="alert-summary">{alert.evidence.summary}</p>
                <p>Activity: {alert.evidence.activityName}</p>
                <p>Item: {alert.evidence.itemName}</p>
                <p>State: {ITEM_STATE_LABELS[alert.evidence.inventoryState]}</p>
                <p>Evidence level: {Math.round(alert.evidence.confidence * 100)}% demonstration policy</p>
                <p>Latest scan: {formatClock(alert.evidence.latestScanAt)}</p>
                {alert.evidence.leaveBy ? <p>Leave by: {formatClock(alert.evidence.leaveBy)}</p> : <p>Timing unavailable.</p>}
                <p>Next: {alert.evidence.nextAction}</p>
              </div>
            ) : null}
            <Dialog.Close asChild>
              <Button className="mt-6" type="button" variant="paper">
                Close
              </Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {session.notifications[0] ? (
        <button
          type="button"
          className="fixed bottom-4 right-4 max-w-sm rounded-2xl bg-[var(--ink)] px-4 py-3 text-left text-sm text-[var(--paper)]"
          onClick={() => setSelectedAlert(session.notifications[0].alertId)}
        >
          {session.notifications[0].title}
        </button>
      ) : null}
    </div>
  )
}

function ActivityPanel({ session }: { session: DemoSession }) {
  return (
    <section className="rounded-3xl border border-black/8 bg-[var(--paper-strong)] p-5">
      <h1 className="text-3xl">{session.activity.name}</h1>
      <p className="mt-2 text-sm text-[var(--graphite)]">Demonstration clock {formatClock(session.now)} / not live time</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--graphite)]">Start</dt>
          <dd>{formatClock(session.activity.startTime)}</dd>
        </div>
        <div>
          <dt className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--graphite)]">Destination</dt>
          <dd>{session.activity.destination.name}</dd>
        </div>
        <div>
          <dt className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--graphite)]">Leave by</dt>
          <dd>{session.travel ? formatClock(session.travel.leaveBy) : 'Unavailable'}</dd>
        </div>
        <div>
          <dt className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--graphite)]">Readiness</dt>
          <dd aria-live="polite" data-testid="readiness">{session.readiness.label}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm">{session.readiness.detail}</p>
      <p className="mt-3 text-xs text-[var(--graphite)]">RFID input is simulated.</p>
    </section>
  )
}

function InventoryPanel({ session }: { session: DemoSession }) {
  return (
    <section className="rounded-3xl border border-black/8 bg-[var(--paper-strong)] p-5">
      <h2 className="text-2xl">Inventory memory</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {session.items.map((item) => {
          const state = session.inventory.find((candidate) => candidate.itemId === item.id)
          const required = session.activity.requiredItemIds.includes(item.id)
          return (
            <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--paper)] px-3 py-2">
              <span>
                {item.name}
                <span className="ml-2 text-xs text-[var(--graphite)]">{required ? 'Required' : 'Optional'}</span>
              </span>
              <span className="mono text-xs">{state ? ITEM_STATE_LABELS[state.status] : 'Unknown'}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function SensorLab({
  session,
  onChange,
}: {
  session: DemoSession
  onChange: (updater: (current: DemoSession) => DemoSession) => void
}) {
  return (
    <section className="rounded-3xl border border-black/8 bg-[var(--paper-strong)] p-5">
      <h2 className="text-2xl">Sensor lab</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" data-testid="close-scan" onClick={() => onChange(closeBagAndScan)} disabled={session.sensorStatus === 'disconnected'}>
          Close bag and scan
        </Button>
        <Button type="button" variant="paper" onClick={() => onChange(openBag)}>
          Open bag
        </Button>
        <Button
          type="button"
          variant="ghost"
          data-testid="add-notebook"
          onClick={() =>
            onChange((current) => setItemPresent(current.bagIsOpen ? current : openBag(current), 'notebook', true))
          }
        >
          Add notebook
        </Button>
        <Button type="button" variant="ghost" onClick={() => onChange((current) => setItemPresent(current, 'notebook', false))}>
          Remove notebook
        </Button>
        <Button type="button" variant="ghost" onClick={() => onChange((current) => setItemQuality(current, 'notebook', 'weak'))}>
          Weak notebook read
        </Button>
        <Button type="button" variant="ghost" onClick={() => onChange((current) => setItemLocationHint(current, 'notebook', 'outside'))}>
          Outside-bag test
        </Button>
        <Button type="button" variant="warning" data-testid="arm-fail" onClick={() => onChange(armFailedScan)}>
          Arm failed scan
        </Button>
        <Button type="button" variant="ghost" onClick={() => onChange(session.sensorStatus === 'connected' ? disconnectReader : reconnectReader)}>
          {session.sensorStatus === 'connected' ? 'Disconnect reader' : 'Reconnect reader'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (typeof Notification === 'undefined') {
              onChange((current) => ({ ...current, browserPermission: 'unsupported' }))
              return
            }
            void Notification.requestPermission().then((permission) => {
              onChange((current) => ({ ...current, browserPermission: permission }))
            })
          }}
        >
          Enable browser notifications
        </Button>
      </div>
    </section>
  )
}

function AlertPanel({
  session,
  onOpen,
  onAck,
}: {
  session: DemoSession
  onOpen: (id: string) => void
  onAck: (id: string) => void
}) {
  const unresolved = session.alerts.filter((alert) => ['active', 'acknowledged', 'suppressed'].includes(alert.status))
  return (
    <section className="rounded-3xl border border-black/8 bg-[var(--paper-strong)] p-5">
      <h2 className="text-2xl">Alerts</h2>
      {unresolved.length === 0 ? <p className="mt-3 text-sm text-[var(--graphite)]">No active alerts.</p> : null}
      <ul className="mt-3 space-y-2">
        {unresolved.map((alert) => (
          <li key={alert.id} className="rounded-2xl bg-[var(--paper)] p-3">
            <p className="font-medium">{alert.evidence.itemName}</p>
            <p className="text-sm text-[var(--graphite)]">{alert.type}</p>
            <div className="mt-2 flex gap-2">
              <Button type="button" size="sm" data-testid="explain-alert" onClick={() => onOpen(alert.id)}>
                Explain
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => onAck(alert.id)}>
                Acknowledge
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function CarryProfilePanel({
  session,
  busy,
  status,
  onRequest,
  onDecide,
}: {
  session: DemoSession
  busy: boolean
  status: string
  onRequest: () => void
  onDecide: (itemId: string, decision: 'approved' | 'rejected', bucket: 'required' | 'optional' | 'excluded') => void
}) {
  const suggestions = session.suggestions
  return (
    <section className="rounded-3xl border border-black/8 bg-[var(--paper-strong)] p-5 lg:col-span-2">
      <h2 className="text-2xl">AI carry profile</h2>
      <p className="mt-2 text-sm text-[var(--graphite)]">Suggestions do not change readiness until you approve a registered item.</p>
      <Button className="mt-4" type="button" data-testid="generate-profile" onClick={onRequest} disabled={busy}>
        {busy ? 'Generating...' : 'Generate profile'}
      </Button>
      <p className="mt-3 text-sm" aria-live="polite" data-testid="ai-status">{status}</p>
      {suggestions ? (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(['requiredItems', 'optionalItems', 'excludedItems'] as const).map((bucket) => (
            <div key={bucket}>
              <h3 className="text-sm font-medium capitalize">{bucket.replace('Items', '')}</h3>
              <ul className="mt-2 space-y-2">
                {suggestions[bucket].map((suggestion) => (
                  <li key={suggestion.itemId} className="rounded-2xl bg-[var(--paper)] p-3 text-sm">
                    <p>{session.items.find((item) => item.id === suggestion.itemId)?.name}</p>
                    <p className="text-xs text-[var(--graphite)]">Suggestion confidence {Math.round(suggestion.confidence * 100)}%</p>
                    <p className="mt-1">{suggestion.reason}</p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={Boolean(session.suggestionDecisions[suggestion.itemId])}
                        onClick={() =>
                          onDecide(
                            suggestion.itemId,
                            'approved',
                            bucket === 'requiredItems' ? 'required' : bucket === 'optionalItems' ? 'optional' : 'excluded',
                          )
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={Boolean(session.suggestionDecisions[suggestion.itemId])}
                        onClick={() => onDecide(suggestion.itemId, 'rejected', 'required')}
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--graphite)]">No model suggestions yet.</p>
      )}
    </section>
  )
}

function TracePanel({ session }: { session: DemoSession }) {
  const events = useMemo(() => session.trace.slice(0, 12), [session.trace])
  return (
    <section className="rounded-3xl border border-black/8 bg-[var(--ink)] p-5 text-[var(--paper)] lg:col-span-2">
      <h2 className="text-2xl">Developer trace</h2>
      {events.length === 0 ? <p className="mt-3 text-sm text-white/60">No trace events.</p> : null}
      <ol className="mt-4 space-y-2">
        {events.map((event) => (
          <li key={event.id} className="mono text-xs text-white/75">
            {event.name}: {event.detail}
          </li>
        ))}
      </ol>
    </section>
  )
}
