# CarryOS frontend architecture (current)

The pre-refactor audit is superseded by the CarryOS v2 landing implementation.

## Landing system

- `src/app/page.tsx` builds `LandingScenario` once and passes its presentation slices to the marketing sections.
- `src/application/landing-scenario.ts` adapts the deterministic demo proof for consumer-facing copy. It does not introduce marketing concerns into domain code.
- `landing-container` is the only outer landing container. `landing-grid` is the shared 12-column desktop primitive; simple mobile content returns to normal flow.
- The page sections are Hero, How Carry works, Day changes, Typographic inventory, and the closing product moment.
- Normal content sections use grid and document flow. The hero and cinematic closing are bounded art-direction exceptions: they may use image masking, blending, cropping, and localized positioning, but those techniques are not copied into content sections.

## Shared foundation

`src/app/globals.css` owns shared semantic tokens for surfaces, text, borders, action, success, caution, critical status, and focus. Marketing composition remains in the landing selectors; the `/demo` workspace continues to use Tailwind utilities over the shared token layer.

## Safeguards

- `tests/e2e/landing.visual.spec.ts` protects the complete landing at 1440px and 390px with deterministic reduced-motion screenshot assertions.
- `tests/e2e/landing-safeguards.spec.ts` protects button computed styles, sticky navigation, anchor clearance, keyboard focus, and reduced motion.
- `tests/e2e/browser-smoke.spec.ts` provides a lightweight rendering/overflow smoke test in Chromium, Firefox, and WebKit without tripling the full E2E suite.

## Legacy fixture

The public site is now `/` plus `/how-it-works`. Historical landing-section notes below describe the retired multi-section page.
