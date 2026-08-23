import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getPublicEnv } from '@/lib/env'

export function HomeHero() {
  const { repositoryUrl } = getPublicEnv()

  return (
    <main className="home-poster">
      <div className="home-copy">
        <header className="home-brand">
          <span className="home-mark" aria-hidden="true" />
          <p className="home-wordmark">CarryOS</p>
          <p className="home-eyebrow mono">Context-aware carry system</p>
        </header>

        <div className="home-statement">
          <h1>
            Know before
            <br />
            you go.
          </h1>
          <p className="home-lede">
            CarryOS determines what you need for the day, checks what is already with you, and warns you before
            you leave something important behind.
          </p>

          <nav className="home-actions" aria-label="Primary">
            <Link className="home-action home-action-strong" href="/how-it-works">
              How it works
              <ArrowUpRight size={17} strokeWidth={2} aria-hidden="true" />
            </Link>
            <a
              className="home-action home-action-quiet"
              href={repositoryUrl}
              rel="noreferrer"
              target="_blank"
            >
              Source code
              <ArrowUpRight size={17} strokeWidth={2} aria-hidden="true" />
            </a>
          </nav>
        </div>

        <footer className="home-strip">
          <p className="mono home-credit">Photo: Bayram Yalçın / Pexels</p>
        </footer>
      </div>

      <figure className="home-field">
        <Image
          src="/images/hero-commute.jpg"
          alt="Man with a backpack waiting at a busy city street crossing"
          fill
          priority
          sizes="(max-width: 1023px) 100vw, 56vw"
          className="home-image"
        />
      </figure>
    </main>
  )
}
