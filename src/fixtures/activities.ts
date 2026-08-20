import type { Activity } from '@/domain/types'

const DAY = '2026-08-05'

export const ACTIVITIES: Activity[] = [
  {
    id: 'calculus-ii',
    name: 'Calculus II',
    type: 'class',
    startTime: `${DAY}T09:00:00-05:00`,
    destination: {
      name: 'Science Building',
      description: 'Room 214 · North campus',
    },
    travelMinutes: 18,
    departureBufferMinutes: 7,
    requiredItemIds: ['laptop', 'notebook', 'calculator', 'student-id'],
    optionalItemIds: ['headphones', 'water-bottle'],
    status: 'upcoming',
  },
  {
    id: 'exam-lab',
    name: 'Exam or laboratory session',
    type: 'exam-lab',
    startTime: `${DAY}T13:30:00-05:00`,
    destination: {
      name: 'Engineering Lab',
      description: 'Lab 3 · West campus',
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
      description: '4th floor · Downtown',
    },
    travelMinutes: 32,
    departureBufferMinutes: 12,
    requiredItemIds: ['laptop', 'charger', 'student-id', 'keys'],
    optionalItemIds: ['headphones', 'water-bottle'],
    status: 'upcoming',
  },
]

export const DEFAULT_ACTIVITY = ACTIVITIES[0]
