import type { Item } from '@/domain/types'

export const ITEMS: Item[] = [
  {
    id: 'laptop',
    name: 'Laptop sleeve',
    category: 'Tech',
    tagId: 'TAG-LAPTOP-001',
    tagPlacement: 'Inside sleeve seam',
  },
  {
    id: 'charger',
    name: 'Charger strap',
    category: 'Tech',
    tagId: 'TAG-CHARGER-001',
    tagPlacement: 'Cable organizer loop',
  },
  {
    id: 'notebook',
    name: 'Notebook',
    category: 'Study',
    tagId: 'TAG-NOTEBOOK-001',
    tagPlacement: 'Inside back cover',
  },
  {
    id: 'calculator',
    name: 'Calculator',
    category: 'Study',
    tagId: 'TAG-CALC-001',
    tagPlacement: 'Plastic rear casing',
  },
  {
    id: 'student-id',
    name: 'Student ID holder',
    category: 'Essentials',
    tagId: 'TAG-ID-001',
    tagPlacement: 'Card sleeve edge',
  },
  {
    id: 'headphones',
    name: 'Headphone case',
    category: 'Personal',
    tagId: 'TAG-HEADPHONES-001',
    tagPlacement: 'Case inner lid',
  },
  {
    id: 'keys',
    name: 'Keys',
    category: 'Essentials',
    tagId: 'TAG-KEYS-001',
    tagPlacement: 'Plastic key fob',
  },
  {
    id: 'water-bottle',
    name: 'Water bottle',
    category: 'Personal',
    tagId: 'TAG-WATER-001',
    tagPlacement: 'Fabric bottle sleeve',
  },
]
