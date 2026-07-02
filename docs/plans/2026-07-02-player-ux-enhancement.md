# 플레이어 UX 고도화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 데스크톱/태블릿 플레이어의 seek 바(호버 프리뷰·thumb·드래그), 컨트롤 버튼 상태 체계, 단축키 포커스 차단, 풀스크린 fade on/off, 트랙 전환 아트워크 스냅 아웃을 구현한다.

**Architecture:** 스펙 `docs/specs/2026-07-02-player-ux-enhancement-design.md` 기반. 새 `SeekBar` 컴포넌트(Pointer Events)와 `useFadePresence` 훅을 신설하고, 공유 버튼 베이스는 opt-in prop으로만 확장한다. 전역 상태(`audioPlayerProvider`)는 소비만 하고 수정하지 않는다.

**Tech Stack:** Next.js 16 / React 19 / Tailwind v4 / Jest + Testing Library. 애니메이션은 CSS transition만 사용 (framer-motion이 의존성에 있으나 기존 crossfade 패턴과의 일관성을 위해 미사용).

## Global Constraints

- **커밋 금지**: 커밋은 사용자가 명시적으로 지시할 때만. 각 Task는 테스트 통과 확인 후 보고로 종료.
- **모바일 무영향**: `m_*`, `mobileFullscreenPlayer`, `mobileAudioPlayer`는 수정 금지. 공유 컴포넌트(`playerControlBtn`, `iconToggleButton`)의 동작 변경은 전부 opt-in prop (기본값 = 현행 동작).
- **전역 상태 불변**: `audioPlayerProvider`, `audioPlayerTypes.ts` 수정 금지. `seek(time)` 등 기존 액션만 소비.
- **공유 유틸 시그니처 동결**: `shared/lib/util.ts` 기존 함수의 시그니처·동작 변경 금지 (사용처가 0이 된 함수의 삭제는 허용).
- **뷰포트 경계**: `FULLSCREEN_VIEWPORT_QUERY`(`min-width: 768px`) 변경 금지.
- **매 Task 완료 조건**: `npm test` 전체 통과 (모바일 테스트 포함).
- 색상 토큰: 브랜드 핑크 `#fd6d94`, 밝은 핑크(hover) `#ff9ab5`.
- `prefers-reduced-motion: reduce` 시 모든 신규 fade 생략(즉시 전환).

## 스펙 미해결 질문 확정 (스펙 §6 → 사용자 승인 완료, 2026-07-02)

1. **아트워크 fade-in 시간**: 280ms로 시작 (`ARTWORK_FADE_MS` 상수 — 수동 QA에서 튜닝 용이)
2. **`disabled:pointer-events-none` 제거 여부**: **유지**. 제거 시 disabled 상태의 커서/이벤트 처리가 모바일 사용처까지 파급되므로, disabled 버튼 툴팁은 이번 범위에서 포기 (모바일 무영향 원칙 우선)
3. **볼륨 슬라이더(D2) 편입 여부**: 본격 고도화(호버 thumb 등)는 보류 유지. 단 Task 3에서 mute 버튼 blur/press와 range 드래그 후 blur만 포함 (단축키 복원과 직결되는 최소 범위)

---

## 파일 구조 개요

| 파일 | 작업 |
|------|------|
| `src/shared/components/trackSeekBar.tsx` | **삭제** (Task 1, dead code) |
| `src/features/audio/components/seekBar.tsx` | **신설** — 호버/드래그/thumb/툴팁 일체형 슬라이더 (Task 2) |
| `src/features/audio/components/playerTrackDetails.tsx` | SeekBar 사용으로 교체, props 축소 (Task 2) |
| `src/features/audio/ui/audioPlayer.tsx` | props 정리 (Task 2), fade 래퍼 (Task 5) |
| `src/shared/styles/global.css` | `#seek-bar-container::before`, `#seek-time::before` 규칙 삭제 (Task 2) |
| `src/shared/components/playerControlBtn.tsx` | opt-in props: `hoverSurface`/`pressFeedback`/`blurOnPointerClick` (Task 3) |
| `src/shared/components/iconToggleButton.tsx` | 신규 props + `title` 패스스루 (Task 3) |
| `src/features/audio/components/playerControlsSection.tsx` | 데스크톱 소비처 opt-in 적용, shuffle dot, play scale (Task 3, 4) |
| `src/features/audio/hooks/useAudioKeyboardShortcuts.ts` | 차단 레벨(`all`/`arrows`/`none`) 재설계 (Task 4) |
| `src/shared/hooks/useFadePresence.ts` | **신설** — mount/visible fade 상태 훅 (Task 5) |
| `src/features/audio/components/desktopFullscreenPlayer.tsx` | 아트워크 top-layer 단독 렌더 + 페이드 분리 (Task 6) |
| `src/features/audio/hooks/useArtworkCrossfade.ts` | **수정 없음** (렌더 측만 변경) |

---

### Task 1: dead code 제거 — trackSeekBar

**Files:**
- Delete: `src/shared/components/trackSeekBar.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: 없음 (Task 2가 "seek 바 구현은 `playerTrackDetails.tsx` 한 곳뿐"이라는 전제를 사용)

- [ ] **Step 1: 사용처 0 재확인**

Run: `npx rg -l "trackSeekBar|TrackSeekBar" src --glob "!src/shared/components/trackSeekBar.tsx"`
Expected: 출력 없음 (exit 1). 출력이 있으면 **중단하고 보고**.

- [ ] **Step 2: 파일 삭제**

`src/shared/components/trackSeekBar.tsx` 삭제.

- [ ] **Step 3: 전체 테스트 + 타입 체크**

Run: `npm test` → PASS. Run: `npx tsc --noEmit` → 에러 없음.

- [ ] **Step 4: 보고** (커밋하지 않음 — 사용자 지시 대기)

---

### Task 2: SeekBar 컴포넌트 — 호버 프리뷰 · thumb · 드래그 seek

**Files:**
- Create: `src/features/audio/components/seekBar.tsx`
- Modify: `src/features/audio/components/playerTrackDetails.tsx` (seek 섹션 교체, props 축소)
- Modify: `src/features/audio/ui/audioPlayer.tsx:46,177-185` (`seekBarContainerRef`·`currentProgress`·`isPlaying` prop 제거)
- Modify: `src/shared/styles/global.css:579-594` (`#seek-bar-container::before`, `#seek-time::before` 삭제)
- Test: `src/test/features/audio/seekBar.test.tsx` (신규)

**Interfaces:**
- Consumes: `useAudioPlayer().seek(time: number)` (provider 기존 액션), `formatTime(seconds: number): string` (`@/shared/lib/util`)
- Produces: `SeekBar` — `{ currentTime: number; duration: number; seek: (time: number) => void }` props. `role="slider"`, `aria-valuenow`(드래그 중엔 프리뷰 값) 유지. `PlayerTrackDetails` props는 `{ currentTime; duration; seek; currentTrackInfo? }`로 축소됨 — audioPlayer.tsx 호출부도 이 시그니처 사용.

**동작 계약 (스펙 §3.4)**
- 레이어(아래→위): 트랙 `bg-white/15` → 호버 프리뷰 `bg-white/25`(커서 위치까지) → 재생 완료 바(기본 `bg-white`, 호버/드래그 시 `#fd6d94`) → thumb(12px, 호버/드래그 시만 표시) → 시간 툴팁
- 드래그: pointerdown 캡처 → 시각 프리뷰만 이동(오디오 seek 없음, `timeupdate` 무시) → pointerup에서 `seek()` 1회 commit → Escape로 취소(캡처 단계 + `stopPropagation`으로 풀스크린 Escape와 충돌 방지 — 하단 바 z-70이 풀스크린 z-60 위에 있어 풀스크린 중에도 드래그 가능함)
- 드래그 중 재생 바 `transition-none` (지연감 제거)
- 히트 영역 `h-4`(16px), 시각 바 `h-2` 유지
- 키보드 좌우 화살표 ±5초 (현행 유지)
- jsdom 호환: `setPointerCapture?.(...)` 옵셔널 체이닝 가드 (mobileFullscreenPlayer 기존 패턴)

- [ ] **Step 1: 실패하는 테스트 작성** — `src/test/features/audio/seekBar.test.tsx`

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import SeekBar from "@/features/audio/components/seekBar";

const renderSeekBar = (overrides: Partial<{ currentTime: number; duration: number; seek: jest.Mock }> = {}) => {
  const seek = overrides.seek ?? jest.fn();
  render(
    <SeekBar
      currentTime={overrides.currentTime ?? 30}
      duration={overrides.duration ?? 120}
      seek={seek}
    />
  );
  const slider = screen.getByRole("slider", { name: "Seek slider" });
  jest.spyOn(slider, "getBoundingClientRect").mockReturnValue({
    left: 0, top: 0, right: 200, bottom: 16, width: 200, height: 16, x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect);
  return { slider, seek };
};

describe("SeekBar", () => {
  it("commits a single seek on pointer release at the drag position", () => {
    const { slider, seek } = renderSeekBar();

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 50 });
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 150 });
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 150 });

    expect(seek).toHaveBeenCalledTimes(1);
    expect(seek).toHaveBeenCalledWith(90); // 150/200 * 120s
  });

  it("shows drag preview in aria-valuenow without seeking mid-drag", () => {
    const { slider, seek } = renderSeekBar();

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 100 });
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 100 });

    expect(slider).toHaveAttribute("aria-valuenow", "60"); // 100/200 * 120s
    expect(seek).not.toHaveBeenCalled();
  });

  it("cancels the drag with Escape and reverts to playback position", () => {
    const { slider, seek } = renderSeekBar();

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 150 });
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 150 });

    expect(seek).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute("aria-valuenow", "30");
  });

  it("clamps drag beyond the bar to track bounds", () => {
    const { slider, seek } = renderSeekBar();

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 50 });
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 400 });

    expect(seek).toHaveBeenCalledWith(120);
  });

  it("keeps arrow-key seeking (±5s)", () => {
    const { slider, seek } = renderSeekBar();

    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });

    expect(seek).toHaveBeenNthCalledWith(1, 25);
    expect(seek).toHaveBeenNthCalledWith(2, 35);
  });

  it("does nothing without a duration", () => {
    const { slider, seek } = renderSeekBar({ duration: 0 });

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 50 });
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 50 });

    expect(seek).not.toHaveBeenCalled();
  });

  it("survives missing pointer capture APIs (jsdom)", () => {
    const { slider } = renderSeekBar();

    expect(() => {
      fireEvent.pointerDown(slider, { pointerId: 1, clientX: 50 });
      fireEvent.pointerUp(slider, { pointerId: 1, clientX: 50 });
    }).not.toThrow();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest src/test/features/audio/seekBar.test.tsx`
Expected: FAIL — "Cannot find module '@/features/audio/components/seekBar'"

- [ ] **Step 3: SeekBar 구현** — `src/features/audio/components/seekBar.tsx`

```tsx
"use client";

import React from "react";
import { formatTime } from "@/shared/lib/util";

interface SeekBarProps {
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
}

const clampFraction = (value: number) => Math.max(0, Math.min(1, value));

export default function SeekBar({ currentTime, duration, seek }: SeekBarProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragFraction, setDragFraction] = React.useState(0);

  const fractionFromPointer = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return clampFraction((clientX - rect.left) / rect.width);
  };

  const updateHoverPreview = (clientX: number) => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    const rect = container?.getBoundingClientRect();
    if (!container || !tooltip || !rect || !duration) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    container.style.setProperty("--seek-hover-x", `${x}px`);
    tooltip.style.left = `${x}px`;
    tooltip.style.opacity = "1";
    tooltip.textContent = formatTime((x / rect.width) * duration);
  };

  const hideHoverPreview = () => {
    containerRef.current?.style.setProperty("--seek-hover-x", "0px");
    if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!duration) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragFraction(fractionFromPointer(event.clientX));
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    updateHoverPreview(event.clientX);
    if (isDragging) setDragFraction(fractionFromPointer(event.clientX));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!isDragging || !duration) return;
    setIsDragging(false);
    seek(fractionFromPointer(event.clientX) * duration);
  };

  const handlePointerCancel = () => setIsDragging(false);

  // Escape → 드래그 취소. 캡처 단계 + stopPropagation으로 풀스크린의
  // window Escape 핸들러(닫기)가 드래그 취소와 동시에 발화하지 않게 한다.
  React.useEffect(() => {
    if (!isDragging) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [isDragging]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!duration) return;
    if (event.key === "ArrowLeft") {
      seek(Math.max(0, currentTime - 5));
    } else if (event.key === "ArrowRight") {
      seek(Math.min(duration, currentTime + 5));
    }
  };

  const playedFraction = isDragging
    ? dragFraction
    : duration > 0
      ? clampFraction(currentTime / duration)
      : 0;
  const playedPercent = playedFraction * 100;
  const shownTime = isDragging ? dragFraction * duration : currentTime;

  return (
    <div
      ref={containerRef}
      data-dragging={isDragging || undefined}
      className="group relative flex h-4 flex-grow cursor-pointer touch-none select-none items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fd6d94] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      role="slider"
      aria-label="Seek slider"
      aria-valuemin={0}
      aria-valuemax={duration || 0}
      aria-valuenow={Math.round(shownTime)}
      aria-valuetext={`${formatTime(shownTime)} of ${formatTime(duration)}`}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={hideHoverPreview}
      onKeyDown={handleKeyDown}
    >
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/15">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[var(--seek-hover-x,0px)] bg-white/25 opacity-0 transition-opacity group-hover:opacity-100 group-data-[dragging]:opacity-100"
        />
        <div
          aria-hidden="true"
          data-testid="seek-played-bar"
          className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-150 ease-out group-hover:bg-[#fd6d94] group-data-[dragging]:bg-[#fd6d94] group-data-[dragging]:transition-none"
          style={{ width: `${playedPercent}%` }}
        />
      </div>
      <div
        aria-hidden="true"
        data-testid="seek-thumb"
        className="absolute top-1/2 z-[1] h-3 w-3 -translate-x-1/2 -translate-y-1/2 scale-75 rounded-full bg-white opacity-0 shadow-[0_1px_4px_rgba(0,0,0,0.5)] transition-[opacity,transform] duration-[120ms] group-hover:scale-100 group-hover:opacity-100 group-data-[dragging]:scale-100 group-data-[dragging]:opacity-100"
        style={{ left: `${playedPercent}%` }}
      />
      <div
        ref={tooltipRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-5 z-10 -translate-x-1/2 rounded bg-black px-2 py-1 text-[12px] text-white opacity-0 shadow-lg transition-opacity"
      />
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx jest src/test/features/audio/seekBar.test.tsx` → PASS

- [ ] **Step 5: PlayerTrackDetails 교체** — `src/features/audio/components/playerTrackDetails.tsx`

파일 전체를 아래로 교체 (`PlayerTrackSummary`는 그대로 유지):

```tsx
import React from "react";
import type { Track } from "@/entities/track";
import { formatTime } from "@/shared/lib/util";
import SeekBar from "@/features/audio/components/seekBar";

interface PlayerTrackDetailsProps {
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  currentTrackInfo?: Track | null;
}

export const PlayerTrackSummary: React.FC<{
  currentTrackInfo: Track | null;
}> = ({ currentTrackInfo }) => {
  return (
    <section className="min-w-0 overflow-hidden" aria-label="Track Information">
      <div
        id="track-name"
        className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-white"
        title={currentTrackInfo?.title}
      >
        {currentTrackInfo?.title ?? "No track selected"}
      </div>
      <div
        id="producer-name"
        className="mt-0.5 w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-white/55"
        title={currentTrackInfo?.artistName}
      >
        {currentTrackInfo?.artistName ?? "Choose a song to start playback"}
      </div>
    </section>
  );
};

const PlayerTrackDetails: React.FC<PlayerTrackDetailsProps> = ({
  currentTime,
  duration,
  seek,
  currentTrackInfo,
}) => {
  return (
    <div
      id="player-track"
      aria-label={`${currentTrackInfo?.title ?? "Current track"} progress`}
      className="w-full space-y-1.5"
    >
      <div className="flex items-center justify-between px-1 text-[11px] font-black uppercase tracking-[0.12em] text-white/46">
        <span className="min-w-[2.5rem] text-right text-white/54">
          {formatTime(currentTime)}
        </span>
        <span aria-label="Track duration">{formatTime(duration)}</span>
      </div>

      <section
        id="track-time"
        className="flex w-full items-center gap-2"
        aria-label="Track progress"
      >
        <SeekBar currentTime={currentTime} duration={duration} seek={seek} />
      </section>
    </div>
  );
};

export default PlayerTrackDetails;
```

- [ ] **Step 6: audioPlayer.tsx 호출부 정리**

`src/features/audio/ui/audioPlayer.tsx`에서:
- `const seekBarContainerRef = useRef<HTMLDivElement>(null);` 줄 삭제 (import의 `useRef`가 다른 데서 안 쓰이면 정리 — `previousCurrentTrackIdRef`가 쓰므로 유지)
- `const currentProgress = duration > 0 ? (currentTime / duration) * 100 : 0;` 줄 삭제
- `<PlayerTrackDetails ...>` 호출을 아래로 교체:

```tsx
<PlayerTrackDetails
  currentTime={currentTime}
  duration={duration}
  seek={seek}
  currentTrackInfo={currentTrack}
/>
```

- [ ] **Step 7: global.css 규칙 삭제**

`src/shared/styles/global.css`에서 `#seek-bar-container::before { ... }` 블록(579-590행 부근)과 `#seek-time::before { ... }` 블록(592-594행 부근) 삭제. 삭제 전 확인:

Run: `npx rg -l "seek-bar-container|seek-time" src --glob "!src/shared/styles/global.css"`
Expected: 출력 없음 (Task 1에서 trackSeekBar 삭제, Step 5에서 playerTrackDetails 교체 완료 상태이므로)

- [ ] **Step 8: 미사용 util 정리 (조건부)**

Run: `npx rg -n "handleMouseMove|handleMouseOut|handleSeekMouseMove|handleSeek\b" src --glob "!src/shared/lib/util.ts"`
출력이 없으면 `src/shared/lib/util.ts`에서 해당 함수들 삭제 (`formatTime`, `CLAMP_VOLUME`은 사용 중 — 유지). 출력이 있으면 그대로 둔다.

- [ ] **Step 9: 전체 테스트 + 타입 체크**

Run: `npm test` → PASS (특히 `audioPlayer.test.tsx`의 "renders player content..." — 새 SeekBar가 `role="slider"` + `aria-valuenow`를 유지하므로 통과해야 함. `name: "Seek slider"`로 조회하는 부분과 충돌 없는지 확인. 실패 시 해당 테스트의 조회 방식만 새 구조에 맞게 갱신하고 검증 의도는 유지)
Run: `npx tsc --noEmit` → 에러 없음

- [ ] **Step 10: 보고** (커밋하지 않음)

---

### Task 3: 컨트롤 버튼 상태 체계 — opt-in props

**Files:**
- Modify: `src/shared/components/playerControlBtn.tsx`
- Modify: `src/shared/components/iconToggleButton.tsx`
- Modify: `src/features/audio/components/playerControlsSection.tsx`
- Test: `src/test/shared/components/playerControlButton.test.tsx` (추가)

**Interfaces:**
- Consumes: 없음
- Produces: `PlayerControlButtonProps = ButtonHTMLAttributes & { hoverSurface?: boolean (기본 true); pressFeedback?: boolean (기본 false); blurOnPointerClick?: boolean (기본 false) }`. `IconToggleButton`에 동일 3개 prop + `title?: string` 패스스루 추가. **기본값이 전부 현행 동작이므로 모바일 사용처는 무변경.** Task 4가 `blurOnPointerClick`을 소비.

- [ ] **Step 1: 실패하는 테스트 추가** — `src/test/shared/components/playerControlButton.test.tsx`에 추가:

```tsx
it("applies cursor-pointer by default", () => {
  render(<PlayerControlButton aria-label="Cursor check" />);
  expect(screen.getByRole("button", { name: "Cursor check" })).toHaveClass("cursor-pointer");
});

it("keeps the hover surface by default and removes it when opted out", () => {
  render(
    <>
      <PlayerControlButton aria-label="Default surface" />
      <PlayerControlButton aria-label="No surface" hoverSurface={false} />
    </>
  );
  expect(screen.getByRole("button", { name: "Default surface" })).toHaveClass("hover:bg-white/10");
  expect(screen.getByRole("button", { name: "No surface" })).not.toHaveClass("hover:bg-white/10");
});

it("blurs after a pointer click only when opted in", () => {
  const onClick = jest.fn();
  render(
    <PlayerControlButton aria-label="Blurring" blurOnPointerClick onClick={onClick} />
  );
  const button = screen.getByRole("button", { name: "Blurring" });
  button.focus();
  // detail > 0 → 포인터 유래 클릭
  fireEvent.click(button, { detail: 1 });
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(button).not.toHaveFocus();
});

it("keeps focus on keyboard activation even with blurOnPointerClick", () => {
  render(<PlayerControlButton aria-label="Keyboard" blurOnPointerClick />);
  const button = screen.getByRole("button", { name: "Keyboard" });
  button.focus();
  fireEvent.click(button, { detail: 0 }); // Enter/Space 활성화는 detail 0
  expect(button).toHaveFocus();
});
```

(파일 상단 import에 `fireEvent` 추가: `import { fireEvent, render, screen } from "@testing-library/react";`)

- [ ] **Step 2: 실패 확인**

Run: `npx jest src/test/shared/components/playerControlButton.test.tsx`
Expected: FAIL (cursor-pointer 클래스 없음 등)

- [ ] **Step 3: PlayerControlButton 구현** — `src/shared/components/playerControlBtn.tsx` 전체 교체:

```tsx
import React from "react";
import clsx from "clsx";

export interface PlayerControlButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** hover 시 반투명 배경 원. 기본 true = 현행 동작 (모바일 사용처 무변경) */
  hoverSurface?: boolean;
  /** press 시 scale-down 피드백. 데스크톱 사용처에서만 opt-in */
  pressFeedback?: boolean;
  /** 포인터 클릭 후 포커스 해제 → 전역 재생 단축키 복원. 키보드 활성화(detail 0)는 포커스 유지 */
  blurOnPointerClick?: boolean;
}

export const PlayerControlButton: React.FC<
  React.PropsWithChildren<PlayerControlButtonProps>
> = ({
  children,
  className,
  hoverSurface = true,
  pressFeedback = false,
  blurOnPointerClick = false,
  onClick,
  ...props
}) => {
  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    if (blurOnPointerClick && event.detail > 0) {
      event.currentTarget.blur();
    }
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      className={clsx(
        "cursor-pointer rounded-full p-2 transition-[color,background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd6d94] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-40",
        hoverSurface && "hover:bg-white/10",
        pressFeedback && "active:scale-95",
        className
      )}
    >
      {children}
    </button>
  );
};
```

(주의: `transition-colors` → `transition-[color,background-color,transform]`로 변경해 scale 피드백도 같은 트랜지션을 타게 함. transform은 pressFeedback/scale 미사용 시 변화가 없으므로 모바일 시각 무영향)

- [ ] **Step 4: IconToggleButton 패스스루** — `src/shared/components/iconToggleButton.tsx`:

인터페이스에 추가:

```tsx
interface IconToggleButtonProps {
  id: string;
  condition: boolean;
  IconOnTrue: React.ComponentType<LucideProps>;
  IconOnFalse: React.ComponentType<LucideProps>;
  onClick: () => void | Promise<void>;
  label: string;
  iconProps?: React.SVGProps<SVGSVGElement>;
  className?: string;
  disabled?: boolean;
  title?: string;
  hoverSurface?: boolean;
  pressFeedback?: boolean;
  blurOnPointerClick?: boolean;
}
```

컴포넌트에서 구조분해 후 `PlayerControlButton`에 전달:

```tsx
    <PlayerControlButton
      id={id}
      onClick={onClick}
      aria-label={label}
      title={title}
      className={className}
      disabled={disabled}
      hoverSurface={hoverSurface}
      pressFeedback={pressFeedback}
      blurOnPointerClick={blurOnPointerClick}
    >
```

(기본값을 지정하지 않고 undefined 전달 → `PlayerControlButton`의 기본값 사용. 모바일 호출부 무변경)

- [ ] **Step 5: 데스크톱 소비처 적용** — `src/features/audio/components/playerControlsSection.tsx`

각 버튼에 아래 변경 (구조는 유지, props/클래스만):

```tsx
{/* shuffle: 활성 dot + on상태 hover 밝은 핑크 */}
<PlayerControlButton
  id="shuffle"
  onClick={toggleShuffle}
  aria-label={isShuffleEnabled ? "Disable shuffle playback" : "Enable shuffle playback"}
  title={isShuffleEnabled ? "Shuffle on" : "Shuffle off"}
  pressFeedback
  blurOnPointerClick
  className={`relative h-9 w-9 ${
    isShuffleEnabled
      ? "text-[#fd6d94] hover:text-[#ff9ab5]"
      : "text-white/60 hover:text-white"
  }`}
  disabled={!hasPlayableTrack}
>
  <Shuffle
    className="m-auto block transition-colors duration-200 ease-out"
    width={17}
    fill="currentColor"
    aria-hidden="true"
  />
  {isShuffleEnabled ? (
    <span
      data-testid="shuffle-active-dot"
      aria-hidden="true"
      className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#fd6d94]"
    />
  ) : null}
</PlayerControlButton>

{/* prev / next: title + press + blur 추가 */}
<PlayerControlButton
  id="play-previous"
  onClick={prevTrack}
  aria-label="Previous track"
  title="Previous track"
  pressFeedback
  blurOnPointerClick
  className="h-10 w-10 text-white/70 hover:text-white"
  disabled={!hasPlayableQueue}
>
  <SkipBack
    className="m-auto block transition-colors duration-200 ease-out"
    width={20}
    fill="currentColor"
    aria-hidden="true"
  />
</PlayerControlButton>

<PlayerControlButton
  id="play-next"
  onClick={nextTrack}
  aria-label="Next track"
  title="Next track"
  pressFeedback
  blurOnPointerClick
  className="h-10 w-10 text-white/70 hover:text-white"
  disabled={!hasPlayableQueue}
>
  <SkipForward
    className="m-auto block transition-colors duration-200 ease-out"
    width={20}
    fill="currentColor"
    aria-hidden="true"
  />
</PlayerControlButton>

{/* play/pause: hover bg 충돌 제거 → scale 피드백으로 대체 */}
<IconToggleButton
  id="play-pause"
  condition={isPlaying}
  IconOnTrue={Pause}
  IconOnFalse={Play}
  onClick={togglePlayPause}
  label={playPauseLabel}
  title={playPauseLabel}
  hoverSurface={false}
  pressFeedback
  blurOnPointerClick
  className="bg-white text-black hover:scale-105"
  disabled={!hasPlayableTrack}
  iconProps={{ width: 22, height: 22, fill: "currentColor", className: "text-black" }}
/>

{/* fullscreen-toggle: 기존 aria-label/title/아이콘 유지, 아래 두 prop만 추가 */}
<PlayerControlButton
  id="fullscreen-toggle"
  onClick={handleFullscreenClick}
  aria-label={fullscreenLabel}
  title={fullscreenTitle}
  pressFeedback
  blurOnPointerClick
  className="ml-auto grid h-9 w-9 text-white/60 hover:text-white"
>
  <FullscreenIcon
    className="m-auto block transition-colors duration-200 ease-out"
    width={18}
    height={18}
    fill="currentColor"
    aria-hidden="true"
  />
</PlayerControlButton>
```

`PlayerVolumeControls`의 mute 버튼:

```tsx
<IconToggleButton
  id="volume-control"
  condition={isMuted}
  IconOnTrue={VolumeX}
  IconOnFalse={Volume2}
  onClick={toggleMute}
  label={muteLabel}
  title={muteLabel}
  pressFeedback
  blurOnPointerClick
  className="h-9 w-9 text-white/70 hover:text-white"
  iconProps={{ width: 20, height: 20, fill: "none", strokeWidth: 2.2, className: "text-current" }}
/>
```

볼륨 range 슬라이더: 드래그 종료 후 포커스가 range에 남아 화살표 단축키(볼륨 미세조절)가 range 네이티브 조작과 겹치지 않도록 blur 추가:

```tsx
onMouseUp={(event) => {
  handleVolumeChangeEnd(event);
  event.currentTarget.blur();
}}
onTouchEnd={handleVolumeChangeEnd}
```

(touch 쪽은 모바일 뷰가 아닌 태블릿 터치 대응이지만 blur 시 시각 변화가 없으므로 mouseUp만 적용해 위험 최소화)

- [ ] **Step 6: 테스트**

Run: `npx jest src/test/shared/components/playerControlButton.test.tsx` → PASS
Run: `npm test` → PASS (기존 `audioPlayer.test.tsx`의 버튼 name 조회들은 aria-label 불변이므로 통과 예상. shuffle dot 노출 여부는 `queryByTestId("shuffle-active-dot")`로 확인하는 테스트를 `audioPlayer.test.tsx`에 추가해도 좋음 — 선택)
Run: `npx tsc --noEmit` → 에러 없음

- [ ] **Step 7: 보고** (커밋하지 않음)

---

### Task 4: 단축키 차단 재설계 — 차단 레벨 `all` / `arrows` / `none`

**Files:**
- Modify: `src/features/audio/hooks/useAudioKeyboardShortcuts.ts:10-29,45-57`
- Test: `src/test/features/audio/audioKeyboardShortcuts.test.tsx` (하네스 확장 + 케이스 추가)

**Interfaces:**
- Consumes: Task 3의 `blurOnPointerClick` (이미 데스크톱 소비처에 적용됨 — 이 Task는 훅 쪽 차단 완화 담당)
- Produces: 없음 (훅 시그니처 불변)

**동작 계약 (스펙 §3.3)**
- `all` (전면 차단): 텍스트 입력(`input` 중 `type=range` 제외), `textarea`, `select`, `contenteditable`
- `arrows` (화살표만 차단): `input[type=range]`, `[role='slider']` — 위젯 고유 조작 보호. Space/N/P는 통과
- `none`: 그 외 전부. **버튼은 더 이상 차단하지 않음** (중복 활성화는 Task 3 blur가 방지)

- [ ] **Step 1: 실패하는 테스트 추가** — `audioKeyboardShortcuts.test.tsx`

하네스에 버튼 추가:

```tsx
function KeyboardShortcutHarness() {
  useAudioKeyboardShortcuts();

  return (
    <div>
      <input aria-label="Search catalog" />
      <div contentEditable role="textbox" aria-label="Editable title" />
      <div role="slider" aria-label="Custom progress" tabIndex={0} />
      <input type="range" aria-label="Native progress" />
      <button type="button" aria-label="Focused control">Control</button>
    </div>
  );
}
```

케이스 추가:

```tsx
it("allows playback shortcuts while a control button is focused", () => {
  const audioState = createAudioState();
  mockUseAudioPlayer.mockReturnValue(audioState);

  render(<KeyboardShortcutHarness />);
  const button = screen.getByRole("button", { name: "Focused control" });
  button.focus();

  fireEvent.keyDown(button, { code: "Space" });
  fireEvent.keyDown(button, { code: "KeyN" });

  expect(audioState.togglePlayPause).toHaveBeenCalledTimes(1);
  expect(audioState.nextTrack).toHaveBeenCalledTimes(1);
});

it("allows non-arrow shortcuts from sliders while blocking arrows", () => {
  const audioState = createAudioState();
  mockUseAudioPlayer.mockReturnValue(audioState);

  render(<KeyboardShortcutHarness />);
  const slider = screen.getByRole("slider", { name: "Custom progress" });

  fireEvent.keyDown(slider, { code: "Space" });
  fireEvent.keyDown(slider, { code: "ArrowRight" });
  fireEvent.keyDown(slider, { code: "ArrowUp" });

  expect(audioState.togglePlayPause).toHaveBeenCalledTimes(1);
  expect(audioState.seek).not.toHaveBeenCalled();
  expect(audioState.setVolume).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest src/test/features/audio/audioKeyboardShortcuts.test.tsx`
Expected: 신규 2개 FAIL (버튼/슬라이더에서 Space 차단됨), 기존 케이스 PASS

- [ ] **Step 3: 훅 구현** — `useAudioKeyboardShortcuts.ts`의 `isShortcutBlockedTarget`을 교체:

```ts
type ShortcutBlockLevel = "all" | "arrows" | "none";

const getShortcutBlockLevel = (
  target: EventTarget | null,
): ShortcutBlockLevel => {
  if (!(target instanceof HTMLElement)) {
    return "none";
  }

  if (target instanceof HTMLInputElement) {
    return target.type === "range" ? "arrows" : "all";
  }

  if (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable ||
    target.closest("textarea, select, [contenteditable='true']")
  ) {
    return "all";
  }

  if (target.closest("input[type='range'], [role='slider']")) {
    return "arrows";
  }

  return "none";
};
```

핸들러 앞부분 교체:

```ts
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const blockLevel = getShortcutBlockLevel(event.target);
      if (blockLevel === "all") {
        return;
      }

      const shortcutKey = event.code || event.key;
      if (blockLevel === "arrows" && shortcutKey.startsWith("Arrow")) {
        return;
      }
      // 이하 switch 문 현행 유지
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx jest src/test/features/audio/audioKeyboardShortcuts.test.tsx` → 전체 PASS
(기존 "ignores shortcuts from editable and slider controls" 케이스는 편집영역 Space 차단 + 슬라이더 화살표 차단 검증이므로 새 로직에서도 통과)

- [ ] **Step 5: 전체 테스트**

Run: `npm test` → PASS. 특히 `audioPlayer.test.tsx`의 "keeps playback shortcuts active after opening fullscreen keyboard guidance" — blur/차단 완화로 더 견고해졌는지 확인.
Run: `npx tsc --noEmit` → 에러 없음

- [ ] **Step 6: 보고** (커밋하지 않음)

---

### Task 5: 풀스크린 open/close fade — useFadePresence

**Files:**
- Create: `src/shared/hooks/useFadePresence.ts`
- Modify: `src/features/audio/ui/audioPlayer.tsx:127-134` (fade 래퍼)
- Test: `src/test/shared/hooks/useFadePresence.test.tsx` (신규), `src/test/features/audio/audioPlayer.test.tsx` (Escape 닫기 테스트 2건 타이머 반영)

**Interfaces:**
- Consumes: 없음
- Produces: `useFadePresence(isOpen: boolean, exitMs: number): { mounted: boolean; visible: boolean }` — `mounted`가 렌더 여부, `visible`이 opacity 상태. Task 6과 무관(독립).

**동작 계약 (스펙 §3.1)**
- open: 즉시 mount → 20ms 후 `visible=true` (opacity-0 프레임 페인트 보장, `useArtworkCrossfade`의 타이머 활성화 패턴 재사용) → 300ms ease-out 페이드 인
- close: 즉시 `visible=false` → 250ms ease-in 페이드 아웃 → unmount. 닫힘 중 래퍼 `pointer-events-none` (하단 바 즉시 조작 가능)
- reduced-motion: 즉시 mount/unmount
- Escape 연타/재열기 등 중간 토글에 안전 (타이머 cleanup)

- [ ] **Step 1: 실패하는 테스트 작성** — `src/test/shared/hooks/useFadePresence.test.tsx`

```tsx
import { act, renderHook } from "@testing-library/react";
import { useFadePresence } from "@/shared/hooks/useFadePresence";

describe("useFadePresence", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("mounts immediately and becomes visible after the paint delay", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => useFadePresence(isOpen, 250),
      { initialProps: { isOpen: false } }
    );
    expect(result.current.mounted).toBe(false);

    rerender({ isOpen: true });
    expect(result.current.mounted).toBe(true);
    expect(result.current.visible).toBe(false);

    act(() => jest.advanceTimersByTime(25));
    expect(result.current.visible).toBe(true);
  });

  it("hides immediately and unmounts after exitMs", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => useFadePresence(isOpen, 250),
      { initialProps: { isOpen: true } }
    );
    act(() => jest.advanceTimersByTime(25));

    rerender({ isOpen: false });
    expect(result.current.visible).toBe(false);
    expect(result.current.mounted).toBe(true);

    act(() => jest.advanceTimersByTime(250));
    expect(result.current.mounted).toBe(false);
  });

  it("cancels a pending unmount when reopened mid-exit", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => useFadePresence(isOpen, 250),
      { initialProps: { isOpen: true } }
    );
    act(() => jest.advanceTimersByTime(25));

    rerender({ isOpen: false });
    act(() => jest.advanceTimersByTime(100));
    rerender({ isOpen: true });
    act(() => jest.advanceTimersByTime(300));

    expect(result.current.mounted).toBe(true);
    expect(result.current.visible).toBe(true);
  });

  it("skips fades when prefers-reduced-motion is set", () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    }));

    const { result, rerender } = renderHook(
      ({ isOpen }) => useFadePresence(isOpen, 250),
      { initialProps: { isOpen: false } }
    );

    rerender({ isOpen: true });
    expect(result.current.visible).toBe(true);

    rerender({ isOpen: false });
    act(() => jest.advanceTimersByTime(0));
    expect(result.current.mounted).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest src/test/shared/hooks/useFadePresence.test.tsx`
Expected: FAIL — "Cannot find module '@/shared/hooks/useFadePresence'"

- [ ] **Step 3: 훅 구현** — `src/shared/hooks/useFadePresence.ts`

```ts
"use client";

import { useEffect, useState } from "react";

const ENTER_PAINT_DELAY_MS = 20;

const prefersReducedMotion = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * fade 전환이 필요한 조건부 렌더 요소의 mount/visible 상태.
 * open: 즉시 mount → 짧은 지연 후 visible (opacity-0 프레임이 먼저 페인트되어야 페이드가 동작)
 * close: 즉시 visible 해제 → exitMs 후 unmount
 */
export function useFadePresence(isOpen: boolean, exitMs: number) {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    const reduced = prefersReducedMotion();

    if (isOpen) {
      setMounted(true);
      if (reduced) {
        setVisible(true);
        return;
      }
      const timer = setTimeout(() => setVisible(true), ENTER_PAINT_DELAY_MS);
      return () => clearTimeout(timer);
    }

    setVisible(false);
    const timer = setTimeout(() => setMounted(false), reduced ? 0 : exitMs);
    return () => clearTimeout(timer);
  }, [isOpen, exitMs]);

  return { mounted, visible };
}
```

- [ ] **Step 4: 훅 테스트 통과 확인**

Run: `npx jest src/test/shared/hooks/useFadePresence.test.tsx` → PASS

- [ ] **Step 5: audioPlayer.tsx 통합**

```tsx
import { useFadePresence } from "@/shared/hooks/useFadePresence";

const FULLSCREEN_EXIT_MS = 250;
```

컴포넌트 내부:

```tsx
const fullscreenPresence = useFadePresence(
  isFullscreenOpen && canUseFullscreen,
  FULLSCREEN_EXIT_MS,
);
```

렌더 교체 (`{isFullscreenOpen && canUseFullscreen ? <DesktopFullscreenPlayer .../> : null}` →):

```tsx
{fullscreenPresence.mounted ? (
  <div
    data-testid="fullscreen-fade-layer"
    className={
      fullscreenPresence.visible
        ? "opacity-100 transition-opacity duration-300 ease-out"
        : "pointer-events-none opacity-0 transition-opacity duration-[250ms] ease-in"
    }
  >
    <DesktopFullscreenPlayer
      currentTrackInfo={fullscreenTrackInfo}
      analyser={isFullscreenTrackCurrent ? audioAnalyser : null}
      isPlaying={isFullscreenTrackCurrent && isPlaying}
      onClose={closeFullscreen}
    />
  </div>
) : null}
```

(참고: `DesktopFullscreenPlayer` 루트가 `fixed inset-0`이므로 래퍼 opacity가 그대로 적용됨 — opacity는 fixed 포지셔닝에 영향 없음. `pointer-events-none`은 자식에 상속되어 닫힘 중 하단 바 조작 가능. `closeFullscreen`은 이미 idempotent라 fade-out 중 Escape 재입력에 안전)

- [ ] **Step 6: 기존 테스트 갱신** — `audioPlayer.test.tsx`

Escape 즉시 제거를 가정하는 2개 테스트에 fake timer 반영:

"opens and closes the desktop fullscreen player..." 끝부분 교체:

```tsx
    jest.useFakeTimers();
    fireEvent.keyDown(window, { key: "Escape" });

    // fade-out 동안에는 마운트 유지, 입력 차단
    expect(screen.getByTestId("fullscreen-fade-layer")).toHaveClass("pointer-events-none", "opacity-0");

    act(() => jest.advanceTimersByTime(260));
    expect(
      screen.queryByRole("dialog", { name: "Fullscreen player" }),
    ).not.toBeInTheDocument();
    jest.useRealTimers();
```

"closes fullscreen keyboard guidance before closing fullscreen with Escape" 끝부분도 동일 패턴 (`두 번째 Escape 후 advanceTimersByTime(260)` 뒤에 dialog 부재 확인). `act` import: `import { act, render, screen, waitFor, within } from "@testing-library/react";`

신규 케이스 추가:

```tsx
it("fades the fullscreen player in on open", () => {
  jest.useFakeTimers();
  render(<AudioPlayer />);

  fireEvent.click(screen.getByRole("button", { name: "Toggle fullscreen view" }));

  const fadeLayer = screen.getByTestId("fullscreen-fade-layer");
  expect(fadeLayer).toHaveClass("opacity-0");

  act(() => jest.advanceTimersByTime(25));
  expect(fadeLayer).toHaveClass("opacity-100");
  jest.useRealTimers();
});
```

(주의: 같은 파일의 다른 테스트들은 real timer를 쓰므로 fake timer는 케이스 내부에서만 켜고 반드시 복원. 풀스크린을 여는 기존 테스트들은 fade-in 완료를 기다릴 필요 없음 — dialog는 open 즉시 mount되므로 조회 가능)

- [ ] **Step 7: 전체 테스트 + 타입 체크**

Run: `npm test` → PASS. Run: `npx tsc --noEmit` → 에러 없음

- [ ] **Step 8: 보고** (커밋하지 않음)

---

### Task 6: 트랙 전환 아트워크 스냅 아웃 (backdrop 크로스페이드 유지)

**Files:**
- Modify: `src/features/audio/components/desktopFullscreenPlayer.tsx:23,109-112,127-140,225-253`
- Test: `src/test/features/audio/desktopFullscreenPlayer.test.tsx` (신규)

**Interfaces:**
- Consumes: `useArtworkCrossfade` 반환값 `{ layers: ArtworkLayer[]; topPalette; completeLayer(key: number) }` — **훅은 수정하지 않음**
- Produces: 없음

**동작 계약 (스펙 §3.2)**
- 아트워크 스테이지: `layers`의 **top 레이어만** 렌더 (`key={layer.key}`이므로 top 교체 시 이전 이미지는 즉시 unmount = 스냅 아웃). 새 레이어는 훅의 기존 활성화 타이머(120ms 지연 → opacity 1)로 **280ms ease-out** 페이드 인
- backdrop: 현행 2-레이어 크로스페이드 유지, **450ms**. `completeLayer` 트리거(`onTransitionEnd`)를 아트워크에서 **backdrop 레이어로 이동** — 아트워크(280ms)가 먼저 끝나며 backdrop 크로스페이드를 중도 절단하는 것 방지. 훅의 타임아웃 백업(450+80ms)은 그대로 동작
- 훅 게이트("팔레트 해석 완료 후 레이어 커밋") 덕분에 이전 이미지는 **새 이미지가 준비된 순간** 제거됨 (아트워크 공백 프레임 없음)
- reduced-motion: 훅이 단일 레이어(opacity 1)만 주므로 자동 처리

- [ ] **Step 1: 실패하는 테스트 작성** — `src/test/features/audio/desktopFullscreenPlayer.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import DesktopFullscreenPlayer from "@/features/audio/components/desktopFullscreenPlayer";
import { useArtworkCrossfade } from "@/features/audio/hooks/useArtworkCrossfade";
import { FALLBACK_ALBUM_PALETTE } from "@/features/audio/components/visualizers/albumColorPalette";
import type { Track } from "@/entities/track";

jest.mock("@/features/audio/hooks/useArtworkCrossfade", () => ({
  useArtworkCrossfade: jest.fn(),
}));
jest.mock("@/features/audio/components/visualizers/albumColorPalette", () => ({
  ...jest.requireActual("@/features/audio/components/visualizers/albumColorPalette"),
  useAlbumColorPalette: () => ({
    palette: jest.requireActual(
      "@/features/audio/components/visualizers/albumColorPalette",
    ).FALLBACK_ALBUM_PALETTE,
    resolvedSrc: "",
  }),
}));
jest.mock("@/features/audio/components/fullscreenArtworkStage", () => ({
  __esModule: true,
  default: ({ artworkSrc }: { artworkSrc: string }) => (
    <div data-testid="artwork-stage" data-src={artworkSrc} />
  ),
}));
jest.mock("@/features/audio/components/fullscreenBackdrop", () => ({
  __esModule: true,
  default: ({ artworkSrc }: { artworkSrc: string }) => (
    <div data-testid="backdrop-layer" data-src={artworkSrc} />
  ),
}));
jest.mock("@/features/audio/components/fullscreenAudioVisualizer", () => ({
  __esModule: true,
  default: () => <canvas data-testid="fullscreen-visualizer" />,
}));

const mockUseArtworkCrossfade = useArtworkCrossfade as jest.MockedFunction<
  typeof useArtworkCrossfade
>;

const track: Track = {
  id: "track-2",
  source: "cloudinary",
  title: "Track Two",
  artistId: "artist-1",
  artistName: "Artist One",
  albumName: "Album One",
  artworkUrl: "https://example.com/b.jpg",
  durationMs: 180000,
  streamUrl: "https://example.com/b.mp3",
  metadata: {},
};

const makeLayer = (key: number, src: string, opacity: number) => ({
  key,
  artworkSrc: src,
  hasArtwork: true,
  palette: FALLBACK_ALBUM_PALETTE,
  opacity,
});

describe("DesktopFullscreenPlayer artwork transition", () => {
  it("renders only the incoming artwork while both backdrop layers crossfade", () => {
    mockUseArtworkCrossfade.mockReturnValue({
      layers: [
        makeLayer(1, "https://example.com/a.jpg", 1),
        makeLayer(2, "https://example.com/b.jpg", 0),
      ],
      topPalette: FALLBACK_ALBUM_PALETTE,
      activateLayer: jest.fn(),
      completeLayer: jest.fn(),
    });

    render(
      <DesktopFullscreenPlayer
        currentTrackInfo={track}
        analyser={null}
        isPlaying={false}
        onClose={jest.fn()}
      />
    );

    const stages = screen.getAllByTestId("artwork-stage");
    expect(stages).toHaveLength(1); // 스냅 아웃: outgoing 아트워크는 렌더되지 않음
    expect(stages[0]).toHaveAttribute("data-src", "https://example.com/b.jpg");
    expect(screen.getAllByTestId("backdrop-layer")).toHaveLength(2); // backdrop은 크로스페이드 유지
  });

  it("completes the transition from the backdrop layer, not the artwork", () => {
    const completeLayer = jest.fn();
    mockUseArtworkCrossfade.mockReturnValue({
      layers: [
        makeLayer(1, "https://example.com/a.jpg", 1),
        makeLayer(2, "https://example.com/b.jpg", 1),
      ],
      topPalette: FALLBACK_ALBUM_PALETTE,
      activateLayer: jest.fn(),
      completeLayer,
    });

    render(
      <DesktopFullscreenPlayer
        currentTrackInfo={track}
        analyser={null}
        isPlaying={false}
        onClose={jest.fn()}
      />
    );

    const backdropWrappers = screen
      .getAllByTestId("backdrop-layer")
      .map((el) => el.parentElement!);
    backdropWrappers[1].dispatchEvent(
      Object.assign(new Event("transitionend", { bubbles: true }), {
        propertyName: "opacity",
      })
    );

    expect(completeLayer).toHaveBeenCalledWith(2);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest src/test/features/audio/desktopFullscreenPlayer.test.tsx`
Expected: FAIL — 아트워크 스테이지 2개 렌더됨 (`toHaveLength(1)` 실패)

- [ ] **Step 3: 구현** — `desktopFullscreenPlayer.tsx`

상수 교체:

```tsx
const ARTWORK_FADE_MS = 280;
const BACKDROP_FADE_MS = 450;
```

(`FADE_MS` 제거, `useArtworkCrossfade` 호출은 `fadeDurationMs: BACKDROP_FADE_MS`로 — 타임아웃 백업 기준이 backdrop)

`fadeStyle`을 duration 인자화:

```tsx
const fadeStyle = (opacity: number, durationMs: number): CSSProperties => ({
  opacity,
  transition: `opacity ${durationMs}ms ease-out`,
});
```

backdrop 레이어 맵에 `completeLayer` 트리거 이동:

```tsx
{layers.map((layer) => (
  <div
    key={layer.key}
    aria-hidden="true"
    className="absolute inset-0"
    style={fadeStyle(layer.opacity, BACKDROP_FADE_MS)}
    onTransitionEnd={(event) => {
      if (
        event.propertyName === "opacity" &&
        event.target === event.currentTarget
      ) {
        completeLayer(layer.key);
      }
    }}
  >
    <FullscreenBackdrop
      artworkSrc={layer.artworkSrc}
      hasArtwork={layer.hasArtwork}
      palette={layer.palette}
    />
  </div>
))}
```

아트워크 스테이지를 top 레이어 단독 렌더로 교체 (기존 `layers.map((layer, index) => ...)` 블록 →):

```tsx
{(() => {
  const topLayer = layers.length ? layers[layers.length - 1] : null;
  if (!topLayer) return null;
  return (
    <div
      key={topLayer.key}
      className="relative z-[1]"
      style={fadeStyle(topLayer.opacity, ARTWORK_FADE_MS)}
    >
      <FullscreenArtworkStage
        artworkSrc={topLayer.artworkSrc}
        trackTitle={trackTitle}
        hasArtwork={topLayer.hasArtwork}
        isPlaying={isPlaying}
        palette={topLayer.palette}
      />
    </div>
  );
})()}
```

(IIFE 대신 렌더 위에서 `const topArtworkLayer = layers.at(-1) ?? null;`로 선언하고 JSX에서 사용하는 편이 깔끔 — 구현 시 그 형태로. `key`가 레이어 교체 시 이전 노드를 즉시 unmount시키는 것이 스냅 아웃의 핵심)

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx jest src/test/features/audio/desktopFullscreenPlayer.test.tsx` → PASS

- [ ] **Step 5: 전체 테스트 + 타입 체크**

Run: `npm test` → PASS (`audioPlayer.test.tsx`의 풀스크린 아트워크 단건 조회 `getByAltText("Track One fullscreen artwork")`는 top 단독 렌더에서도 통과)
Run: `npx tsc --noEmit` → 에러 없음

- [ ] **Step 6: 보고** (커밋하지 않음)

---

## 최종 검증 (전 Task 완료 후)

- [ ] `npm test` 전체 PASS + `npx tsc --noEmit` + `npm run lint`
- [ ] `npm run dev` (port 3999) 후 태블릿·데스크톱 뷰포트 수동 확인:
  1. 버튼 클릭 직후 Space/N/P 단축키 동작
  2. seek 바: 호버 프리뷰 바 시인성, thumb 표시, 드래그(바 밖 이탈·Escape 취소 포함), 릴리즈 시 1회 seek
  3. 풀스크린 열기/닫기 fade + 닫힘 중 하단 바 조작
  4. prev/next 연속 스킵: 아트워크 겹침 없음, backdrop 부드러운 블렌딩, 공백 프레임 없음
  5. DevTools에서 `prefers-reduced-motion: reduce` 에뮬레이션 → 모든 fade 생략
  6. 768px 경계에서 풀스크린 게이트 정상
- [ ] **모바일 무영향 확인**: 모바일 뷰포트에서 하단 플레이어·모바일 풀스크린의 버튼 탭/seek/표시가 작업 전과 동일
- [ ] 사용자 보고 → 사용자 수동 QA (커밋·다음 단계는 사용자 지시 대기)
