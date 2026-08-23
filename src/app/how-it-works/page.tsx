import type { Metadata } from 'next'
import { ArchitecturePage } from '@/components/site/ArchitecturePage'

export const metadata: Metadata = {
  title: 'How it works | CarryOS',
  description: 'Architecture of how CarryOS turns event context, approved requirements, and bag evidence into a leave-by warning.',
}

export default function HowItWorksRoute() {
  return <ArchitecturePage />
}
