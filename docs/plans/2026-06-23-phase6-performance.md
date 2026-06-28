# Phase 6 — 성능 패스 (연출 지연 로딩 · 번들 축소 · 캐싱) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 무거운 랜딩 연출(cobe 지구본·lenis·lottie·다중 패럴랙스)을 지연 로딩/1회화하고, 외부 API 캐싱과 이미지 최적화를 정비해 초기 로딩 성능을 개선한다.

**Architecture:** 연출 컴포넌트는 `next/dynamic`(`ssr: false`)로 분리하고 `IntersectionObserver`로 뷰포트 진입 시에만 마운트한다. 인트로는 `sessionStorage`로 세션당 1회만 재생. TanStack Query 캐싱을 소스별로 튜닝하고 `trackCache`(Dexie)로 재방문을 가속한다.

**Tech Stack:** Next 16, React 19, framer-motion, cobe, TanStack Query 5, Dexie, next/image.

## Global Constraints

- 매 태스크 종료 시 `npm run build` 성공 + `npm test` 통과.
- **선행 조건**: Phase 1~5 완료(라우트/플레이어/레거시 제거가 끝난 상태).
- 동작(렌더 결과·상호작용)은 보존하고 **로딩 방식만** 바꾼다 — 지구본/스노우/인트로의 시각적 결과는 동일해야 한다.
- 측정 기반으로 진행: 변경 전후 `next build` 출력의 First Load JS(라우트별 번들)와, 가능하면 Lighthouse 수치를 기록해 회귀가 아닌 개선임을 확인한다.
- 단위 테스트가 어려운 시각 효과는 "마운트 트리거 로직"(IntersectionObserver 훅, sessionStorage 가드)을 분리해 테스트한다.

---

## File Structure

- Create: `src/shared/hooks/useInView.ts` — IntersectionObserver 기반 가시성 훅
- Create: `src/shared/hooks/useOncePerSession.ts` — sessionStorage 1회 가드
- Create: `src/features/landing/components/earthLazy.tsx` — dynamic import 래퍼
- Modify: `src/features/landing/components/intro.tsx` — 세션 1회화
- Modify: `src/features/landing/ui/landingWrapper.tsx` — DustySnow/Intro 지연 마운트
- Modify: `src/widgets/landing/index.tsx` — 연출 dynamic import 정리
- Modify: `src/features/discover/hooks/useTrending.ts` 외 query 훅 — staleTime/gcTime 튜닝
- Modify: `next.config.ts` — 번들 분할/이미지 호스트 점검
- Test: `src/test/shared/hooks/useInView.test.tsx`, `useOncePerSession.test.ts`

---

### Task 1: useOncePerSession 훅 (인트로 1회화 토대)

**Files:**
- Create: `src/shared/hooks/useOncePerSession.ts`
- Test: `src/test/shared/hooks/useOncePerSession.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `function useOncePerSession(key: string): { shouldRun: boolean; markDone: () => void }`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/test/shared/hooks/useOncePerSession.test.ts
import { renderHook, act } from "@testing-library/react";
import { useOncePerSession } from "@/shared/hooks/useOncePerSession";

beforeEach(() => window.sessionStorage.clear());

it("shouldRun is true first time, false after markDone", () => {
  const { result, rerender } = renderHook(() => useOncePerSession("intro"));
  expect(result.current.shouldRun).toBe(true);
  act(() => result.current.markDone());
  rerender();
  const second = renderHook(() => useOncePerSession("intro"));
  expect(second.result.current.shouldRun).toBe(false);
});
```
> 참고: `jest.setup.js`의 sessionStorage mock을 실제 저장 동작으로 보강(`Map` 기반)하거나 본 테스트에서 실제 구현으로 교체한다.

- [ ] **Step 2: 실패 확인** — Run: `npm test -- useOncePerSession.test.ts` → FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/shared/hooks/useOncePerSession.ts
"use client";
import { useState, useCallback } from "react";

export function useOncePerSession(key: string) {
  const storageKey = `edmm:once:${key}`;
  const [shouldRun] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(storageKey) !== "1";
  });
  const markDone = useCallback(() => {
    if (typeof window !== "undefined") window.sessionStorage.setItem(storageKey, "1");
  }, [storageKey]);
  return { shouldRun, markDone };
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- useOncePerSession.test.ts` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/hooks/useOncePerSession.ts src/test/shared/hooks/useOncePerSession.test.ts
git commit -m "feat(perf): add useOncePerSession hook"
```

---

### Task 2: useInView 훅 (지연 마운트 토대)

**Files:**
- Create: `src/shared/hooks/useInView.ts`
- Test: `src/test/shared/hooks/useInView.test.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: `function useInView<T extends Element>(options?: IntersectionObserverInit): { ref: RefObject<T | null>; inView: boolean }`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/shared/hooks/useInView.test.tsx
import { renderHook } from "@testing-library/react";
import { useInView } from "@/shared/hooks/useInView";

it("returns a ref and initial inView=false", () => {
  const { result } = renderHook(() => useInView<HTMLDivElement>());
  expect(result.current.inView).toBe(false);
  expect(result.current.ref).toHaveProperty("current");
});
```
> `jest.setup.js`의 IntersectionObserver mock이 콜백을 저장만 하므로 초기 상태(false)를 검증한다.

- [ ] **Step 2: 실패 확인** — Run: `npm test -- useInView.test.tsx` → FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/shared/hooks/useInView.ts
"use client";
import { useEffect, useRef, useState, RefObject } from "react";

export function useInView<T extends Element>(options?: IntersectionObserverInit): {
  ref: RefObject<T | null>; inView: boolean;
} {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, options);
    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);
  return { ref, inView };
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- useInView.test.tsx` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/hooks/useInView.ts src/test/shared/hooks/useInView.test.tsx
git commit -m "feat(perf): add useInView hook"
```

---

### Task 3: 3D 지구본 dynamic import + 가시성 지연 마운트

**Files:**
- Create: `src/features/landing/components/earthLazy.tsx`
- Modify: `src/features/landing/components/earth.tsx` 사용처 → `EarthLazy`로 교체
- Test: `src/test/features/landing/earthLazy.test.tsx`

**Interfaces:**
- Consumes: `useInView` (Task2), 기존 `earth.tsx`(cobe `useEarth`)
- Produces: `EarthLazy` — 뷰포트 진입 시에만 `next/dynamic(ssr:false)`로 Earth를 로드

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/features/landing/earthLazy.test.tsx
import { render, screen } from "@testing-library/react";
import EarthLazy from "@/features/landing/components/earthLazy";

it("renders a placeholder container before in view", () => {
  render(<EarthLazy />);
  expect(screen.getByTestId("earth-slot")).toBeInTheDocument();
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- earthLazy.test.tsx` → FAIL

- [ ] **Step 3: 최소 구현**

```tsx
// src/features/landing/components/earthLazy.tsx
"use client";
import dynamic from "next/dynamic";
import { useInView } from "@/shared/hooks/useInView";

const Earth = dynamic(() => import("./earth"), { ssr: false, loading: () => null });

export default function EarthLazy() {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "200px" });
  return (
    <div ref={ref} data-testid="earth-slot">
      {inView ? <Earth /> : null}
    </div>
  );
}
```
기존에 `Earth`를 직접 렌더하던 곳을 `EarthLazy`로 교체한다(시각 결과 동일, 로드만 지연).

- [ ] **Step 4: 통과 확인** — Run: `npm test -- earthLazy.test.tsx` → PASS

- [ ] **Step 5: 빌드 게이트 (번들 분리 확인)**

Run: `npm run build`
Expected: 성공. cobe가 별도 청크로 분리되어 홈 First Load JS가 감소했는지 빌드 출력으로 확인·기록.

- [ ] **Step 6: 커밋**

```bash
git add src/features/landing/components/earthLazy.tsx src/test/features/landing/earthLazy.test.tsx
git commit -m "perf: lazy-load 3D globe via dynamic import + in-view mount"
```

---

### Task 4: 인트로 세션 1회화 + DustySnow 지연

**Files:**
- Modify: `src/features/landing/components/intro.tsx`
- Modify: `src/features/landing/ui/landingWrapper.tsx`
- Test: `src/test/features/landing/intro.test.tsx`

**Interfaces:**
- Consumes: `useOncePerSession` (Task1)
- Produces: 인트로가 세션당 1회만 렌더

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/features/landing/intro.test.tsx
import { render } from "@testing-library/react";
import Intro from "@/features/landing/components/intro";

beforeEach(() => window.sessionStorage.clear());

it("does not render intro content when already seen this session", () => {
  window.sessionStorage.setItem("edmm:once:intro", "1");
  const { container } = render(<Intro />);
  expect(container.querySelector("[data-testid='intro-root']")).toBeNull();
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- intro.test.tsx` → FAIL

- [ ] **Step 3: 최소 구현**

`intro.tsx` 상단에서 가드:
```tsx
const { shouldRun, markDone } = useOncePerSession("intro");
// 애니메이션 onComplete(또는 mount effect)에서 markDone() 호출
if (!shouldRun) return null;
// 최상위 래퍼에 data-testid="intro-root" 부여
```
`landingWrapper.tsx`의 `<DustySnow />`는 `useInView`로 감싸 첫 뷰포트에서만 마운트(시각 결과 보존, 초기 비용 감소).

- [ ] **Step 4: 통과 확인** — Run: `npm test -- intro.test.tsx` → PASS

- [ ] **Step 5: 빌드 게이트** — Run: `npm run build` → 성공

- [ ] **Step 6: 커밋**

```bash
git add src/features/landing/components/intro.tsx src/features/landing/ui/landingWrapper.tsx src/test/features/landing/intro.test.tsx
git commit -m "perf: render intro once per session and defer dusty snow"
```

---

### Task 5: 쿼리 캐싱 튜닝 + trackCache 우선 표시

**Files:**
- Modify: `src/features/discover/hooks/useTrending.ts`, `src/features/search/hooks/useTrackSearch.ts`, `src/features/lyrics/hooks/useLyrics.ts`
- Modify: `src/shared/providers`의 QueryClient 기본 옵션(있는 위치)
- Test: `src/test/features/discover/useTrending.cache.test.tsx`

**Interfaces:**
- Consumes: TanStack Query, `getCachedTracks` (Phase 2)
- Produces: 소스별 staleTime/gcTime 적용된 훅, QueryClient 기본값

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/features/discover/useTrending.cache.test.tsx
import { useTrending } from "@/features/discover/hooks/useTrending";
// 동일 queryKey로 두 번 호출 시 fetch가 1회만 일어나는지(staleTime 내) 검증
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const fetchMock = jest.fn(async () => ({ ok: true, json: async () => [] }));
global.fetch = fetchMock as any;

it("does not refetch within staleTime", async () => {
  const client = new QueryClient();
  const wrapper = ({ children }: any) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const a = renderHook(() => useTrending(), { wrapper });
  await waitFor(() => expect(a.result.current.isSuccess).toBe(true));
  renderHook(() => useTrending(), { wrapper });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- useTrending.cache.test.tsx` → FAIL (또는 staleTime 미설정으로 2회 호출)

- [ ] **Step 3: 최소 구현**

QueryClient 기본 옵션(provider 위치)에 `staleTime: 60_000, gcTime: 5*60_000` 설정. 각 훅의 staleTime을 소스 특성에 맞게 유지(trending 5분, search 1분, lyrics Infinity — Phase 1에서 설정됨). 보관함/상세는 `getCachedTracks`로 우선 표시 후 갱신.

- [ ] **Step 4: 통과 확인** — Run: `npm test -- useTrending.cache.test.tsx` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/features src/shared/providers src/test/features/discover/useTrending.cache.test.tsx
git commit -m "perf: tune query caching defaults and prefer trackCache"
```

---

### Task 6: 번들/이미지 점검 + 최종 측정

**Files:**
- Modify: `next.config.ts` (필요 시 번들 분할/이미지 호스트)
- Modify: 큰 이미지 사용처 — `next/image` 적용 확인

**Interfaces:**
- Consumes: 없음
- Produces: 최종 번들/이미지 최적화

- [ ] **Step 1: 변경 전 측정 기록**

Run: `npm run build`
Expected: 라우트별 First Load JS를 기록(기준선).

- [ ] **Step 2: 이미지 최적화 점검**

아트워크/배경 이미지가 `next/image`로 렌더되는지 확인하고, `next.config.ts`의 `images.remotePatterns`에 Audius/Deezer 아트워크 호스트가 포함됐는지 확인(미포함 시 추가).

- [ ] **Step 3: 번들 분할 점검**

`next.config.ts`의 커스텀 번들 설정(Phase 0에서 webpack→turbopack 정리된 상태)을 검토하고, 무거운 라이브러리(cobe/lottie/swiper)가 라우트 청크에서 분리되는지 빌드 출력으로 확인.

- [ ] **Step 4: 최종 빌드/테스트/스모크 + 측정 비교**

```bash
npm run build && npm test
```
Expected: 성공/통과. 홈 First Load JS가 Phase 6 시작 전 대비 감소했음을 기록. `npm run dev`로 지구본/인트로/스노우 시각 결과가 보존됐는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "perf: finalize bundle/image optimization and record measurements"
```

- [ ] **Step 6: 개편 완료 — finishing-a-development-branch**

전체 개편(Phase 0~6) 완료. `superpowers:finishing-a-development-branch` 스킬로 통합/PR 방식을 결정한다.

---

## Self-Review

**1. Spec 커버리지** (설계서 §10 성능 설계): 연출 dynamic import + IntersectionObserver 지연(Task2,3,4) + 인트로 sessionStorage 1회화(Task1,4) → 커버; 라우트 분리는 Phase 3에서 완료, 본 단계는 연출 청크 분리(Task3,6); query staleTime/gcTime + trackCache(Task5); next/image(Task6).
**2. Placeholder 스캔:** 토대 훅(Task1,2)과 적용(Task3~6)에 실제 코드 포함. Task6는 "측정→점검→비교"의 성능 작업 특성상 측정 기준과 확인 항목을 구체화 — placeholder 아님.
**3. 타입/명칭 일관성:** `useInView`/`useOncePerSession` 시그니처가 Task1,2 정의 → Task3,4 사용에서 일치. `getCachedTracks`(Phase 2), query 훅(Phase 1) 시그니처와 정합. 연출 컴포넌트 경로(`earth.tsx`, `intro.tsx`, `landingWrapper.tsx`, `dustySnow`)는 코드베이스 실경로와 일치.

**범위 주의:** Phase 6 전용. Phase 1~5 완료가 선행 조건.
