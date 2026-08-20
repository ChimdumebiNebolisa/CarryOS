import { AiBoundary } from '@/components/marketing/AiBoundary'
import { ArchitectureSection } from '@/components/marketing/ArchitectureSection'
import { ContextRequirements } from '@/components/marketing/ContextRequirements'
import { EvidenceSection } from '@/components/marketing/EvidenceSection'
import { FinalCta } from '@/components/marketing/FinalCta'
import { Footer } from '@/components/marketing/Footer'
import { FutureScenarios } from '@/components/marketing/FutureScenarios'
import { Hero } from '@/components/marketing/Hero'
import { LimitationsSection } from '@/components/marketing/LimitationsSection'
import { ReconciliationSection } from '@/components/marketing/ReconciliationSection'
import { SensingSection } from '@/components/marketing/SensingSection'
import { WorkingProof } from '@/components/marketing/WorkingProof'

export default function HomePage() {
  return (
    <main className="landing-page">
      <Hero />
      <ContextRequirements />
      <WorkingProof />
      <SensingSection />
      <ReconciliationSection />
      <EvidenceSection />
      <AiBoundary />
      <FutureScenarios />
      <ArchitectureSection />
      <LimitationsSection />
      <FinalCta />
      <Footer />
    </main>
  )
}
