# Phase 0 — 툴체인 버전업 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** EDMM의 핵심 툴체인(Next 16 / React 19.2 / TypeScript 6 / ESLint 10 / Tailwind 4.3 등)을 앱이 항상 동작(green)하는 상태를 유지하며 최신 안정 버전으로 점진적 업그레이드한다.

**Architecture:** 메이저 업그레이드는 1건씩 독립 태스크로 수행하고, 각 태스크는 `npm run build` 성공 + `npm test` 통과를 회귀 게이트로 삼는다. 의존성 업그레이드는 단위 테스트를 새로 작성하는 대상이 아니라 **기존 테스트 스위트 + 빌드 + 수동 스모크**가 검증 수단이다. 정확한 breaking change는 추정하지 않고 공식 codemod 실행과 빌드/테스트 출력으로 확인·수정한다.

**Tech Stack:** Next.js 16, React 19.2, TypeScript 6, ESLint 10(flat config), Tailwind 4.3, Framer Motion 12.40, Zustand 5, TanStack Query 5, Jest/RTL, cobe 2, swiper 12, lucide-react 1.

## Global Constraints

- 매 태스크 종료 시 `npm run build` 성공 + `npm test` 통과(기존 회귀 없음)를 만족해야 한다.
- 앱은 모든 태스크 사이에서 동작 가능(green) 상태를 유지한다 — 한 번에 메이저 1건.
- 이 단계에서는 **기능 변경·파일 삭제(auth/Supabase/Cloudinary/Drizzle 제거) 금지**. 그것들은 후속 단계 계획에서 대체물과 함께 처리한다.
- `kakao-js-sdk`, `@supabase/*`, `cloudinary`/`next-cloudinary`, `drizzle-*`, `@vercel/postgres`, `postgres`는 **이 단계에서 제거하지 않는다**(사용처가 살아있어 빌드가 깨짐).
- 버전 목표값(레지스트리 확인, 2026-06-23): next 16.2.9 · react/react-dom 19.2.7 · typescript 6.0.3 · eslint 10.5.0 · eslint-config-next 16.x · tailwindcss/@tailwindcss/postcss 4.3.1 · framer-motion 12.40.0 · zustand 5.0.14 · @tanstack/react-query 5.101.1 · sonner 2.0.7 · lucide-react 1.21.0 · swiper 12.2.0 · cobe 2.0.1.

---

## File Structure

이 단계에서 생성/수정하는 파일:

- Modify: `package.json` — 의존성 버전, lint 스크립트
- Modify: `next.config.ts` — 제거된 옵션 정리(`swcMinify`), export 정규화, 빌드 번들러 확인
- Create: `eslint.config.mjs` — ESLint 10 flat config (없던 설정 신설)
- Modify: `tsconfig.json` — TS 6 호환 옵션(필요 시)
- Modify: `jest.config.js` — `next/jest` 호환 확인(필요 시)
- Modify: `README.md` — 기술 스택 버전 갱신
- 그 외: codemod/타입 변경으로 인해 빌드/타입 오류가 난 소스 파일만 최소 수정

---

### Task 0: 베이스라인 확보 (현재 green 상태 기록 + 작업 브랜치)

**Files:**
- 없음 (브랜치 생성 + 상태 기록)

**Interfaces:**
- Consumes: 없음
- Produces: `chore/phase0-toolchain` 브랜치, 베이스라인 build/test 결과

- [ ] **Step 1: 작업 브랜치 생성**

```bash
git checkout -b chore/phase0-toolchain
```

- [ ] **Step 2: 현재 의존성 설치 확인**

Run: `npm ci`
Expected: 성공 (lockfile 기준 설치 완료)

- [ ] **Step 3: 베이스라인 빌드**

Run: `npm run build`
Expected: 성공. 실패 시 출력 전문을 기록 — 이후 업그레이드가 만든 회귀와 구분하기 위한 기준선이다.

- [ ] **Step 4: 베이스라인 테스트**

Run: `npm test`
Expected: 통과(또는 현재 통과/실패 개수를 기록). 이 숫자가 이후 모든 태스크의 회귀 기준이다.

- [ ] **Step 5: 베이스라인 커밋(빈 커밋으로 기준점 표시)**

```bash
git commit --allow-empty -m "chore: phase0 baseline (pre-upgrade green state)"
```

---

### Task 1: 미사용 의존성 제거 (`@nextui-org/react`)

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: 없음
- Produces: 없음 (의존성 1개 제거)

근거: `@nextui-org/react`는 `src/**` 어디에서도 import되지 않는 죽은 의존성이다. `kakao-js-sdk`는 `src/shared/lib/kakao.ts`에서 사용 중이므로 **제거하지 않는다**.

- [ ] **Step 1: 사용처 0건 재확인**

Run: `git grep -n "@nextui-org" -- "src/"`
Expected: 출력 없음(0건). 만약 결과가 있으면 제거를 중단하고 보고한다.

- [ ] **Step 2: 의존성 제거**

```bash
npm uninstall @nextui-org/react
```

- [ ] **Step 3: 빌드 게이트**

Run: `npm run build`
Expected: 성공 (Task 0 베이스라인과 동일)

- [ ] **Step 4: 테스트 게이트**

Run: `npm test`
Expected: 통과 (Task 0 베이스라인과 동일 개수)

- [ ] **Step 5: 커밋**

```bash
git add package.json package-lock.json
git commit -m "chore: remove unused @nextui-org/react dependency"
```

---

### Task 2: 저위험 마이너/패치 일괄 업그레이드

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: 없음
- Produces: 없음

대상: react, react-dom, tailwindcss, @tailwindcss/postcss, framer-motion, zustand, @tanstack/react-query, sonner. (메이저 변경 없음 — 한 번에 처리하고 게이트로 검증.)

- [ ] **Step 1: 업그레이드 설치**

```bash
npm install react@19.2.7 react-dom@19.2.7 \
  tailwindcss@4.3.1 @tailwindcss/postcss@4.3.1 \
  framer-motion@12.40.0 zustand@5.0.14 \
  @tanstack/react-query@5.101.1 sonner@2.0.7
```

- [ ] **Step 2: 타입/빌드 게이트**

Run: `npm run build`
Expected: 성공. 타입 오류가 나면 해당 소스만 최소 수정(시그니처 변경 대응) 후 재실행.

- [ ] **Step 3: 테스트 게이트**

Run: `npm test`
Expected: 통과 (베이스라인 개수 유지)

- [ ] **Step 4: 수동 스모크**

Run: `npm run dev` → 브라우저에서 랜딩 렌더 + 트랙 1곡 재생 확인 후 종료.
Expected: 랜딩 정상 렌더, 재생 동작.

- [ ] **Step 5: 커밋**

```bash
git add package.json package-lock.json
git commit -m "chore: bump react/tailwind/framer-motion/zustand/react-query/sonner to latest minor"
```

---

### Task 3: Next.js 15 → 16 업그레이드

**Files:**
- Modify: `package.json` (next, eslint-config-next)
- Modify: `next.config.ts`
- Modify: codemod/빌드가 지적하는 소스 파일(최소)

**Interfaces:**
- Consumes: 없음
- Produces: Next 16 빌드 환경

주의: Next 16은 `next lint`를 제거했고, 일부 설정 옵션(예: `swcMinify`)이 더 이상 유효하지 않다. `next.config.ts`는 현재 `module.exports = nextConfig`와 타입 import가 섞여 있고 `swcMinify: false`, 커스텀 `webpack` 설정을 포함한다.

- [ ] **Step 1: 공식 codemod 실행**

```bash
npx @next/codemod@latest upgrade latest
```
Expected: next 16.2.9 + eslint-config-next 16.x 설치, 자동 변환 적용. 변경 내역을 `git diff`로 검토한다.

- [ ] **Step 2: `next.config.ts` 정리**

`swcMinify` 옵션을 제거하고 export를 정규화한다. 수정 후 파일:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "singhimalaya.github.io" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  webpack: (config) => {
    config.optimization.splitChunks = { chunks: "all", minChunks: 2 };
    return config;
  },
};

export default nextConfig;
```

- [ ] **Step 3: 빌드 게이트 (번들러 확인 포함)**

Run: `npm run build`
Expected: 성공. 만약 Turbopack 빌드에서 커스텀 `webpack` 설정 경고/오류가 나면, 빌드 출력 지시에 따라 (a) 웹팩 빌드 유지 옵션을 쓰거나 (b) `webpack` 키를 제거한다 — `splitChunks` 최적화는 성능 단계(후속 계획)에서 Turbopack 방식으로 재설계하므로, 여기서 제거해도 green이 우선이다. 제거 시 그 사실을 커밋 메시지에 남긴다.

- [ ] **Step 4: 테스트 게이트**

Run: `npm test`
Expected: 통과. `next/jest`(`jest.config.js`)가 16에서 동작하는지 확인 — 실패 시 출력에 따라 `jest.config.js` 최소 조정.

- [ ] **Step 5: 수동 스모크**

Run: `npm run dev` → 랜딩 렌더 + 재생 + 라우트 이동(`/`, `/auth/callback` 존재 시) 확인.
Expected: 정상 동작.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "chore: upgrade Next.js 15 -> 16 (codemod + config cleanup)"
```

---

### Task 4: TypeScript 5 → 6 업그레이드

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json` (필요 시)
- Modify: 타입 오류가 난 소스(최소)

**Interfaces:**
- Consumes: 없음
- Produces: TS 6 타입체크 통과 환경

- [ ] **Step 1: 설치**

```bash
npm install -D typescript@6.0.3
```

- [ ] **Step 2: 타입체크 실행 (1차 오류 수집)**

Run: `npx tsc --noEmit`
Expected: 통과 또는 신규 오류 목록. 오류가 나면 각 오류를 해당 소스에서 최소 수정한다(엄격해진 추론/제거된 옵션 대응). `tsconfig.json`의 `target: ES2017`/`moduleResolution: bundler`는 유지하되, TS6가 더 이상 지원하지 않는 옵션을 지적하면 그 항목만 수정.

- [ ] **Step 3: 빌드 게이트**

Run: `npm run build`
Expected: 성공

- [ ] **Step 4: 테스트 게이트**

Run: `npm test`
Expected: 통과 (ts-jest/`@types/jest` 호환 확인; 실패 시 출력에 따라 조정)

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "chore: upgrade TypeScript 5 -> 6 and fix type regressions"
```

---

### Task 5: ESLint 9 → 10 + flat config 신설

**Files:**
- Modify: `package.json` (eslint, lint 스크립트)
- Create: `eslint.config.mjs`

**Interfaces:**
- Consumes: eslint-config-next 16(Task 3에서 설치)
- Produces: `npm run lint` 동작(flat config 기반)

근거: 저장소에 ESLint 설정 파일이 없고, 현재 스크립트는 `next lint`(Next 16에서 제거됨)이다. ESLint 10은 flat config만 지원하므로 `eslint.config.mjs`를 신설하고 스크립트를 ESLint CLI로 교체한다.

- [ ] **Step 1: 설치**

```bash
npm install -D eslint@10.5.0
```

- [ ] **Step 2: flat config 생성**

Create `eslint.config.mjs`:

```js
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "coverage/**", "drizzle/**"],
  },
];

export default eslintConfig;
```

- [ ] **Step 3: lint 스크립트 교체**

`package.json`의 `"lint": "next lint"`를 다음으로 변경:

```json
"lint": "eslint .",
"lint:fix": "eslint . --fix"
```

- [ ] **Step 4: lint 실행 게이트**

Run: `npm run lint`
Expected: 동작(에러 0 또는 기존 수준의 경고). 신규 룰로 에러가 폭증하면 `eslint.config.mjs`에서 해당 룰을 프로젝트 기준에 맞게 완화하고 사유를 커밋에 남긴다.

- [ ] **Step 5: 빌드 게이트**

Run: `npm run build`
Expected: 성공

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "chore: upgrade ESLint 9 -> 10 with flat config, replace next lint"
```

---

### Task 6: lucide-react 0.x → 1.x

**Files:**
- Modify: `package.json`
- Modify: 아이콘 import가 깨진 소스(있을 경우)

**Interfaces:**
- Consumes: 없음
- Produces: 없음

- [ ] **Step 1: 설치**

```bash
npm install lucide-react@1.21.0
```

- [ ] **Step 2: 빌드 게이트 (아이콘 import 회귀 확인)**

Run: `npm run build`
Expected: 성공. 이름이 바뀐 아이콘이 있으면 빌드 오류로 드러난다 — 해당 import만 새 이름으로 교체.

- [ ] **Step 3: 테스트 게이트**

Run: `npm test`
Expected: 통과

- [ ] **Step 4: 수동 스모크**

Run: `npm run dev` → 플레이어 컨트롤/좋아요 등 아이콘이 정상 표시되는지 확인.
Expected: 아이콘 정상 렌더.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "chore: upgrade lucide-react to 1.x and fix icon imports"
```

---

### Task 7: swiper 11 → 12

**Files:**
- Modify: `package.json`
- Modify: `src/shared/components/horizontalSwiper.tsx` (필요 시)

**Interfaces:**
- Consumes: 없음
- Produces: 없음

사용처: `src/shared/components/horizontalSwiper.tsx` (`swiper/react`, `swiper/modules`의 `Navigation`, `A11y`).

- [ ] **Step 1: 설치**

```bash
npm install swiper@12.2.0
```

- [ ] **Step 2: 빌드 게이트**

Run: `npm run build`
Expected: 성공. import 경로(`swiper/react`, `swiper/modules`, CSS)나 모듈명이 12에서 바뀌었으면 빌드 출력에 따라 `horizontalSwiper.tsx`만 수정.

- [ ] **Step 3: 테스트 게이트**

Run: `npm test`
Expected: 통과

- [ ] **Step 4: 수동 스모크**

Run: `npm run dev` → 가로 스와이퍼(캐러셀) 스와이프/네비게이션 동작 확인.
Expected: 정상 동작.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "chore: upgrade swiper 11 -> 12"
```

---

### Task 8: cobe 0.6 → 2.0 (3D 지구본)

**Files:**
- Modify: `package.json`
- Modify: `src/features/landing/hooks/useEarth.ts` (필요 시)

**Interfaces:**
- Consumes: 없음
- Produces: 없음

사용처: `src/features/landing/hooks/useEarth.ts` — `createGlobe(canvas, options)` 기본 export, `onRender(state)` 콜백, 반환값 `.destroy()`.

- [ ] **Step 1: 설치**

```bash
npm install cobe@2.0.1
```

- [ ] **Step 2: 빌드 게이트**

Run: `npm run build`
Expected: 성공. `createGlobe` 옵션 키나 `state` 필드(`state.phi`, `state.width`, `state.height`)가 2.0에서 바뀌었으면 빌드/타입 오류로 드러난다 — `useEarth.ts`만 새 시그니처에 맞게 수정.

- [ ] **Step 3: 테스트 게이트**

Run: `npm test`
Expected: 통과

- [ ] **Step 4: 수동 스모크 (지구본 렌더 확인)**

Run: `npm run dev` → 랜딩의 3D 지구본이 렌더되고 포인터 드래그로 회전하는지 확인.
Expected: 지구본 정상 렌더 + 상호작용 동작. (렌더 깨짐 시 옵션 변경 재대응)

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "chore: upgrade cobe 0.6 -> 2.0 and adapt useEarth"
```

---

### Task 9: 최종 검증 + 문서 갱신

**Files:**
- Modify: `README.md` (기술 스택 버전 표기)

**Interfaces:**
- Consumes: 모든 이전 태스크
- Produces: Phase 0 완료 상태

- [ ] **Step 1: 클린 설치 + 전체 빌드**

```bash
rm -rf node_modules .next
npm install
npm run build
```
Expected: 설치·빌드 성공

- [ ] **Step 2: 전체 테스트 + lint**

Run: `npm test && npm run lint`
Expected: 테스트 통과(베이스라인 개수 이상), lint 통과

- [ ] **Step 3: 전체 수동 스모크**

Run: `npm run dev` → 랜딩 렌더 / 지구본 / 캐러셀 / 트랙 재생 / 아이콘 표시 종합 확인.
Expected: 전 기능 정상.

- [ ] **Step 4: README 기술 스택 버전 갱신**

`README.md`의 기술 스택 항목에 업그레이드된 버전(Next 16, React 19.2, TS 6, Tailwind 4.3 등)을 반영한다.

- [ ] **Step 5: 커밋**

```bash
git add README.md
git commit -m "docs: update tech stack versions after phase0 upgrade"
```

- [ ] **Step 6: Phase 0 완료 — finishing-a-development-branch 스킬로 통합 방식 결정**

`chore/phase0-toolchain` 브랜치를 master에 병합할지(또는 PR) `superpowers:finishing-a-development-branch` 스킬로 결정한다.

---

## Self-Review

**1. Spec 커버리지** (설계서 §3 0단계 대비):
- §3.1 업그레이드 매핑 → Task 1~8 전부 커버.
- §3.2 진행 순서(죽은 의존성 제거 → 마이너 → 메이저 1건씩) → Task 1~8 순서 일치. (스펙의 kakao-js-sdk 즉시 제거는 사용처가 살아있어 빌드가 깨지므로 본 계획에서 **auth 제거 단계로 연기**하도록 정정 — Global Constraints에 명시.)
- §3.3 검증 게이트(build/test/스모크) → 모든 태스크 + Task 9에 반영.

**2. Placeholder 스캔:** "TBD/TODO/적절히 처리" 류 없음. 업그레이드 특성상 일부 수정은 "빌드/타입 출력에 따라 해당 파일만 수정"으로 명시 — 이는 의존성 업그레이드의 정당한 검증 방식(런타임 발견형)이며, 대상 파일 경로와 판단 기준(빌드/테스트 게이트)을 구체적으로 제시함.

**3. 타입/명칭 일관성:** 패키지명·버전·파일 경로(`useEarth.ts`, `horizontalSwiper.tsx`, `next.config.ts`, `eslint.config.mjs`)는 코드베이스 실경로와 일치.

**범위 주의:** 이 계획은 **0단계 전용**이다. 1~6단계(Audius/Dexie 전환, 라우트, 플레이어, 오디오 엔진, 성능, Supabase/Cloudinary/Drizzle 제거)는 각각 별도 계획 문서로 작성한다.
