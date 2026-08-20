import Link from 'next/link'
import { getPublicEnv } from '@/lib/env'

export function LandingNav() {
  const { repositoryUrl } = getPublicEnv()

  return (
    <header className="landing-nav" aria-label="Main navigation">
      <div className="landing-container landing-nav-inner">
        <Link href="/" className="landing-wordmark" aria-label="CarryOS home">
          CarryOS
        </Link>
        <nav className="landing-nav-links" aria-label="Primary navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#inside-the-bag">Inside the bag</a>
        </nav>
        <a className="landing-github-button" href={repositoryUrl} rel="noreferrer" target="_blank">
          View on GitHub
        </a>
      </div>
    </header>
  )
}
