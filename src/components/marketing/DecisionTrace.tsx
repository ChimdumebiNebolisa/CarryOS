'use client'

import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { useState } from 'react'
import type { LandingDecisionState, LandingScenario } from '@/application/landing-scenario'

function stateLabel(state: LandingDecisionState, itemId: string) {
  if (itemId === 'notebook') {
    return state.trackedItemState === 'confirmed-present' ? 'Confirmed' : 'Not detected'
  }

  return 'Confirmed'
}

export function DecisionTrace({ scenario }: { scenario: LandingScenario }) {
  const [activeId, setActiveId] = useState<LandingDecisionState['id']>('warning')
  const activeState = scenario.decisionStates.find((state) => state.id === activeId) ?? scenario.decisionStates[0]
  const [algorithms] = scenario.events

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
      <div className={`landing-decision-trace landing-decision-trace--${activeState.id}`}>
        <div className="landing-decision-toolbar">
          <p>Decision trace <span>Algorithms · {algorithms.time}</span></p>
          <div className="landing-decision-toggle" aria-label="Compare Carry decisions">
            {scenario.decisionStates.map((state) => (
              <button
                key={state.id}
                type="button"
                aria-pressed={activeId === state.id}
                onClick={() => setActiveId(state.id)}
              >
                <span aria-hidden="true">{state.id === 'warning' ? '01' : '02'}</span>
                {state.id === 'warning' ? 'Before fix' : 'After rescan'}
              </button>
            ))}
          </div>
        </div>

        <div className="landing-decision-plane">
          <section className="landing-decision-cell landing-decision-context" aria-labelledby="decision-context-title">
            <p className="landing-decision-label">01 · Context</p>
            <div>
              <time>{algorithms.time}</time>
              <h3 id="decision-context-title">{algorithms.name}</h3>
              <p>Next stop sets the need.</p>
            </div>
          </section>

          <section className="landing-decision-cell landing-decision-requirements" aria-labelledby="decision-requirements-title">
            <p className="landing-decision-label">02 · Requirements</p>
            <div>
              <h3 id="decision-requirements-title">Suggested for Algorithms <span>Approved</span></h3>
              <ul>
                {scenario.requiredItems.map((item) => <li key={item.id}>{item.name}</li>)}
              </ul>
            </div>
          </section>

          <section className="landing-decision-cell landing-decision-scan" aria-labelledby="decision-scan-title">
            <div className="landing-decision-scan-head">
              <p className="landing-decision-label">03 · Observation</p>
              <span>Closed bag · just now</span>
            </div>
            <h3 id="decision-scan-title">Simulated bag scan</h3>
            <ul>
              {scenario.requiredItems.map((item) => {
                const label = stateLabel(activeState, item.id)
                return (
                  <li key={item.id} className={label === 'Confirmed' ? 'is-confirmed' : 'is-missing'}>
                    <span>{item.name}</span>
                    <strong><i aria-hidden="true" />{label}</strong>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="landing-decision-cell landing-decision-result" aria-labelledby="decision-result-title" aria-live="polite">
            <p className="landing-decision-label">04 · Decision</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeState.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <p className="landing-decision-count"><strong>{activeState.confirmedCount}</strong><span>/{activeState.requiredCount}</span></p>
                <h3 id="decision-result-title">{activeState.label}</h3>
                <p>{activeState.detail}</p>
              </motion.div>
            </AnimatePresence>
          </section>
        </div>

        <ol className="landing-decision-recovery" aria-label="How the decision changes">
          <li><span>Warning</span><strong>Notebook not detected</strong></li>
          <li><span>Correction</span><strong>Add Notebook</strong></li>
          <li><span>New evidence</span><strong>Close bag and rescan</strong></li>
          <li><span>Updated decision</span><strong>Ready for Algorithms</strong></li>
        </ol>
      </div>
    </MotionConfig>
  )
}
