import Link from 'next/link'

export function FinalCta() {
  return (
    <section className="bg-[var(--ink)] px-4 py-16 text-[var(--paper)] sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-4xl">Run the decision loop.</h2>
          <p className="mt-2 text-white/70">No login. No model key required.</p>
        </div>
        <Link className="inline-flex h-12 items-center rounded-full bg-[var(--confirm)] px-6 text-sm font-medium" href="/demo">
          Open the full demo
        </Link>
      </div>
    </section>
  )
}
