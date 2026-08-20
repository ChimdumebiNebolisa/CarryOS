import { ArrowRight, Check, LockKeyhole, Sparkles } from 'lucide-react'

export function AiBoundary() {
  return (
    <section id="technology" className="landing-section landing-ai-boundary">
      <div className="landing-ai-heading">
        <p className="landing-eyebrow">Context and AI boundary</p>
        <h2>Useful suggestions. A clear boundary.</h2>
        <p>Carry can ask a model for a starting checklist. It cannot mark an item present, invent travel time, or make the bag ready.</p>
      </div>
      <div className="landing-ai-sequence" aria-label="AI boundary sequence">
        <div className="landing-ai-step"><Sparkles size={18} aria-hidden="true" /><strong>The model suggests</strong><span>Registered items only</span></div>
        <ArrowRight className="landing-ai-arrow" size={20} aria-hidden="true" />
        <div className="landing-ai-step"><Check size={18} aria-hidden="true" /><strong>Carry checks</strong><span>Schema and profile rules</span></div>
        <ArrowRight className="landing-ai-arrow" size={20} aria-hidden="true" />
        <div className="landing-ai-step"><LockKeyhole size={18} aria-hidden="true" /><strong>You decide</strong><span>Approval is explicit</span></div>
      </div>
    </section>
  )
}
