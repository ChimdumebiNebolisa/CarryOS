import { buildLandingScenario } from '@/application/landing-scenario'
import { DayChangesSection } from '@/components/marketing/DayChangesSection'
import { FinalCta } from '@/components/marketing/FinalCta'
import { Hero } from '@/components/marketing/Hero'
import { HowItWorksSection } from '@/components/marketing/HowItWorksSection'
import { LandingNav } from '@/components/marketing/LandingNav'
import { MissingBeforeLeaveSection } from '@/components/marketing/MissingBeforeLeaveSection'

export default function HomePage() {
  const scenario = buildLandingScenario()

  return (
    <main className="landing-page">
      <LandingNav />
      <Hero />
      <HowItWorksSection scenario={scenario} />
      <DayChangesSection scenario={scenario} />
      <MissingBeforeLeaveSection scenario={scenario} />
      <FinalCta />
    </main>
  )
}
