export function LimitationsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--graphite)]">08 / Honest limitations</p>
      <h2 className="mt-3 text-5xl leading-[0.92] sm:text-6xl">What this prototype does not claim.</h2>
      <ul className="mt-6 max-w-2xl space-y-3 text-[var(--ink-soft)]">
        <li>Physical RFID, NFC, and inside-versus-outside classification are not validated.</li>
        <li>Travel time is simulated. There is no live Maps adapter.</li>
        <li>There are no accounts, no database, and no persistence across refresh.</li>
        <li>Browser notifications are optional and browser-dependent. In-app notification is the guaranteed path.</li>
      </ul>
    </section>
  )
}
