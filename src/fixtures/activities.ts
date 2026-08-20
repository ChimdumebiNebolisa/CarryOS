import type { Activity } from '@/domain/types'
import { DEMO_REQUIRED_ITEM_IDS } from '@/fixtures/demo-scenario'

const DAY = '2026-08-05'

export const ACTIVITIES: Activity[] = [
  {
    id: 'algorithms',
    name: 'Algorithms',
    type: 'class',
    startTime: `${DAY}T10:00:00-05:00`,
    destination: {
      name: 'Lecture Hall 28',
      description: 'CSCI 340: Algorithms',
    },
    travelMinutes: 18,
    departureBufferMinutes: 7,
    requiredItemIds: [...DEMO_REQUIRED_ITEM_IDS],
    optionalItemIds: ['headphones', 'student-id'],
    status: 'upcoming',
  },
  {
    id: 'exam-lab',
    name: 'Exam or laboratory session',
    type: 'exam-lab',
    startTime: `${DAY}T13:30:00-05:00`,
    destination: {
      name: 'Engineering Lab',
      description: 'Lab 3: West campus',
    },
    travelMinutes: 24,
    departureBufferMinutes: 10,
    requiredItemIds: ['notebook', 'calculator', 'student-id', 'keys'],
    optionalItemIds: ['laptop', 'water-bottle'],
    status: 'upcoming',
  },
  {
    id: 'internship-shift',
    name: 'Internship shift',
    type: 'internship',
    startTime: `${DAY}T17:30:00-05:00`,
    destination: {
      name: 'Innovation Hub',
      description: '4th floor: Downtown',
    },
    travelMinutes: 32,
    departureBufferMinutes: 12,
    requiredItemIds: ['laptop', 'charger', 'student-id', 'keys'],
    optionalItemIds: ['headphones', 'water-bottle'],
    status: 'upcoming',
  },
]

export const DEFAULT_ACTIVITY = ACTIVITIES[0]
