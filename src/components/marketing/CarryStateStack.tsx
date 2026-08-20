'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { buildLandingProof } from '@/application/landing-proof'

/**
 * Legacy test fixture for the pre-v2 hero state contract. It is intentionally
 * not part of the landing system and must not be reused for new marketing UI.
 */
export function CarryStateStack() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const proof = buildLandingProof()

  useEffect(() => {
    const node = rootRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setActive(entry?.isIntersecting ?? false), { threshold: 0.2 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={rootRef} className={`carry-product-stage ${active ? 'is-visible' : ''}`}>
      <Image src="/carryos-backpack.png" alt="" className="carry-product-stage-image" width={1465} height={1024} aria-hidden="true" />
      <div className="carry-product-stage-overlay" aria-hidden="true">
        <span>Inventory belief</span>
        <strong>{proof.missingCount} item missing</strong>
      </div>
      <p className="sr-only">{proof.missingItem?.itemName ?? 'All required items'} is the current evidence result for {proof.activity.name}.</p>
    </div>
  )
}
