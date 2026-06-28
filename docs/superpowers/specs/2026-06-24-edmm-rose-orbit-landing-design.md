# EDMM Rose Orbit Landing Redesign

Date: 2026-06-24
Status: Draft for user review

## Decision

Proceed with the approved direction: **Rose Orbit + Minimal Starfield**.

The page keeps the current pink rose falling-star space background as the main atmospheric layer and keeps `parallax.tsx` as the signature motion element. Everything else that made the page visually noisy or fragile is removed from the first screen.

## Product Goal

Create a clean, memorable first screen for EDMM that feels like a rose-tinted electronic music signal in space. The first viewport should communicate brand, mood, and motion without loading the full music product UI upfront.

The new landing page is not a dashboard, feed, or player screen. It is a focused brand entrance that can later lead into search, library, and playback features.

## Non-Negotiable Design Rule

**Pink Rose Identity**

- Primary brand color: `#ff98a2`.
- The falling-star background stays pink rose and remains visually recognizable from the current app.
- The rest of the palette stays restrained: near-black space, soft white text, muted rose-gray secondary text.
- No competing dominant hue families.
- No decorative gradient orb or bokeh backgrounds. Space depth should come from stars, subtle noise, contrast, and motion.

## Keep

- `src/features/landing/components/parallax.tsx`
  - Keep as the kinetic typography strip.
  - Use it sparingly: one lower hero band or one follow-up section, not repeated clutter.

- `src/features/landing/components/dustySnow.tsx`
  - Keep the pink rose falling-star visual concept.
  - Keep the file as the internal star layer and mount it through a new `RoseSpaceBackground` component.

## Remove From First Screen

- `src/features/landing/components/earth.tsx`
- `src/features/landing/components/earthLazy.tsx`
- `src/features/landing/hooks/useEarth.ts`
- `src/features/landing/components/intro.tsx`
- `src/shared/components/cursor.jsx`
- `src/features/landing/ui/landingWrapper.tsx` responsibilities that mount intro, cursor, earth, and old gradient effects.
- `src/views/home/index.tsx` from `/` first render.
- `src/widgets/audioPlayer/audioPlayerShell.tsx` from `/` first render.
- `src/widgets/navSidebar` from the landing-first layout.

These files do not all need to be deleted immediately if still used by routes/tests, but they must not participate in the redesigned landing page.

## First Viewport Design

The first viewport is a full-screen, unframed composition:

- Background: near-black space.
- Atmosphere: pink rose falling stars, gently varied in size, opacity, duration, and horizontal placement.
- Main brand lockup:
  - `EDMM` as the largest signal.
  - Supporting line: `Electronic Dance Music`.
  - Short, quiet copy: no marketing-heavy paragraphs.
- Primary action:
  - One clear command: `Explore`.
  - Link target: `/search`.
  - Button style: filled rose on dark space.
- Secondary signal:
  - A small metadata row with this text: `Rose signal / Dance floor / Night stream`.
  - This should feel like UI instrumentation, not a card.

The layout follows option A's strong brand placement and option C's restraint.

## Page Flow

1. Hero
   - Brand lockup, one action, rose falling stars.
   - No nested cards.
   - No sidebar.
   - No player.

2. Parallax Strip
   - Use the existing two-line pattern: `Electronic` and `Dance Music`.
   - The strip should sit below the main hero content, not compete with the H1.

3. Minimal Follow-Up Section
   - One short section that gives the visitor somewhere to go next.
   - Links: `Search` (`/search`) and `Library` (`/library`).
   - Keep density low until the actual app screens are redesigned.

## Background Component Design

Create a dedicated landing background component, conceptually:

```tsx
<RoseSpaceBackground />
```

Responsibilities:

- Render the near-black space surface.
- Render the pink rose falling stars.
- Respect `prefers-reduced-motion`.
- Stay `aria-hidden`.
- Use `pointer-events-none`.
- Keep z-index behind page content.
- Avoid hydration mismatch by keeping star placement client-only.

Implementation notes:

- The current `DustySnow` uses client-only rendering and random values after mount. Keep that client-only behavior for this pass.
- The existing star color and glow should stay close to `#ff98a2`.
- The large white `shadow-[0_0_10px_white]` on the container should be removed; glow should belong to stars, not the full viewport.
- Star motion should feel natural: slower, softer, varied, and not like heavy snow.

## Typography

Use a restrained type system:

- Display: bold geometric sans, tight but readable, no negative letter spacing.
- Body: system sans or existing font until a font decision is made.
- Hero-scale type only in the hero.
- Smaller, denser labels for metadata.

Do not add oversized headings inside compact UI areas.

## Layout Rules

- Mobile-first.
- No horizontal scroll.
- Use `min-h-dvh` for the hero.
- Keep hero content inside a stable responsive content width.
- Hero must hint at the next section on common desktop and mobile sizes.
- Avoid cards inside cards.
- Avoid floating page-section cards.
- Use 8px or smaller radius for cards/buttons unless the existing system requires otherwise.

## Motion Rules

- Main ambient motion: falling rose stars.
- Secondary motion: `Parallax`.
- UI motion must be subtle and transform/opacity based.
- Respect `prefers-reduced-motion`:
  - Disable or heavily reduce falling-star animation.
  - Keep static stars visible so the identity is not lost.
  - Reduce parallax motion.

## Accessibility

- The background must be `aria-hidden`.
- Text contrast must meet WCAG AA.
- Interactive controls need visible focus states.
- CTA target size should be at least 44px high.
- Do not rely on color alone for navigation state.

## Codebase Impact

Expected implementation files:

- Modify: `src/app/layout.tsx`
  - Remove global `NavSidebar` from the landing-first shell.
  - Keep providers only if needed globally.

- Modify: `src/app/page.tsx`
  - Render the redesigned landing directly.
  - Remove `AudioPlayerShell` and `HomeView` from `/`.

- Modify: `src/widgets/landing/index.tsx`
  - Compose the new landing sections.

- Modify/Create: `src/features/landing/components/roseSpaceBackground.tsx`
  - Preserve and refine the `DustySnow` concept.

- Modify: `src/features/landing/components/dustySnow.tsx`
  - Keep as an internal star layer used by `RoseSpaceBackground`.
  - Remove the full-viewport white container shadow.
  - Tune star size, opacity, glow, and fall speed for a natural rose-star effect.

- Modify: `src/features/landing/ui/landingHero.tsx`
  - Replace Earth-based composition with Rose Orbit hero.

- Modify: `src/features/landing/ui/landingBodySection.tsx`
  - Keep parallax, simplify surrounding structure.

- Modify: `src/shared/styles/global.css`
  - Add rose identity tokens.
  - Remove old `.my-gradient` use from the landing.
  - Keep/adjust `.snow` animation and parallax CSS.

Expected test updates:

- Update `/` page tests so the landing renders brand content and no longer depends on trending tracks.
- Add a test that the background is `aria-hidden`.
- Add a test that reduced motion can suppress animated star output or mark the layer as reduced.
- Remove or quarantine tests for `Intro` and `EarthLazy` if those components are no longer used.

## Acceptance Criteria

- `/` renders a clean EDMM landing page with no sidebar, no intro overlay, no earth canvas, no custom cursor, no home track list, and no audio player shell.
- Pink rose falling-star background is visible and natural.
- `parallax.tsx` remains part of the landing.
- Layout is stable at mobile and desktop widths.
- No hydration warning caused by the background.
- `npm run build` passes.
- Relevant Jest tests pass or are updated to the new landing behavior.

## Open Implementation Notes

- Do not delete search, library, track detail, APIs, or audio engine code as part of the landing redesign unless a later implementation task explicitly scopes that cleanup.
- Keep the redesign narrowly focused on fixing the broken landing experience first.
- The old full app functionality can be reintroduced later through deliberate navigation, not forced into the first viewport.
