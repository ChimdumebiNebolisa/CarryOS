import { describe, expect, it } from 'vitest'
import { buildLandingProof } from '@/application/landing-proof'

describe('landing proof', () => {
  it('derives reconciliation from the deterministic closed-bag scan', () => {
    const proof = buildLandingProof()

    expect(proof.activity.name).toBe('Algorithms')
    expect(proof.rows.filter((row) => row.relationship === 'matched')).toHaveLength(3)
    expect(proof.rows.find((row) => row.itemId === 'notebook')?.relationship).toBe('missing')
    expect(proof.alert?.evidence.itemName).toBe('Notebook')
  })
})
