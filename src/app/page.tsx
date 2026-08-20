import { AiBoundary } from '@/components/marketing/AiBoundary'
import { ArchitectureSection } from '@/components/marketing/ArchitectureSection'
import { BeliefSection } from '@/components/marketing/BeliefSection'
import { FinalCta } from '@/components/marketing/FinalCta'
import { Hero } from '@/components/marketing/Hero'
import { LimitationsSection } from '@/components/marketing/LimitationsSection'
import { WorkingProof } from '@/components/marketing/WorkingProof'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <WorkingProof />
      <BeliefSection />
      <AiBoundary />
      <ArchitectureSection />
      <LimitationsSection />
      <FinalCta />
    </main>
  )
}
