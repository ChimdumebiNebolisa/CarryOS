import Link from 'next/link'

export function LandingNav() {
  return (
    <header className="landing-nav" aria-label="Main navigation">
      <div className="landing-container landing-nav-inner">
        <Link href="/" className="landing-wordmark" aria-label="CarryOS home">
          CarryOS
        </Link>
        <nav className="landing-nav-links" aria-label="Primary navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#your-day">Your day</a>
        </nav>
        <Link className="landing-nav-cta" href="/demo">Open demo</Link>
      </div>
    </header>
  )
}
