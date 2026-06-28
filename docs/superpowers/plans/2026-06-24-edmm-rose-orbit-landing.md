# EDMM Rose Orbit Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/` as a clean Rose Orbit landing page that preserves the pink rose falling-star background and `parallax.tsx`, while removing the broken/cluttered landing stack from the first screen.

**Architecture:** Introduce a dedicated client-only `RoseSpaceBackground` that owns the near-black space surface and existing `DustySnow` star layer. Simplify the landing widget into `RoseSpaceBackground + Hero + Parallax section + minimal navigation links`, then simplify the app shell so the landing is not wrapped in sidebar/audio/trending UI. Keep search, library, track detail, APIs, and audio engine files intact.

**Tech Stack:** Next.js App Router, React 19, TypeScript 6, Tailwind v4 CSS utilities, Framer Motion, Jest/React Testing Library.

---

## Source Spec

- Design spec: `docs/superpowers/specs/2026-06-24-edmm-rose-orbit-landing-design.md`
- Visual screening mockup: `docs/mockups/edmm-visual-screening.html`

## File Structure

- Modify: `src/features/landing/components/dustySnow.tsx`
  - Keeps the current falling-star concept, but removes the white full-viewport glow and exposes reduced-motion behavior.
- Create: `src/features/landing/components/roseSpaceBackground.tsx`
  - Owns the landing background layer, marks it `aria-hidden`, and detects `prefers-reduced-motion`.
- Modify: `src/shared/styles/global.css`
  - Adds rose identity tokens, revised star/parallax styles, and reduced-motion CSS.
- Modify: `src/features/landing/ui/landingHero.tsx`
  - Replaces Earth/motion hero with Rose Orbit hero copy and `/search` CTA.
- Modify: `src/features/landing/ui/landingBodySection.tsx`
  - Keeps the existing `Parallax` two-line pattern and adds minimal follow-up links.
- Modify: `src/widgets/landing/index.tsx`
  - Removes Lenis/wrapper stack and composes the new sections.
- Modify: `src/app/page.tsx`
  - Removes `AudioPlayerShell` and `HomeView`; renders landing only.
- Modify: `src/app/layout.tsx`
  - Removes global `NavSidebar` wrapper from the app shell.
- Create/Modify tests:
  - `src/test/features/landing/roseSpaceBackground.test.tsx`
  - `src/test/widgets/landing.test.tsx`
  - `src/test/app/page.test.tsx`

## Existing Context

- Current `/` is `src/app/page.tsx`, which renders `Landing`, `HomeView`, and `AudioPlayerShell`.
- Current global shell is `src/app/layout.tsx`, which renders `NavSidebar` on every page.
- Current landing wrapper mounts `Cursor`, `Intro`, `DustySnow`, old `.my-gradient`, `Hero`, and `BodySection`.
- `Parallax` already exists and must remain at `src/features/landing/components/parallax.tsx`.

---

### Task 1: Rose Space Background

**Files:**
- Modify: `src/features/landing/components/dustySnow.tsx`
- Create: `src/features/landing/components/roseSpaceBackground.tsx`
- Modify: `src/shared/styles/global.css`
- Test: `src/test/features/landing/roseSpaceBackground.test.tsx`

- [ ] **Step 1: Write the failing background test**

Create `src/test/features/landing/roseSpaceBackground.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import RoseSpaceBackground from "@/features/landing/components/roseSpaceBackground";

describe("RoseSpaceBackground", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders an aria-hidden rose space background", async () => {
    render(<RoseSpaceBackground />);

    const background = screen.getByTestId("rose-space-background");
    expect(background).toHaveAttribute("aria-hidden", "true");
    expect(background).toHaveClass("rose-space-background");

    await waitFor(() => {
      expect(screen.getByTestId("rose-starfield")).toBeInTheDocument();
    });
  });

  it("marks the background as reduced when prefers-reduced-motion is active", async () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(<RoseSpaceBackground />);

    expect(screen.getByTestId("rose-space-background")).toHaveAttribute(
      "data-reduced-motion",
      "true"
    );

    await waitFor(() => {
      expect(screen.getByTestId("rose-starfield")).toHaveClass(
        "rose-starfield--reduced"
      );
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- roseSpaceBackground.test.tsx
```

Expected: FAIL because `roseSpaceBackground.tsx` does not exist.

- [ ] **Step 3: Implement `DustySnow` as the internal rose star layer**

Replace `src/features/landing/components/dustySnow.tsx` with:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";

interface DustySnowProps {
  reducedMotion?: boolean;
  count?: number;
}

const createStars = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    left: `${Math.random() * 100}vw`,
    opacity: Math.random() * 0.42 + 0.28,
    scale: Math.random() * 0.72 + 0.28,
    duration: `${Math.random() * 14 + 16}s`,
    delay: `${Math.random() * -24}s`,
  }));

export default function DustySnow({
  reducedMotion = false,
  count = 150,
}: DustySnowProps) {
  const [isClient, setIsClient] = useState(false);
  const stars = useMemo(
    () => createStars(reducedMotion ? Math.min(count, 54) : count),
    [count, reducedMotion]
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div
      className={`rose-starfield${reducedMotion ? " rose-starfield--reduced" : ""}`}
      data-testid="rose-starfield"
    >
      {stars.map((star) => {
        const style = {
          "--left-pos": star.left,
          "--opacity": star.opacity,
          "--scale": star.scale,
          "--duration": star.duration,
          "--delay": star.delay,
        } as React.CSSProperties;

        return <span className="rose-star" key={star.id} style={style} />;
      })}
    </div>
  );
}
```

- [ ] **Step 4: Implement `RoseSpaceBackground`**

Create `src/features/landing/components/roseSpaceBackground.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import DustySnow from "@/features/landing/components/dustySnow";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export default function RoseSpaceBackground() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    setReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="rose-space-background"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-testid="rose-space-background"
    >
      <div className="rose-space-background__depth" />
      <DustySnow reducedMotion={reducedMotion} />
    </div>
  );
}
```

- [ ] **Step 5: Add rose background CSS**

In `src/shared/styles/global.css`, add these tokens inside `:root`:

```css
  --rose-primary: #ff98a2;
  --rose-primary-soft: #ffb8c0;
  --rose-primary-glow: rgba(255, 152, 162, 0.58);
  --rose-primary-dim: rgba(255, 152, 162, 0.16);
  --space-bg: #07040a;
  --space-bg-deep: #030206;
  --space-text: #fff7fb;
  --space-muted: #cdbdc7;
```

Then add this background/star CSS near the existing `.snow` styles. Leave the old `.snow:nth-child(...)` rules untouched for this task; the new implementation uses `.rose-star`.

```css
.rose-space-background {
  position: fixed;
  inset: 0;
  z-index: -10;
  overflow: hidden;
  pointer-events: none;
  background:
    radial-gradient(circle at 72% 16%, rgba(255, 152, 162, 0.24), transparent 24rem),
    radial-gradient(circle at 18% 84%, rgba(255, 82, 124, 0.14), transparent 28rem),
    linear-gradient(180deg, var(--space-bg), var(--space-bg-deep));
}

.rose-space-background__depth {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 96px 96px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent 78%);
  opacity: 0.22;
}

.rose-starfield {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.rose-star {
  position: absolute;
  top: -16px;
  left: var(--left-pos);
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background: var(--rose-primary);
  box-shadow:
    0 0 10px 2px var(--rose-primary-glow),
    0 0 22px 8px var(--rose-primary-dim);
  opacity: var(--opacity);
  transform: scale(var(--scale));
  animation:
    rose-star-glow 2.8s ease-in-out infinite alternate,
    rose-star-fall var(--duration) var(--delay) linear infinite;
}

.rose-starfield--reduced .rose-star {
  animation: none;
  top: calc(var(--scale) * 80vh);
}

@keyframes rose-star-fall {
  to {
    transform: translateY(110vh) scale(var(--scale));
  }
}

@keyframes rose-star-glow {
  from {
    box-shadow:
      0 0 8px 1px rgba(255, 152, 162, 0.42),
      0 0 18px 6px rgba(255, 152, 162, 0.12);
  }
  to {
    box-shadow:
      0 0 14px 3px rgba(255, 152, 162, 0.64),
      0 0 30px 10px rgba(255, 152, 162, 0.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rose-star {
    animation: none;
  }
}
```

- [ ] **Step 6: Run the background test to verify it passes**

Run:

```bash
npm test -- roseSpaceBackground.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit Task 1**

Run:

```bash
git add src/features/landing/components/dustySnow.tsx src/features/landing/components/roseSpaceBackground.tsx src/shared/styles/global.css src/test/features/landing/roseSpaceBackground.test.tsx
git commit -m "feat(landing): add rose space background"
```

---

### Task 2: Rose Orbit Landing UI

**Files:**
- Modify: `src/features/landing/ui/landingHero.tsx`
- Modify: `src/features/landing/ui/landingBodySection.tsx`
- Modify: `src/widgets/landing/index.tsx`
- Modify: `src/shared/styles/global.css`
- Test: `src/test/widgets/landing.test.tsx`

- [ ] **Step 1: Write the failing landing widget test**

Create `src/test/widgets/landing.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import Landing from "@/widgets/landing";

jest.mock("@/features/landing/components/parallax", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="parallax">{children}</div>
  ),
}));

describe("Landing", () => {
  it("renders the Rose Orbit landing without old visual clutter", () => {
    render(<Landing />);

    expect(screen.getByTestId("rose-space-background")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "EDMM" })).toBeInTheDocument();
    expect(screen.getByText("Electronic Dance Music")).toBeInTheDocument();
    expect(screen.getByText("Rose signal / Dance floor / Night stream")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore" })).toHaveAttribute(
      "href",
      "/search"
    );
    expect(screen.getAllByTestId("parallax")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Search" })).toHaveAttribute(
      "href",
      "/search"
    );
    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute(
      "href",
      "/library"
    );
    expect(screen.queryByText("EDM Marmot")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- landing.test.tsx
```

Expected: FAIL because current landing still renders old `EDM Marmot`, wrapper effects, and no `RoseSpaceBackground`.

- [ ] **Step 3: Replace the hero**

Replace `src/features/landing/ui/landingHero.tsx` with:

```tsx
import Link from "next/link";

export default function Hero() {
  return (
    <section className="rose-hero" aria-labelledby="rose-hero-title">
      <div className="rose-hero__inner">
        <p className="rose-hero__eyebrow">Rose signal / Dance floor / Night stream</p>
        <h1 id="rose-hero-title" className="rose-hero__title">
          EDMM
        </h1>
        <p className="rose-hero__kicker">Electronic Dance Music</p>
        <p className="rose-hero__copy">
          A rose-tinted signal for late-night electronic discovery.
        </p>
        <div className="rose-hero__actions">
          <Link className="rose-hero__cta" href="/search">
            Explore
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Simplify the body section while keeping `Parallax`**

Replace `src/features/landing/ui/landingBodySection.tsx` with:

```tsx
import Link from "next/link";
import Parallax from "@/features/landing/components/parallax";

export default function BodySection() {
  return (
    <section className="rose-followup" aria-label="EDMM navigation">
      <div className="rose-parallax-band" aria-hidden="true">
        <Parallax baseVelocity={-2}>Electronic</Parallax>
        <Parallax baseVelocity={2}>Dance Music</Parallax>
      </div>

      <div className="rose-followup__links">
        <Link href="/search">Search</Link>
        <Link href="/library">Library</Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Simplify the landing composition**

Replace `src/widgets/landing/index.tsx` with:

```tsx
import RoseSpaceBackground from "@/features/landing/components/roseSpaceBackground";
import Hero from "@/features/landing/ui/landingHero";
import BodySection from "@/features/landing/ui/landingBodySection";

export default function Landing() {
  return (
    <main className="rose-landing">
      <RoseSpaceBackground />
      <Hero />
      <BodySection />
    </main>
  );
}
```

- [ ] **Step 6: Add landing layout CSS**

In `src/shared/styles/global.css`, add:

```css
.rose-landing {
  position: relative;
  min-height: 100dvh;
  overflow-x: hidden;
  color: var(--space-text);
}

.rose-hero {
  min-height: 92dvh;
  display: flex;
  align-items: center;
  padding: 80px clamp(20px, 6vw, 96px) 48px;
}

.rose-hero__inner {
  width: min(980px, 100%);
}

.rose-hero__eyebrow {
  color: var(--rose-primary-soft);
  font-size: clamp(0.75rem, 1.8vw, 0.92rem);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-bottom: 18px;
}

.rose-hero__title {
  color: var(--space-text);
  font-size: clamp(5.6rem, 20vw, 16rem);
  line-height: 0.82;
  letter-spacing: 0;
  text-shadow: 0 0 34px rgba(255, 152, 162, 0.34);
}

.rose-hero__kicker {
  margin-top: 18px;
  color: var(--rose-primary);
  font-size: clamp(1rem, 3.4vw, 2.3rem);
  font-weight: 800;
  text-transform: uppercase;
}

.rose-hero__copy {
  max-width: 480px;
  margin-top: 16px;
  color: var(--space-muted);
  font-size: clamp(1rem, 2vw, 1.18rem);
  line-height: 1.7;
}

.rose-hero__actions {
  margin-top: 30px;
}

.rose-hero__cta {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--rose-primary);
  color: #16080d;
  padding: 0 22px;
  font-weight: 800;
  transition: transform 180ms ease, box-shadow 180ms ease;
  box-shadow: 0 0 24px rgba(255, 152, 162, 0.28);
}

.rose-hero__cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 34px rgba(255, 152, 162, 0.42);
}

.rose-hero__cta:focus-visible,
.rose-followup__links a:focus-visible {
  outline: 2px solid var(--rose-primary-soft);
  outline-offset: 4px;
}

.rose-followup {
  min-height: 36dvh;
  padding: 0 0 72px;
}

.rose-parallax-band {
  border-top: 1px solid rgba(255, 152, 162, 0.2);
  border-bottom: 1px solid rgba(255, 152, 162, 0.16);
  padding: 20px 0;
}

.rose-followup__links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 28px clamp(20px, 6vw, 96px) 0;
}

.rose-followup__links a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(255, 152, 162, 0.32);
  border-radius: 8px;
  color: var(--space-text);
  background: rgba(255, 255, 255, 0.04);
  padding: 0 18px;
  transition: border-color 180ms ease, background-color 180ms ease;
}

.rose-followup__links a:hover {
  border-color: rgba(255, 152, 162, 0.7);
  background: rgba(255, 152, 162, 0.1);
}

@media (max-width: 640px) {
  .rose-hero {
    min-height: 88dvh;
    padding-top: 64px;
  }

  .rose-hero__title {
    font-size: clamp(5rem, 29vw, 8rem);
  }
}
```

- [ ] **Step 7: Fix parallax CSS to avoid negative letter spacing**

In `src/shared/styles/global.css`, update the existing `.parallax` block:

```css
.parallax {
  overflow: hidden;
  letter-spacing: 0;
  line-height: 0.9;
  margin: 0;
  white-space: nowrap;
  display: flex;
  flex-wrap: nowrap;
}
```

Leave `.parallax .scroller` and `.parallax span` intact unless formatting requires removing duplicate `display: flex;`.

- [ ] **Step 8: Run the landing test to verify it passes**

Run:

```bash
npm test -- landing.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit Task 2**

Run:

```bash
git add src/features/landing/ui/landingHero.tsx src/features/landing/ui/landingBodySection.tsx src/widgets/landing/index.tsx src/shared/styles/global.css src/test/widgets/landing.test.tsx
git commit -m "feat(landing): rebuild rose orbit landing UI"
```

---

### Task 3: App Shell and Home Route Cleanup

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Test: `src/test/app/page.test.tsx`

- [ ] **Step 1: Write the failing `/` page test**

Create `src/test/app/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import Page from "@/app/page";

jest.mock("@/widgets/landing", () => ({
  __esModule: true,
  default: () => <main data-testid="landing-page">Landing</main>,
}));

jest.mock("@/views/home", () => ({
  __esModule: true,
  default: () => <div data-testid="home-view">HomeView</div>,
}));

jest.mock("@/widgets/audioPlayer/audioPlayerShell", () => ({
  __esModule: true,
  default: ({ children }: { children: (onPlay: () => void) => React.ReactNode }) => (
    <div data-testid="audio-shell">{children(() => undefined)}</div>
  ),
}));

describe("App page", () => {
  it("renders the landing only on the home route", () => {
    render(<Page />);

    expect(screen.getByTestId("landing-page")).toBeInTheDocument();
    expect(screen.queryByTestId("home-view")).not.toBeInTheDocument();
    expect(screen.queryByTestId("audio-shell")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- page.test.tsx
```

Expected: FAIL because current `src/app/page.tsx` still renders `AudioPlayerShell` and `HomeView`.

- [ ] **Step 3: Replace the home route**

Replace `src/app/page.tsx` with:

```tsx
import Landing from "@/widgets/landing";

export default function Page() {
  return <Landing />;
}
```

- [ ] **Step 4: Remove the global sidebar from the root layout**

Replace `src/app/layout.tsx` imports and body composition with this structure. Keep existing metadata object as-is unless formatting changes are required.

```tsx
import type { Metadata } from "next";
import "@/shared/styles/global.css";
import { AudioPlayerProvider } from "@/shared/providers/audioPlayerProvider";
import { TanstackProvider } from "../shared/providers/tanstackProvider";
```

The `RootLayout` component should become:

```tsx
const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <TanstackProvider>
          <AudioPlayerProvider>{children}</AudioPlayerProvider>
        </TanstackProvider>
      </body>
    </html>
  );
};
```

Remove:

```tsx
import NavSidebar from "@/widgets/navSidebar";
```

and remove:

```tsx
<div className="min-h-screen flex bg-black text-white">
  <NavSidebar />
  <div className="flex-1">{children}</div>
</div>
```

- [ ] **Step 5: Run the page test to verify it passes**

Run:

```bash
npm test -- page.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Run focused landing/background tests**

Run:

```bash
npm test -- landing.test.tsx roseSpaceBackground.test.tsx page.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit Task 3**

Run:

```bash
git add src/app/page.tsx src/app/layout.tsx src/test/app/page.test.tsx
git commit -m "feat(app): make home route landing-first"
```

---

### Task 4: Verification and Visual QA

**Files:**
- Modify only if verification finds a concrete issue in files touched by Tasks 1-3.

- [ ] **Step 1: Run TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 2: Run focused tests**

Run:

```bash
npm test -- landing.test.tsx roseSpaceBackground.test.tsx page.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run the full build**

Run:

```bash
npm run build
```

Expected: exit 0 and all app routes compile.

- [ ] **Step 4: Start the dev server**

Run:

```bash
npm run dev
```

Expected: Next dev server starts. Use the printed local URL, usually `http://localhost:3000`.

- [ ] **Step 5: Browser QA on `/`**

Open the local URL and verify:

- The first viewport shows only EDMM brand content, the `Explore` CTA, and the rose star background.
- No sidebar appears.
- No intro overlay appears.
- No earth canvas appears.
- No custom cursor appears.
- No trending track list appears.
- No audio player shell appears.
- Pink rose stars fall naturally.
- The parallax strip appears below the hero content.
- Mobile width around 375px has no horizontal scroll and no clipped text.
- Desktop width around 1440px shows a hint of the next section.

- [ ] **Step 6: Commit visual QA fixes if needed**

If Step 5 requires fixes, make the smallest scoped changes, rerun:

```bash
npx tsc --noEmit
npm test -- landing.test.tsx roseSpaceBackground.test.tsx page.test.tsx
npm run build
```

Then commit:

```bash
git add src/features/landing src/widgets/landing src/app src/shared/styles/global.css src/test
git commit -m "fix(landing): polish rose orbit visual QA"
```

Skip this commit if no changes were needed.

## Self-Review

Spec coverage:

- Pink rose identity: Task 1 CSS tokens and star styles.
- Falling-star background preserved: Task 1 keeps `DustySnow` and mounts it through `RoseSpaceBackground`.
- `parallax.tsx` preserved: Task 2 uses the existing component twice with `Electronic` and `Dance Music`.
- Old first-screen clutter removed: Task 2 removes landing wrapper stack; Task 3 removes `AudioPlayerShell`, `HomeView`, and global `NavSidebar`.
- Accessibility: Task 1 tests `aria-hidden`; Task 2 CTA/link focus CSS and 44px targets.
- Reduced motion: Task 1 matchMedia test and CSS.
- Hydration safety: Task 1 keeps stars client-only.
- Verification: Task 4 includes TypeScript, focused Jest, build, and browser QA.

Completeness scan:

- No undefined future tasks are required for implementation.
- Code snippets define the components and tests they reference.

Type consistency:

- `RoseSpaceBackground` path is consistently `src/features/landing/components/roseSpaceBackground.tsx`.
- Test IDs are consistently `rose-space-background` and `rose-starfield`.
- Route CTA is consistently `/search`.
- Follow-up links are consistently `/search` and `/library`.
