import { describe, expect, it } from 'vitest'
import { buildLandingScenario } from '@/application/landing-scenario'

describe('landing scenario', () => {
  it('adapts one deterministic proof into the complete public story', () => {
    const scenario = buildLandingScenario()

    expect(scenario.events.map((event) => [event.time, event.name])).toEqual([
      ['10:00 AM', 'Algorithms'],
      ['5:00 PM', 'Rain expected'],
      ['Later', 'Gym after class'],
    ])
    expect(scenario.packedItems.map((item) => item.id)).toEqual(['laptop', 'charger', 'umbrella'])
    expect(scenario.primaryMissingItem).toMatchObject({ id: 'notebook', state: 'missing', slot: 'notebook' })
    expect(scenario.primaryReason).toBe('You’ll need it for Algorithms at 10:00 AM.')
  })
})
