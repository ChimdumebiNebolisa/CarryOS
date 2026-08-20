import Link from 'next/link'

export function Footer() {
  return (
    <footer className="landing-footer">
      <div><strong>CarryOS</strong><span>Know before you go.</span></div>
      <nav aria-label="Footer navigation"><Link href="#limitations">Limitations</Link><Link href="#technology">Technology</Link><Link href="/demo">Demo</Link></nav>
    </footer>
  )
}
