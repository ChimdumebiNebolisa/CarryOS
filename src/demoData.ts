import type { Activity, Item } from './domain'

const DAY = '2026-08-05'

export const ITEMS: Item[] = [
  {
    id: 'laptop',
    name: 'Laptop sleeve',
    category: 'Tech',
    tagId: 'TAG-LAPTOP-001',
    icon: '▣',
    tagPlacement: 'Inside sleeve seam',
    notes: 'Keep the tag on the sleeve rather than directly on the laptop chassis.',
  },
  {
    id: 'charger-strap',
    name: 'Charger strap',
    category: 'Tech',
    tagId: 'TAG-CHARGER-001',
    icon: '⌁',
    tagPlacement: 'Cable organizer loop',
    notes: 'A tagged loop keeps the reader away from dense cable coils.',
  },
  {
    id: 'notebook',
    name: 'Notebook',
    category: 'Study',
    tagId: 'TAG-NOTEBOOK-001',
    icon: '▤',
    tagPlacement: 'Back cover pocket',
    notes: 'Place the tag inside the back cover so it stays protected.',
  },
  {
    id: 'calculator',
    name: 'Calculator',
    category: 'Study',
    tagId: 'TAG-CALC-001',
    icon: '⌗',
    tagPlacement: 'Plastic rear casing',
    notes: 'The demo missing item. Add it before the second scan.',
  },
  {
    id: 'student-id',
    name: 'Student ID holder',
    category: 'Essentials',
    tagId: 'TAG-ID-001',
    icon: '▭',
    tagPlacement: 'Card sleeve edge',
    notes: 'Keep the tag clear of metal clips and wallet stacks.',
  },
  {
    id: 'headphones',
    name: 'Headphone case',
    category: 'Personal',
    tagId: 'TAG-HEADPHONES-001',
    icon: '◉',
    tagPlacement: 'Case inner lid',
    notes: 'Optional for class and internship days.',
  },
  {
    id: 'keys',
    name: 'Keys',
    category: 'Essentials',
    tagId: 'TAG-KEYS-001',
    icon: '⌕',
    tagPlacement: 'Key fob surface',
    notes: 'Metal can influence read quality; test placement on the fob.',
  },
  {
    id: 'water-bottle',
    name: 'Water bottle',
    category: 'Personal',
    tagId: 'TAG-WATER-001',
    icon: '◒',
    tagPlacement: 'Bottle sleeve',
    notes: 'Keep tags on the fabric sleeve instead of directly on metal.',
  },
]

export const ACTIVITIES: Activity[] = [
  {
    id: 'calculus-ii',
    name: 'Calculus II',
    type: 'class',
    startTime: `${DAY}T09:00:00-05:00`,
    destination: { name: 'Science Building', address: 'Room 214 · North campus' },
    travelMinutes: 18,
    departureBufferMinutes: 7,
    requiredItemIds: ['laptop', 'notebook', 'calculator', 'student-id'],
    optionalItemIds: ['headphones', 'water-bottle'],
    status: 'upcoming',
  },
  {
    id: 'physics-lab',
    name: 'Physics lab check-in',
    type: 'exam',
    startTime: `${DAY}T13:30:00-05:00`,
    destination: { name: 'Engineering Lab', address: 'Lab 3 · West campus' },
    travelMinutes: 24,
    departureBufferMinutes: 10,
    requiredItemIds: ['laptop', 'notebook', 'calculator', 'student-id', 'keys'],
    optionalItemIds: ['charger-strap', 'water-bottle'],
    status: 'upcoming',
  },
  {
    id: 'internship-shift',
    name: 'Internship shift',
    type: 'internship',
    startTime: `${DAY}T17:30:00-05:00`,
    destination: { name: 'Innovation Hub', address: '4th floor · Downtown' },
    travelMinutes: 32,
    departureBufferMinutes: 12,
    requiredItemIds: ['laptop', 'charger-strap', 'student-id', 'keys'],
    optionalItemIds: ['headphones', 'water-bottle'],
    status: 'upcoming',
  },
]

export const DEFAULT_PRESENT_TAG_IDS = new Set([
  'TAG-LAPTOP-001',
  'TAG-NOTEBOOK-001',
  'TAG-ID-001',
])

export const DEFAULT_SIGNAL_STRENGTHS: Record<string, number> = Object.fromEntries(
  ITEMS.map((item) => [item.tagId, -48]),
)

export const ACTIVITY_TYPE_LABELS: Record<Activity['type'], string> = {
  class: 'Class',
  exam: 'Exam / lab',
  internship: 'Internship',
}
