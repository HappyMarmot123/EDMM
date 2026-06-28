# Phase D — 디자인 시스템 & UI/UX (Neon Glassmorphism) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** EDMM의 비주얼 정체성(다크 밤하늘 + 로즈톤 핑크 별 낙하 + cobe 지구본 + 다이나믹 애니메이션)을 보존·강화하는 **Neon Glassmorphism 디자인 시스템**을 토큰화하고, 라우트/플레이어(Phase 3·4)가 소비할 글래스 UI 프리미티브와 모션 시스템을 구축한다.

**Architecture:** Tailwind v4 `@theme` + CSS 변수로 시맨틱 토큰(색/표면/글로우/타이포/간격/모션)을 단일 정의한다. 기존 하드코딩 값(`#ff98a2`, `.snow`, 글로우)을 토큰으로 승격한다. 글래스 표면은 공통 유틸/프리미티브로 캡슐화하고, Framer Motion variants를 모션 토큰으로 표준화한다. 앱 셸은 밤하늘 배경(별 낙하 + 지구본)을 전역 backdrop로 둔다.

**Tech Stack:** Tailwind v4, Framer Motion 12, React 19, TypeScript 6, lucide-react(아이콘), Jest/RTL.

## Global Constraints

- 매 태스크 종료 시 `npm run build` 성공 + `npm test` 통과.
- **위치**: Phase 2 다음, Phase 3 이전. Phase 3·4의 UI 컴포넌트는 본 단계의 토큰/프리미티브를 소비한다(바닐라 Tailwind 마크업을 글래스 프리미티브로 대체).
- **정체성 보존**: 로즈톤(`#ff98a2` 계열) 유지, 밤하늘 핑크 별 낙하 배경 유지·발전, cobe 지구본 유지, 다이나믹 애니메이션 강화.
- **접근성(CRITICAL)**: 글래스 표면 위 텍스트 대비 ≥ 4.5:1, 포커스 링 보존(2–4px), `prefers-reduced-motion` 존중(별 낙하/패럴랙스 감소), 아이콘 버튼 `aria-label`. (ui-ux-pro-max 우선순위 1)
- **모션 규칙**: 마이크로 150–300ms, transform/opacity만 애니메이션, ease-out 진입/ease-in 퇴장, 퇴장은 진입의 60–70%, 리스트 stagger 30–50ms. (우선순위 7)
- 아이콘은 lucide-react만 사용(이모지 금지), 토큰 기반 사이즈.

---

## File Structure

- Modify: `src/shared/styles/global.css` — 시맨틱 토큰 + 글래스 유틸 + reduced-motion 정리(하드코딩 승격)
- Create: `src/shared/styles/tokens.css` — `@theme` 토큰 단일 정의(색/표면/글로우/타이포/간격/모션)
- Create: `src/shared/ui/glassCard.tsx` — 글래스 표면 카드
- Create: `src/shared/ui/button.tsx` — 네온 글래스 버튼(primary/ghost/icon)
- Create: `src/shared/ui/iconButton.tsx` — 접근성 아이콘 버튼(aria-label 필수)
- Create: `src/shared/ui/slider.tsx` — seek/볼륨용 슬라이더(터치 44px)
- Create: `src/shared/ui/skeleton.tsx` — 로딩 시머
- Create: `src/shared/motion/variants.ts` — Framer Motion variants 토큰
- Create: `src/shared/motion/useReducedMotion.ts` — 모션 감소 훅 래퍼
- Create: `src/widgets/appBackground/index.tsx` — 밤하늘(별 낙하) + 지구본 backdrop
- Create: `src/app/design/page.tsx` — 디자인 시스템 미리보기(스토리북 대용, 개발 확인용)
- Test: `src/test/shared/ui/*.test.tsx`, `src/test/shared/motion/variants.test.ts`

---

### Task 1: 디자인 토큰 단일 정의 (tokens.css)

**Files:**
- Create: `src/shared/styles/tokens.css`
- Modify: `src/shared/styles/global.css` (tokens import + 하드코딩 값 → var 참조)
- Test: `src/test/shared/designTokens.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: CSS 변수 토큰 세트 — 색(`--color-rose-*`, `--color-surface-*`, `--color-on-surface*`), 글래스(`--glass-bg`, `--glass-border`, `--glass-blur`), 글로우(`--glow-rose`), 타이포 스케일, 간격(4/8), 반경, z-index, 모션(`--motion-fast/base/slow`, `--ease-out/in`)

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/test/shared/designTokens.test.ts
import fs from "fs";
import path from "path";

const css = fs.readFileSync(path.join(process.cwd(), "src/shared/styles/tokens.css"), "utf8");

it("defines core semantic tokens", () => {
  ["--color-rose-500", "--color-surface-1", "--color-on-surface", "--glass-bg", "--glass-blur", "--glow-rose", "--motion-base", "--ease-out"]
    .forEach((t) => expect(css).toContain(t));
});
it("keeps rose identity (#ff98a2 family)", () => {
  expect(css.toLowerCase()).toContain("#ff98a2");
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- designTokens.test.ts` → FAIL

- [ ] **Step 3: 최소 구현**

```css
/* src/shared/styles/tokens.css */
@theme {
  /* Rose identity (preserved) */
  --color-rose-300: #ffc2c9;
  --color-rose-400: #ffadb6;
  --color-rose-500: #ff98a2; /* primary, 기존 정체성 */
  --color-rose-600: #e87f8a;

  /* Surfaces (dark night-sky base) */
  --color-bg: #07060a;
  --color-surface-1: #14121b;
  --color-surface-2: #1d1a26;
  --color-on-surface: #f3eef2;       /* body text, >4.5:1 on surface */
  --color-on-surface-muted: #b8b0bd; /* secondary, >3:1 */

  /* Glass */
  --glass-bg: rgba(29, 26, 38, 0.55);
  --glass-border: rgba(255, 152, 162, 0.18);
  --glass-blur: 14px;

  /* Neon glow */
  --glow-rose: 0 0 12px rgba(255, 152, 162, 0.55), 0 0 32px rgba(255, 152, 162, 0.3);

  /* Typography — ui-ux-pro-max 추천 페어링 "Tech Startup": Space Grotesk(heading) + DM Sans(body) */
  --font-heading: "Space Grotesk", system-ui, sans-serif;
  --font-body: "DM Sans", system-ui, sans-serif;
  --text-xs: 0.75rem; --text-sm: 0.875rem; --text-base: 1rem;
  --text-lg: 1.125rem; --text-xl: 1.5rem; --text-2xl: 2rem; --text-3xl: 2.5rem;

  /* Radius / z */
  --radius-sm: 8px; --radius-md: 14px; --radius-lg: 22px; --radius-full: 9999px;
  --z-nav: 40; --z-player: 50; --z-modal: 100; --z-toast: 1000;

  /* Motion */
  --motion-fast: 150ms; --motion-base: 240ms; --motion-slow: 360ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);
}

/* Glass surface utility */
.glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-radius: var(--radius-md);
}
.glow-rose { box-shadow: var(--glow-rose); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
}
```
`global.css` 상단에 `@import "./tokens.css";`를 추가하고, 기존 `--pink-main` 등 하드코딩을 `var(--color-rose-500)` 참조로 교체(별/글로우 keyframes는 유지하되 색은 토큰 참조). 폰트는 `app/layout.tsx`에서 `next/font/google`로 Space Grotesk + DM Sans를 로드해 `--font-heading`/`--font-body`에 연결한다.

> **데이터 출처 (ui-ux-pro-max CLI)**: 제품 매칭 = `#45 Music Streaming`(Dark Mode OLED + Vibrant & Block-based, 보조: Motion-Driven·Aurora UI, 랜딩: Feature-Rich Showcase). 타이포 = `Tech Startup`(Space Grotesk + DM Sans). CLI 기본 팔레트는 indigo+play-green on near-black이지만, EDMM은 **로즈톤 정체성을 유지**하기로 했으므로 구조적 추천(다크 OLED 기반·글래스·모션·카드)만 채택하고 primary/accent는 로즈(`#ff98a2`)로 둔다. 기능색으로 재생=play-green(`#22C55E`)을 보조 accent로 활용 가능.

- [ ] **Step 4: 통과 확인** — Run: `npm test -- designTokens.test.ts` → PASS

- [ ] **Step 5: 빌드 게이트** — Run: `npm run build` → 성공

- [ ] **Step 6: 커밋**

```bash
git add src/shared/styles/tokens.css src/shared/styles/global.css src/test/shared/designTokens.test.ts
git commit -m "feat(design): add semantic design tokens (neon glass + preserved rose identity)"
```

---

### Task 2: 모션 시스템 (variants + reduced-motion 훅)

**Files:**
- Create: `src/shared/motion/variants.ts`
- Create: `src/shared/motion/useReducedMotion.ts`
- Test: `src/test/shared/motion/variants.test.ts`

**Interfaces:**
- Consumes: framer-motion
- Produces:
  - `fadeInUp`, `staggerContainer(staggerMs?)`, `scalePress`, `pageTransition` (Variants)
  - `const MOTION = { fast: 0.15, base: 0.24, slow: 0.36 }`
  - `useAppReducedMotion(): boolean`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/test/shared/motion/variants.test.ts
import { MOTION, fadeInUp, staggerContainer } from "@/shared/motion/variants";

it("exposes motion duration tokens", () => {
  expect(MOTION.base).toBeCloseTo(0.24);
});
it("fadeInUp animates opacity and y", () => {
  expect(fadeInUp.hidden).toMatchObject({ opacity: 0 });
  expect(fadeInUp.visible).toMatchObject({ opacity: 1 });
});
it("staggerContainer sets staggerChildren", () => {
  const v = staggerContainer(40) as any;
  expect(v.visible.transition.staggerChildren).toBeCloseTo(0.04);
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- variants.test.ts` → FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/shared/motion/variants.ts
import { Variants } from "framer-motion";

export const MOTION = { fast: 0.15, base: 0.24, slow: 0.36 };
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: MOTION.base, ease: EASE_OUT } },
};
export const scalePress: Variants = {
  rest: { scale: 1 },
  pressed: { scale: 0.96, transition: { duration: MOTION.fast } },
};
export const pageTransition: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: MOTION.base, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: MOTION.fast } }, // 퇴장 < 진입
};
export const staggerContainer = (staggerMs = 40): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: staggerMs / 1000 } },
});
```
```ts
// src/shared/motion/useReducedMotion.ts
"use client";
import { useReducedMotion } from "framer-motion";
export function useAppReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- variants.test.ts` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/motion src/test/shared/motion
git commit -m "feat(design): add motion variants and reduced-motion hook"
```

---

### Task 3: 글래스 프리미티브 — GlassCard + Button + IconButton

**Files:**
- Create: `src/shared/ui/glassCard.tsx`, `src/shared/ui/button.tsx`, `src/shared/ui/iconButton.tsx`
- Test: `src/test/shared/ui/button.test.tsx`, `src/test/shared/ui/iconButton.test.tsx`

**Interfaces:**
- Consumes: tokens(`.glass`/`.glow-rose`), `scalePress`(motion), lucide-react
- Produces:
  - `Button({ variant?: "primary" | "ghost"; ...HTMLButtonProps })`
  - `IconButton({ label: string; icon: LucideIcon; ...HTMLButtonProps })` — `aria-label={label}`, 44px 터치, 포커스 링
  - `GlassCard({ glow?: boolean; ...HTMLDivProps })`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/shared/ui/iconButton.test.tsx
import { render, screen } from "@testing-library/react";
import { Play } from "lucide-react";
import IconButton from "@/shared/ui/iconButton";

it("exposes accessible label and min touch size", () => {
  render(<IconButton label="재생" icon={Play} />);
  const btn = screen.getByRole("button", { name: "재생" });
  expect(btn).toHaveClass("min-w-11"); // 44px = 11*4px
  expect(btn).toHaveClass("min-h-11");
});
```
```tsx
// src/test/shared/ui/button.test.tsx
import { render, screen } from "@testing-library/react";
import Button from "@/shared/ui/button";
it("renders children and primary variant by default", () => {
  render(<Button>저장</Button>);
  expect(screen.getByRole("button", { name: "저장" })).toBeInTheDocument();
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- shared/ui` → FAIL

- [ ] **Step 3: 최소 구현**

```tsx
// src/shared/ui/glassCard.tsx
import { clsx } from "clsx";
export default function GlassCard({ glow, className, ...rest }: React.HTMLAttributes<HTMLDivElement> & { glow?: boolean }) {
  return <div className={clsx("glass p-4", glow && "glow-rose", className)} {...rest} />;
}
```
```tsx
// src/shared/ui/button.tsx
import { clsx } from "clsx";
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" };
export default function Button({ variant = "primary", className, ...rest }: Props) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-[var(--radius-md)] px-4 min-h-11 font-medium transition-[transform,box-shadow] duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-50",
        variant === "primary" ? "bg-rose-500 text-black glow-rose" : "glass text-on-surface",
        className
      )}
      {...rest}
    />
  );
}
```
```tsx
// src/shared/ui/iconButton.tsx
import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: LucideIcon };
export default function IconButton({ label, icon: Icon, className, ...rest }: Props) {
  return (
    <button
      aria-label={label}
      className={clsx("inline-flex items-center justify-center min-w-11 min-h-11 rounded-full transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400", className)}
      {...rest}
    >
      <Icon className="w-5 h-5" aria-hidden />
    </button>
  );
}
```
> 참고: `rose-*`/`on-surface` 색이 Tailwind 클래스로 동작하려면 tokens의 `--color-rose-*` 네이밍이 Tailwind v4 색 토큰 규칙(`--color-*`)을 따르므로 `bg-rose-500` 등으로 사용 가능하다. `on-surface`는 `text-on-surface`로 매핑(`--color-on-surface`).

- [ ] **Step 4: 통과 확인** — Run: `npm test -- shared/ui` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/ui/glassCard.tsx src/shared/ui/button.tsx src/shared/ui/iconButton.tsx src/test/shared/ui
git commit -m "feat(design): add GlassCard/Button/IconButton primitives"
```

---

### Task 4: Slider + Skeleton 프리미티브

**Files:**
- Create: `src/shared/ui/slider.tsx`, `src/shared/ui/skeleton.tsx`
- Test: `src/test/shared/ui/slider.test.tsx`

**Interfaces:**
- Consumes: tokens
- Produces:
  - `Slider({ value: number; max: number; onChange: (v: number) => void; label: string })` — 키보드 조작(range), 44px 터치
  - `Skeleton({ className?: string })` — 시머 로딩

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/shared/ui/slider.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import Slider from "@/shared/ui/slider";
it("is an accessible range and reports change", () => {
  const onChange = jest.fn();
  render(<Slider value={30} max={100} onChange={onChange} label="재생 위치" />);
  const range = screen.getByRole("slider", { name: "재생 위치" });
  fireEvent.change(range, { target: { value: "50" } });
  expect(onChange).toHaveBeenCalledWith(50);
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- slider.test.tsx` → FAIL

- [ ] **Step 3: 최소 구현**

```tsx
// src/shared/ui/slider.tsx
export default function Slider({ value, max, onChange, label }: { value: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <input
      type="range" aria-label={label} min={0} max={max} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-11 accent-rose-500 cursor-pointer"
    />
  );
}
```
```tsx
// src/shared/ui/skeleton.tsx
import { clsx } from "clsx";
export default function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-[var(--radius-sm)] bg-surface-2/60", className)} aria-hidden />;
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- slider.test.tsx` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/ui/slider.tsx src/shared/ui/skeleton.tsx src/test/shared/ui/slider.test.tsx
git commit -m "feat(design): add Slider and Skeleton primitives"
```

---

### Task 5: 앱 배경 — 밤하늘 별 낙하 + 지구본 backdrop

**Files:**
- Create: `src/widgets/appBackground/index.tsx`
- Modify: `src/app/layout.tsx` (배경 마운트)
- Test: `src/test/widgets/appBackground.test.tsx`

**Interfaces:**
- Consumes: 기존 `dustySnow`(별 낙하), `earthLazy`(Phase 6 지연 지구본 — 없으면 기존 `earth`), `useAppReducedMotion`
- Produces: `AppBackground` — 전역 고정 backdrop(별 낙하 + 지구본), reduced-motion 시 별 낙하 정지

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/widgets/appBackground.test.tsx
import { render, screen } from "@testing-library/react";
import AppBackground from "@/widgets/appBackground";

jest.mock("@/shared/motion/useReducedMotion", () => ({ useAppReducedMotion: () => true }));

it("renders backdrop container and hides falling stars when reduced motion", () => {
  render(<AppBackground />);
  expect(screen.getByTestId("app-backdrop")).toBeInTheDocument();
  expect(screen.queryByTestId("falling-stars")).toBeNull();
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- appBackground.test.tsx` → FAIL

- [ ] **Step 3: 최소 구현**

```tsx
// src/widgets/appBackground/index.tsx
"use client";
import DustySnow from "@/features/landing/components/dustySnow";
import { useAppReducedMotion } from "@/shared/motion/useReducedMotion";

export default function AppBackground() {
  const reduced = useAppReducedMotion();
  return (
    <div data-testid="app-backdrop" aria-hidden className="fixed inset-0 -z-10 pointer-events-none bg-bg overflow-hidden">
      {!reduced && <div data-testid="falling-stars"><DustySnow /></div>}
      <div className="my-gradient fixed w-screen pointer-events-none" />
      {/* 지구본은 홈 hero에서 EarthLazy로 렌더(Phase 6). 전역 backdrop은 별+그라데이션만. */}
    </div>
  );
}
```
`src/app/layout.tsx`에서 콘텐츠 뒤에 `<AppBackground />`를 마운트한다(별 낙하 색은 Task 1 토큰을 사용).

- [ ] **Step 4: 통과 확인** — Run: `npm test -- appBackground.test.tsx` → PASS

- [ ] **Step 5: 빌드 게이트** — Run: `npm run build` → 성공

- [ ] **Step 6: 커밋**

```bash
git add src/widgets/appBackground src/app/layout.tsx src/test/widgets/appBackground.test.tsx
git commit -m "feat(design): add night-sky falling-stars backdrop with reduced-motion guard"
```

---

### Task 6: 디자인 시스템 미리보기 페이지 + 접근성 검증

**Files:**
- Create: `src/app/design/page.tsx`
- Test: 없음(수동 검증 라우트)

**Interfaces:**
- Consumes: 모든 프리미티브(Task 3·4) + 토큰
- Produces: `/design` — 토큰/프리미티브 갤러리

- [ ] **Step 1: 미리보기 페이지 작성**

```tsx
// src/app/design/page.tsx
"use client";
import GlassCard from "@/shared/ui/glassCard";
import Button from "@/shared/ui/button";
import IconButton from "@/shared/ui/iconButton";
import Slider from "@/shared/ui/slider";
import Skeleton from "@/shared/ui/skeleton";
import { Play, Heart } from "lucide-react";
import { useState } from "react";

export default function DesignSystemPage() {
  const [v, setV] = useState(30);
  return (
    <main className="p-8 space-y-6 text-on-surface">
      <h1 className="text-3xl font-bold">EDMM Design System</h1>
      <section className="flex gap-3">
        <Button>Primary</Button>
        <Button variant="ghost">Ghost</Button>
        <IconButton label="재생" icon={Play} />
        <IconButton label="좋아요" icon={Heart} />
      </section>
      <GlassCard glow className="max-w-sm">
        <p>Glass surface + neon glow</p>
      </GlassCard>
      <Slider value={v} max={100} onChange={setV} label="미리보기 슬라이더" />
      <Skeleton className="h-6 w-48" />
    </main>
  );
}
```

- [ ] **Step 2: 빌드 게이트** — Run: `npm run build` → 성공

- [ ] **Step 3: 접근성/대비 수동 검증**

`npm run dev` → `/design`에서 확인:
- 글래스 표면 위 본문 텍스트 대비 ≥ 4.5:1, 보조 텍스트 ≥ 3:1
- Tab 키로 모든 버튼/슬라이더 포커스 링 표시
- OS reduced-motion 켠 상태에서 별 낙하/시머가 감소/정지
- 아이콘 버튼이 스크린리더에서 라벨로 읽힘
> ui-ux-pro-max 우선순위 1~3(접근성/터치/성능) 및 dark-mode 대비 항목 기준.

- [ ] **Step 4: 전체 테스트 게이트** — Run: `npm test` → 통과

- [ ] **Step 5: 커밋**

```bash
git add src/app/design/page.tsx
git commit -m "feat(design): add design system preview route and a11y verification"
```

---

## Self-Review

**1. Spec/스킬 커버리지:**
- ui-ux-pro-max 우선순위 1 접근성(대비/포커스/aria/reduced-motion)→Task1,3,6; 2 터치(44px)→Task3,4; 4 스타일(글래스 일관/SVG 아이콘)→Task1,3; 6 타이포·색(시맨틱 토큰)→Task1; 7 애니메이션(150–300ms/transform·opacity/ease/stagger/exit<enter)→Task2.
- EDMM 정체성: 로즈톤 `#ff98a2` 토큰 보존(Task1), 밤하늘 별 낙하 backdrop(Task5), 지구본은 hero에서 유지(Phase 6 EarthLazy 연계), 다이나믹 애니메이션 표준화(Task2).
- 소비 연계: Phase 3·4의 TrackList/뷰/미니플레이어/EQ패널이 본 단계 프리미티브(Button/IconButton/GlassCard/Slider/Skeleton)와 모션 variants를 사용하도록 후속 적용.

**2. Placeholder 스캔:** 모든 코드 단계에 실제 코드 포함. Task6 접근성 검증은 수동 항목을 구체 기준(대비 수치/키 동작)으로 명시 — placeholder 아님.

**3. 타입/명칭 일관성:** 토큰명(`--color-rose-500`, `--glass-bg`, `--motion-base`, `--ease-out`)이 Task1 정의 → Task2(MOTION 수치 정합)/Task3(.glass·rose-* 사용)에서 일관. `Button`/`IconButton`/`GlassCard`/`Slider`/`Skeleton` 시그니처가 Task3·4 정의 → Task6 갤러리에서 동일 사용. `useAppReducedMotion`(Task2) → Task5 사용 일치.

**범위 주의:** Phase D 전용(디자인 토대). Phase 3·4 UI에 프리미티브 적용은 해당 단계에서 수행하며, 본 단계는 토큰·프리미티브·배경·모션 시스템 확립까지를 책임진다.
