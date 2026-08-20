'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { buildHeroSnapshots, HERO_STATE_ORDER, type HeroStateId } from '@/application/hero-states'
import { formatClock } from '@/lib/utils'

function cardTone(id: HeroStateId) {
  if (id === 'ready') return 'border-[var(--confirm)]/50 bg-[var(--hero-ready-bg)] text-[var(--paper)]'
  if (id === 'missing') return 'border-[var(--caution)]/60 bg-[var(--hero-missing-bg)] text-[var(--paper)]'
  if (id === 'scanning') return 'border-white/15 bg-[var(--hero-scanning-bg)] text-[var(--paper)]'
  return 'border-white/10 bg-[var(--hero-unknown-bg)] text-[var(--paper)]'
}

export function CarryStateStack() {
  const snapshots = useMemo(() => buildHeroSnapshots(), [])
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [autoplayDone, setAutoplayDone] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const visibleRef = useRef(true)
  const currentIndex = reduceMotion ? 2 : index

  useEffect(() => {
    const node = rootRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      visibleRef.current = entries[0]?.isIntersecting ?? true
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (reduceMotion || autoplayDone) return
    const id = window.setInterval(() => {
      if (document.hidden || !visibleRef.current) return
      setIndex((current) => {
        if (current >= HERO_STATE_ORDER.length - 1) {
          setAutoplayDone(true)
          return current
        }
        return current + 1
      })
    }, 1600)
    return () => window.clearInterval(id)
  }, [autoplayDone, reduceMotion])

  const currentId = HERO_STATE_ORDER[currentIndex]
  const current = snapshots[currentId]
  const previous = snapshots[HERO_STATE_ORDER[Math.max(0, currentIndex - 1)]]
  const older = snapshots[HERO_STATE_ORDER[Math.max(0, currentIndex - 2)]]

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-3xl">
      <p className="sr-only" aria-live="polite">
        {current.title}. {current.detail}
      </p>
      <div className="relative mx-auto h-[28rem] max-w-xl sm:h-[32rem]">
        <div className="absolute inset-x-8 top-6 hidden h-full rounded-[2rem] border border-white/10 bg-black/20 md:block" style={{ transform: 'translateY(36px) scale(0.92)' }} aria-hidden>
          <StateCard snapshot={older} className="opacity-40" />
        </div>
        <div className="absolute inset-x-4 top-3 hidden h-full rounded-[2rem] border border-white/10 bg-black/20 sm:block" style={{ transform: 'translateY(18px) scale(0.96)' }} aria-hidden>
          <StateCard snapshot={previous} className="opacity-60" />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -16 }}
            transition={{ duration: 0.55 }}
          >
            <StateCard snapshot={current} featured />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {HERO_STATE_ORDER.map((id, idIndex) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setIndex(idIndex)
              setAutoplayDone(true)
            }}
            className={`rounded-full px-3 py-2 text-xs ${id === currentId ? 'bg-[var(--paper)] text-[var(--ink)]' : 'bg-white/8 text-[var(--paper)]'}`}
            aria-pressed={id === currentId}
          >
            {snapshots[id].title}
          </button>
        ))}
      </div>
    </div>
  )
}

function StateCard({
  snapshot,
  featured = false,
  className = '',
}: {
  snapshot: ReturnType<typeof buildHeroSnapshots>[HeroStateId]
  featured?: boolean
  className?: string
}) {
  return (
    <article className={`flex h-full flex-col justify-between rounded-[2rem] border p-6 shadow-[var(--shadow)] sm:p-8 ${cardTone(snapshot.id)} ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="mono text-[11px] uppercase tracking-[0.18em] text-white/60">{snapshot.kicker}</p>
        <p className="mono text-[11px] text-white/50">Demo 8:21 AM</p>
      </div>
      <div>
        <h3 className="max-w-md text-3xl leading-none text-[var(--paper)] sm:text-4xl">{snapshot.title}</h3>
        <p className="mt-4 max-w-md text-sm leading-6 text-white/75">{snapshot.detail}</p>
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="mono text-[11px] uppercase tracking-[0.16em] text-white/45">Required</dt>
          <dd>{snapshot.confirmed} of {snapshot.required} confirmed</dd>
        </div>
        <div>
          <dt className="mono text-[11px] uppercase tracking-[0.16em] text-white/45">Evidence</dt>
          <dd>{snapshot.itemLine}</dd>
        </div>
        {featured && snapshot.leaveBy ? (
          <div className="col-span-2">
            <dt className="mono text-[11px] uppercase tracking-[0.16em] text-white/45">Leave by</dt>
            <dd>{formatClock(snapshot.leaveBy)}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  )
}
