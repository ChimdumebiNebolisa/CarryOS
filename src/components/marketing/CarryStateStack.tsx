'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { buildHeroSnapshots, HERO_STATE_ORDER, type HeroStateId } from '@/application/hero-states'
import { formatClock } from '@/lib/utils'

function stateTone(id: HeroStateId) {
  if (id === 'ready') return 'carry-state-ready'
  if (id === 'missing') return 'carry-state-missing'
  if (id === 'scanning') return 'carry-state-scanning'
  return 'carry-state-awaiting'
}

const noopSubscribe = () => () => {}

export function CarryStateStack() {
  const snapshots = useMemo(() => buildHeroSnapshots(), [])
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [autoplayDone, setAutoplayDone] = useState(false)
  const hasMounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const rootRef = useRef<HTMLDivElement>(null)
  const visibleRef = useRef(true)
  const currentIndex = hasMounted && reduceMotion ? 2 : index
  const currentId = HERO_STATE_ORDER[currentIndex]
  const current = snapshots[currentId]

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

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-2xl">
      <p className="sr-only" aria-live="polite">
        {current.title}. {current.detail}
      </p>
      <div className="carry-backpack-scene" aria-hidden="true">
        <div className="carry-orbit carry-orbit-one" />
        <div className="carry-orbit carry-orbit-two" />
        <div className="carry-signal carry-signal-context">
          <span className="mono">Context</span>
          <strong>{current.activityName}</strong>
          <small>{current.destination}</small>
        </div>
        <div className={`carry-signal carry-signal-status ${stateTone(currentId)}`}>
          <span className="mono">Carry state</span>
          <strong>{current.title}</strong>
          <small>{current.confirmed} of {current.required} confirmed</small>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            className="carry-product-frame"
            initial={hasMounted && reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            <div className="carry-backpack" />
          </motion.div>
        </AnimatePresence>
        <div className="carry-signal carry-signal-evidence">
          <span className="mono">Next action</span>
          <strong>{current.itemLine}</strong>
          <small>{current.leaveBy ? `Leave by ${formatClock(current.leaveBy)}` : 'Awaiting closed-bag evidence'}</small>
        </div>
        <div className="carry-product-label">
          <span className="mono">CarryOS / software model</span>
          <span>Evidence before confidence</span>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {HERO_STATE_ORDER.map((id, idIndex) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setIndex(idIndex)
              setAutoplayDone(true)
            }}
            className={`min-h-11 rounded-full px-3 py-2 text-xs ${id === currentId ? 'bg-[var(--paper)] text-[var(--ink)]' : 'bg-white/8 text-[var(--paper)]'}`}
            aria-pressed={id === currentId}
          >
            {snapshots[id].title}
          </button>
        ))}
      </div>
    </div>
  )
}
