import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { DM_Mono, DM_Sans, Space_Grotesk } from 'next/font/google'
import './globals.css'

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
})

const body = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
})

const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'CarryOS — Know before you go.',
  description: 'CarryOS knows what you’ll need today, checks what’s in your bag, and tells you what’s missing before you leave.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--paper)] text-[var(--ink)]">{children}</body>
    </html>
  )
}
