# Phase 4 — 플레이어 + 오디오 엔진 확장 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 도메인 `Track` 기반의 전역 미니플레이어/큐를 구성하고, 기존 Web Audio 싱글톤을 듀얼 소스 그래프로 확장해 **크로스페이드 · 이퀄라이저**를 신규 구현하며 **비주얼라이저를 개선**한다.

**Architecture:** 오디오 엔진은 듀얼 오디오 엘리먼트(A/B) + GainNode → BiquadFilter 체인(EQ) → AnalyserNode → destination. Zustand `playerStore`(현재 트랙·상태) + `queueStore`(목록·shuffle·repeat). 미니플레이어는 전역 레이아웃 하단 고정, Phase 3의 `onPlay`가 `playerStore.play(track)`로 연결된다.

**Tech Stack:** Web Audio API, TypeScript 6, Zustand 5, React 19, Jest (Web Audio mocked).

## Global Constraints

- 매 태스크 종료 시 `npm test` 통과 + 빌드 성공.
- 기존 자산 계승: `src/shared/lib/audioInstance.ts`(싱글톤), `src/features/listModal/components/audioVisualizer.tsx`(시각화), `src/features/audio/*`(컨트롤/seek). **삭제하지 말고 확장/이식**한다. 레거시 listModal 제거는 Phase 5.
- 재생 소스는 `Track.streamUrl`(Audius 풀트랙 또는 Deezer preview). 재생 시 `addRecentPlay`(Phase 2) + `cacheTrack`(Phase 2) 호출.
- 자동재생 정책: `AudioContext.resume()`는 사용자 상호작용에서만 호출.
- `createMediaElementSource`는 엘리먼트당 1회만 생성 — A/B 각각 독립 source/gain.
- Jest 환경엔 AudioContext가 없으므로 엔진 단위 테스트는 노드 팩토리를 주입 가능한 형태로 설계하고 모킹한다.

---

## File Structure

- Create: `src/shared/lib/audioEngine.ts` — 듀얼 소스 + EQ + analyser 그래프(싱글톤 확장)
- Create: `src/shared/lib/crossfade.ts` — 게인 램프 계산(순수 함수)
- Create: `src/shared/lib/equalizer.ts` — EQ 프리셋/밴드 정의(순수)
- Create: `src/app/store/playerStore.ts` — 현재 트랙/재생상태/볼륨
- Create: `src/app/store/queueStore.ts` — 큐/shuffle/repeat
- Create: `src/features/player/hooks/usePlayer.ts` — 스토어+엔진 연결
- Create: `src/widgets/audioPlayer/miniPlayer.tsx` — 전역 하단 미니플레이어
- Create: `src/features/audio/components/equalizerPanel.tsx`
- Modify: `src/features/listModal/components/audioVisualizer.tsx` → `src/features/audio/components/audioVisualizer.tsx` (이전 + 펌핑효과 완성)
- Modify: `src/app/layout.tsx` — 미니플레이어 마운트
- Modify: Phase 3 라우트들의 `onPlay` → `usePlayer().play`
- Test: `src/test/shared/lib/*.test.ts`, `src/test/app/store/*.test.ts`

---

### Task 1: EQ 프리셋/밴드 정의 (순수)

**Files:**
- Create: `src/shared/lib/equalizer.ts`
- Test: `src/test/shared/lib/equalizer.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `interface EQBand { frequency: number; gain: number; type: BiquadFilterType; }`
  - `type EQPresetName = "flat" | "edm" | "bass" | "vocal";`
  - `const EQ_PRESETS: Record<EQPresetName, EQBand[]>`
  - `function getPreset(name: EQPresetName): EQBand[]`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/test/shared/lib/equalizer.test.ts
import { getPreset, EQ_PRESETS } from "@/shared/lib/equalizer";
it("flat preset has zero gains", () => {
  expect(getPreset("flat").every((b) => b.gain === 0)).toBe(true);
});
it("edm preset boosts low and high", () => {
  const edm = getPreset("edm");
  expect(edm[0].gain).toBeGreaterThan(0);
  expect(edm[edm.length - 1].gain).toBeGreaterThan(0);
});
it("all presets share band count", () => {
  const counts = Object.values(EQ_PRESETS).map((b) => b.length);
  expect(new Set(counts).size).toBe(1);
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- equalizer.test.ts` → FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/shared/lib/equalizer.ts
export interface EQBand { frequency: number; gain: number; type: BiquadFilterType; }
export type EQPresetName = "flat" | "edm" | "bass" | "vocal";

const FREQS: { f: number; type: BiquadFilterType }[] = [
  { f: 60, type: "lowshelf" },
  { f: 250, type: "peaking" },
  { f: 1000, type: "peaking" },
  { f: 4000, type: "peaking" },
  { f: 12000, type: "highshelf" },
];
const band = (gains: number[]): EQBand[] =>
  FREQS.map((x, i) => ({ frequency: x.f, type: x.type, gain: gains[i] }));

export const EQ_PRESETS: Record<EQPresetName, EQBand[]> = {
  flat: band([0, 0, 0, 0, 0]),
  edm: band([6, 1, -1, 2, 5]),
  bass: band([8, 3, 0, 0, 0]),
  vocal: band([-2, 0, 4, 3, 0]),
};
export function getPreset(name: EQPresetName): EQBand[] {
  return EQ_PRESETS[name].map((b) => ({ ...b }));
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- equalizer.test.ts` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/lib/equalizer.ts src/test/shared/lib/equalizer.test.ts
git commit -m "feat(audio): add EQ presets and band definitions"
```

---

### Task 2: 크로스페이드 램프 계산 (순수)

**Files:**
- Create: `src/shared/lib/crossfade.ts`
- Test: `src/test/shared/lib/crossfade.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `interface FadeStep { gain: number; atTime: number; }`
  - `function computeFade(direction: "in" | "out", startTime: number, durationSec: number): FadeStep[]` — 시작/끝 게인 타깃을 반환(엔진이 `linearRampToValueAtTime`에 사용)

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/test/shared/lib/crossfade.test.ts
import { computeFade } from "@/shared/lib/crossfade";
it("fade-in goes 0 -> 1 over duration", () => {
  const steps = computeFade("in", 10, 3);
  expect(steps[0]).toEqual({ gain: 0, atTime: 10 });
  expect(steps[1]).toEqual({ gain: 1, atTime: 13 });
});
it("fade-out goes 1 -> 0 over duration", () => {
  const steps = computeFade("out", 0, 2);
  expect(steps[0]).toEqual({ gain: 1, atTime: 0 });
  expect(steps[1]).toEqual({ gain: 0, atTime: 2 });
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- crossfade.test.ts` → FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/shared/lib/crossfade.ts
export interface FadeStep { gain: number; atTime: number; }
export function computeFade(direction: "in" | "out", startTime: number, durationSec: number): FadeStep[] {
  const from = direction === "in" ? 0 : 1;
  const to = direction === "in" ? 1 : 0;
  return [
    { gain: from, atTime: startTime },
    { gain: to, atTime: startTime + durationSec },
  ];
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- crossfade.test.ts` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/lib/crossfade.ts src/test/shared/lib/crossfade.test.ts
git commit -m "feat(audio): add crossfade ramp computation"
```

---

### Task 3: 오디오 엔진 (듀얼 소스 + EQ + analyser)

**Files:**
- Create: `src/shared/lib/audioEngine.ts`
- Test: `src/test/shared/lib/audioEngine.test.ts`

**Interfaces:**
- Consumes: `getPreset`/`EQBand` (Task1), `computeFade` (Task2)
- Produces:
  - `interface AudioEngine { loadAndPlay(url: string, crossfadeSec?: number): Promise<void>; pause(): void; resume(): Promise<void>; setEqPreset(name: EQPresetName): void; getAnalyser(): AnalyserNode | null; destroy(): void; }`
  - `function createAudioEngine(ctxFactory?: () => AudioContext): AudioEngine`

설계: 두 오디오 엘리먼트(A/B)와 각 GainNode를 EQ BiquadFilter 체인에 연결, 체인 출력 → analyser → destination. 새 트랙은 비활성 엘리먼트에 로드 후 활성/비활성 게인을 `computeFade`로 교차. `ctxFactory` 주입으로 테스트에서 AudioContext를 모킹한다.

- [ ] **Step 1: 실패하는 테스트 작성 (모킹된 컨텍스트)**

```ts
// src/test/shared/lib/audioEngine.test.ts
import { createAudioEngine } from "@/shared/lib/audioEngine";

function makeMockCtx() {
  const gain = () => ({ gain: { value: 1, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() }, connect: jest.fn() });
  const filter = () => ({ frequency: { value: 0 }, gain: { value: 0 }, type: "peaking", connect: jest.fn() });
  return {
    currentTime: 0,
    state: "running",
    createGain: jest.fn(gain),
    createBiquadFilter: jest.fn(filter),
    createAnalyser: jest.fn(() => ({ fftSize: 512, frequencyBinCount: 256, connect: jest.fn(), getByteFrequencyData: jest.fn() })),
    createMediaElementSource: jest.fn(() => ({ connect: jest.fn() })),
    destination: {},
    resume: jest.fn(async () => {}),
    close: jest.fn(async () => {}),
  } as unknown as AudioContext;
}

it("creates an EQ chain (5 biquad filters)", () => {
  const ctx = makeMockCtx();
  const engine = createAudioEngine(() => ctx);
  engine.setEqPreset("edm");
  expect((ctx.createBiquadFilter as jest.Mock).mock.calls.length).toBe(5);
  expect(engine.getAnalyser()).not.toBeNull();
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- audioEngine.test.ts` → FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/shared/lib/audioEngine.ts
import { EQBand, EQPresetName, getPreset } from "./equalizer";
import { computeFade } from "./crossfade";

export interface AudioEngine {
  loadAndPlay(url: string, crossfadeSec?: number): Promise<void>;
  pause(): void;
  resume(): Promise<void>;
  setEqPreset(name: EQPresetName): void;
  getAnalyser(): AnalyserNode | null;
  destroy(): void;
}

export function createAudioEngine(ctxFactory: () => AudioContext = () => new AudioContext()): AudioEngine {
  const ctx = ctxFactory();
  const elements: HTMLAudioElement[] = [];
  const gains: GainNode[] = [];
  for (let i = 0; i < 2; i++) {
    const el = typeof Audio !== "undefined" ? new Audio() : ({} as HTMLAudioElement);
    if (el.crossOrigin !== undefined) el.crossOrigin = "anonymous";
    const src = ctx.createMediaElementSource(el);
    const gain = ctx.createGain();
    gain.gain.value = i === 0 ? 1 : 0;
    src.connect(gain);
    elements.push(el);
    gains.push(gain);
  }
  // EQ chain
  const filters: BiquadFilterNode[] = getPreset("flat").map((b: EQBand) => {
    const f = ctx.createBiquadFilter();
    f.type = b.type; f.frequency.value = b.frequency; f.gain.value = b.gain;
    return f;
  });
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  // gains -> first filter
  gains.forEach((g) => g.connect(filters[0]));
  filters.reduce((prev, next) => { prev.connect(next); return next; });
  filters[filters.length - 1].connect(analyser);
  analyser.connect(ctx.destination);

  let active = 0;

  return {
    async loadAndPlay(url, crossfadeSec = 0) {
      const next = active === 0 ? 1 : 0;
      elements[next].src = url;
      await elements[next].play().catch(() => {});
      if (crossfadeSec > 0) {
        const t = ctx.currentTime;
        computeFade("out", t, crossfadeSec).forEach((s) => gains[active].gain.linearRampToValueAtTime(s.gain, s.atTime));
        computeFade("in", t, crossfadeSec).forEach((s) => gains[next].gain.linearRampToValueAtTime(s.gain, s.atTime));
      } else {
        gains[active].gain.value = 0;
        gains[next].gain.value = 1;
      }
      active = next;
    },
    pause() { elements[active].pause(); },
    async resume() { if (ctx.state === "suspended") await ctx.resume(); await elements[active].play().catch(() => {}); },
    setEqPreset(name) {
      getPreset(name).forEach((b, i) => { if (filters[i]) filters[i].gain.value = b.gain; });
    },
    getAnalyser() { return analyser; },
    destroy() { elements.forEach((e) => { e.pause(); e.src = ""; }); if (ctx.state !== "closed") void ctx.close(); },
  };
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- audioEngine.test.ts` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/lib/audioEngine.ts src/test/shared/lib/audioEngine.test.ts
git commit -m "feat(audio): add dual-source audio engine with EQ chain and crossfade"
```

---

### Task 4: playerStore + queueStore (Zustand)

**Files:**
- Create: `src/app/store/playerStore.ts`
- Create: `src/app/store/queueStore.ts`
- Test: `src/test/app/store/queueStore.test.ts`

**Interfaces:**
- Consumes: `Track`
- Produces:
  - playerStore: `{ current: Track | null; isPlaying: boolean; volume: number; setCurrent(t: Track): void; setPlaying(b: boolean): void; }`
  - queueStore: `{ queue: Track[]; index: number; shuffle: boolean; repeat: "off" | "one" | "all"; setQueue(ts: Track[], start?: number): void; next(): Track | null; prev(): Track | null; toggleShuffle(): void; cycleRepeat(): void; }`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/test/app/store/queueStore.test.ts
import { useQueueStore } from "@/app/store/queueStore";
import { Track } from "@/entities/track/model";

const mk = (id: string): Track => ({ id, source: "audius", title: id, artistId: "a", artistName: "n", artworkUrl: "", durationMs: 1, metadata: {} });

beforeEach(() => useQueueStore.setState({ queue: [], index: 0, shuffle: false, repeat: "off" }));

it("advances to next track", () => {
  useQueueStore.getState().setQueue([mk("1"), mk("2"), mk("3")], 0);
  expect(useQueueStore.getState().next()?.id).toBe("2");
});
it("repeat all wraps around", () => {
  useQueueStore.getState().setQueue([mk("1"), mk("2")], 1);
  useQueueStore.setState({ repeat: "all" });
  expect(useQueueStore.getState().next()?.id).toBe("1");
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- queueStore.test.ts` → FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/app/store/playerStore.ts
import { create } from "zustand";
import { Track } from "@/entities/track/model";
interface PlayerState {
  current: Track | null; isPlaying: boolean; volume: number;
  setCurrent: (t: Track) => void; setPlaying: (b: boolean) => void; setVolume: (v: number) => void;
}
export const usePlayerStore = create<PlayerState>((set) => ({
  current: null, isPlaying: false, volume: 1,
  setCurrent: (current) => set({ current }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
}));
```
```ts
// src/app/store/queueStore.ts
import { create } from "zustand";
import { Track } from "@/entities/track/model";
interface QueueState {
  queue: Track[]; index: number; shuffle: boolean; repeat: "off" | "one" | "all";
  setQueue: (ts: Track[], start?: number) => void;
  next: () => Track | null;
  prev: () => Track | null;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}
export const useQueueStore = create<QueueState>((set, get) => ({
  queue: [], index: 0, shuffle: false, repeat: "off",
  setQueue: (queue, start = 0) => set({ queue, index: start }),
  next: () => {
    const { queue, index, repeat } = get();
    if (queue.length === 0) return null;
    if (repeat === "one") return queue[index];
    let n = index + 1;
    if (n >= queue.length) { if (repeat === "all") n = 0; else return null; }
    set({ index: n });
    return queue[n];
  },
  prev: () => {
    const { queue, index, repeat } = get();
    if (queue.length === 0) return null;
    let p = index - 1;
    if (p < 0) { if (repeat === "all") p = queue.length - 1; else return null; }
    set({ index: p });
    return queue[p];
  },
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  cycleRepeat: () => set((s) => ({ repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off" })),
}));
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- queueStore.test.ts` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/app/store/playerStore.ts src/app/store/queueStore.ts src/test/app/store/queueStore.test.ts
git commit -m "feat(store): add playerStore and queueStore"
```

---

### Task 5: usePlayer 훅 (스토어 + 엔진 + 최근재생/캐시 연결)

**Files:**
- Create: `src/features/player/hooks/usePlayer.ts`
- Test: `src/test/features/player/usePlayer.test.tsx`

**Interfaces:**
- Consumes: playerStore/queueStore (Task4), audioEngine (Task3), `addRecentPlay`/`cacheTrack` (Phase 2)
- Produces: `usePlayer()` → `{ current; isPlaying; play(track, queue?): Promise<void>; toggle(): Promise<void>; next(): Promise<void>; prev(): Promise<void>; setEqPreset(name): void; analyser: AnalyserNode | null; }`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/features/player/usePlayer.test.tsx
import { renderHook, act } from "@testing-library/react";
import { usePlayer } from "@/features/player/hooks/usePlayer";

const loadAndPlay = jest.fn(async () => {});
jest.mock("@/shared/lib/audioEngine", () => ({
  createAudioEngine: () => ({ loadAndPlay, pause: jest.fn(), resume: jest.fn(), setEqPreset: jest.fn(), getAnalyser: () => null, destroy: jest.fn() }),
}));
const addRecentPlay = jest.fn(async () => {});
const cacheTrack = jest.fn(async () => {});
jest.mock("@/shared/db/repositories/recentPlaysRepo", () => ({ addRecentPlay: (...a: any) => addRecentPlay(...a) }));
jest.mock("@/shared/db/repositories/trackCacheRepo", () => ({ cacheTrack: (...a: any) => cacheTrack(...a) }));

const track = { id: "audius:1", source: "audius", title: "S", artistId: "a", artistName: "n", artworkUrl: "", durationMs: 1, streamUrl: "https://x", metadata: {} };

it("play loads stream and records recent + cache", async () => {
  const { result } = renderHook(() => usePlayer());
  await act(async () => { await result.current.play(track as any); });
  expect(loadAndPlay).toHaveBeenCalledWith("https://x", expect.any(Number));
  expect(addRecentPlay).toHaveBeenCalledWith("audius:1");
  expect(cacheTrack).toHaveBeenCalled();
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- usePlayer.test.tsx` → FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/features/player/hooks/usePlayer.ts
"use client";
import { useRef } from "react";
import { Track, isPlayable } from "@/entities/track/model";
import { createAudioEngine, AudioEngine } from "@/shared/lib/audioEngine";
import { EQPresetName } from "@/shared/lib/equalizer";
import { usePlayerStore } from "@/app/store/playerStore";
import { useQueueStore } from "@/app/store/queueStore";
import { addRecentPlay } from "@/shared/db/repositories/recentPlaysRepo";
import { cacheTrack } from "@/shared/db/repositories/trackCacheRepo";

const CROSSFADE_SEC = 3;
let engineSingleton: AudioEngine | null = null;
function engine(): AudioEngine {
  if (!engineSingleton) engineSingleton = createAudioEngine();
  return engineSingleton;
}

export function usePlayer() {
  const { current, isPlaying, setCurrent, setPlaying } = usePlayerStore();
  const queue = useQueueStore();
  const started = useRef(false);

  const playTrack = async (track: Track) => {
    if (!isPlayable(track)) return;
    setCurrent(track);
    setPlaying(true);
    await engine().loadAndPlay(track.streamUrl!, started.current ? CROSSFADE_SEC : 0);
    started.current = true;
    await addRecentPlay(track.id);
    await cacheTrack(track);
  };

  return {
    current, isPlaying,
    analyser: engine().getAnalyser(),
    play: async (track: Track, list?: Track[]) => {
      if (list) queue.setQueue(list, list.findIndex((t) => t.id === track.id));
      await playTrack(track);
    },
    toggle: async () => {
      if (isPlaying) { engine().pause(); setPlaying(false); }
      else { await engine().resume(); setPlaying(true); }
    },
    next: async () => { const t = queue.next(); if (t) await playTrack(t); },
    prev: async () => { const t = queue.prev(); if (t) await playTrack(t); },
    setEqPreset: (name: EQPresetName) => engine().setEqPreset(name),
  };
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- usePlayer.test.tsx` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/features/player src/test/features/player
git commit -m "feat(player): add usePlayer hook wiring engine, queue, recent, cache"
```

---

### Task 6: 비주얼라이저 이식 + 펌핑효과 완성

**Files:**
- Create: `src/features/audio/components/audioVisualizer.tsx` (기존 `listModal/components/audioVisualizer.tsx` 로직 이식)
- Test: `src/test/features/audio/audioVisualizer.test.tsx`

**Interfaces:**
- Consumes: `AudioVisualizerProps`(`@/shared/types/dataType`: analyserNode, isPlaying, width, height)
- Produces: `AudioVisualizer` 컴포넌트 (canvas 렌더, analyser 없으면 캔버스만)

근거: 기존 코드의 segmented bar 로직을 유지하고 `barHeight / 1.5` 부분의 "펌핑효과" TODO를 완성(저주파 가중 스케일링). 기존 listModal 경로 파일은 Phase 5에서 제거.

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/features/audio/audioVisualizer.test.tsx
import { render } from "@testing-library/react";
import AudioVisualizer from "@/features/audio/components/audioVisualizer";

it("renders a canvas even without analyser", () => {
  const { container } = render(<AudioVisualizer analyserNode={null} isPlaying={false} />);
  expect(container.querySelector("canvas")).toBeInTheDocument();
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- audioVisualizer.test.tsx` → FAIL

- [ ] **Step 3: 최소 구현 (이식 + 펌핑효과)**

기존 `src/features/listModal/components/audioVisualizer.tsx` 전체를 새 경로로 복사하되, 막대 높이 계산을 다음으로 교체(저주파 가중 펌핑):

```tsx
// 변경 핵심: draw() 내부 barHeight 계산
const lowFreqBoost = 1 + 0.6 * (1 - i / bufferLength); // 저주파일수록 큰 가중
const barHeight = (dataArray[i] / 1.5) * lowFreqBoost;
```
나머지(segment 렌더, RAF, cleanup)는 기존 로직 유지. import의 props 타입은 `AudioVisualizerProps` 그대로 사용.

- [ ] **Step 4: 통과 확인** — Run: `npm test -- audioVisualizer.test.tsx` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/features/audio/components/audioVisualizer.tsx src/test/features/audio/audioVisualizer.test.tsx
git commit -m "feat(audio): port visualizer to audio feature with low-freq pumping effect"
```

---

### Task 7: 미니플레이어 위젯 + EQ 패널 + 레이아웃/onPlay 연결

**Files:**
- Create: `src/widgets/audioPlayer/miniPlayer.tsx`
- Create: `src/features/audio/components/equalizerPanel.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/views/home/index.tsx`, `src/views/search/index.tsx`, `src/views/library/index.tsx` (onPlay → usePlayer().play)
- Modify: `src/app/page.tsx`, `src/app/search/page.tsx`, `src/app/library/page.tsx` (onPlay 제거 — 뷰 내부에서 usePlayer 사용)
- Test: `src/test/widgets/miniPlayer.test.tsx`

**Interfaces:**
- Consumes: `usePlayer` (Task5), `AudioVisualizer` (Task6), `getPreset`/`EQ_PRESETS` (Task1)
- Produces: `MiniPlayer` 컴포넌트, `EqualizerPanel` 컴포넌트

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/widgets/miniPlayer.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import MiniPlayer from "@/widgets/audioPlayer/miniPlayer";

const toggle = jest.fn();
jest.mock("@/features/player/hooks/usePlayer", () => ({
  usePlayer: () => ({
    current: { id: "audius:1", title: "Now Playing", artistName: "DJ" },
    isPlaying: true, analyser: null, toggle, next: jest.fn(), prev: jest.fn(), setEqPreset: jest.fn(),
  }),
}));

it("shows current track and toggles playback", () => {
  render(<MiniPlayer />);
  expect(screen.getByText("Now Playing")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /pause|play/i }));
  expect(toggle).toHaveBeenCalled();
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- miniPlayer.test.tsx` → FAIL

- [ ] **Step 3: 최소 구현**

```tsx
// src/widgets/audioPlayer/miniPlayer.tsx
"use client";
import { usePlayer } from "@/features/player/hooks/usePlayer";

export default function MiniPlayer() {
  const { current, isPlaying, toggle, next, prev } = usePlayer();
  if (!current) return null;
  return (
    <footer className="fixed bottom-0 inset-x-0 flex items-center gap-3 p-3 bg-black/80 backdrop-blur">
      <div className="flex-1">
        <p className="font-medium">{current.title}</p>
        <p className="text-sm opacity-70">{current.artistName}</p>
      </div>
      <button aria-label="prev" onClick={() => void prev()}>⏮</button>
      <button aria-label={isPlaying ? "pause" : "play"} onClick={() => void toggle()}>{isPlaying ? "⏸" : "▶"}</button>
      <button aria-label="next" onClick={() => void next()}>⏭</button>
    </footer>
  );
}
```
```tsx
// src/features/audio/components/equalizerPanel.tsx
"use client";
import { usePlayer } from "@/features/player/hooks/usePlayer";
import { EQ_PRESETS, EQPresetName } from "@/shared/lib/equalizer";

export default function EqualizerPanel() {
  const { setEqPreset } = usePlayer();
  return (
    <div className="flex gap-2">
      {(Object.keys(EQ_PRESETS) as EQPresetName[]).map((name) => (
        <button key={name} onClick={() => setEqPreset(name)} className="px-2 py-1 rounded bg-white/10 uppercase text-xs">{name}</button>
      ))}
    </div>
  );
}
```
`src/app/layout.tsx`에 `<MiniPlayer />`를 콘텐츠 하단에 마운트. 각 뷰는 `onPlay` prop 대신 내부에서 `const { play } = usePlayer()`를 사용하도록 수정하고, 페이지 파일에서 `onPlay` 전달을 제거한다.

- [ ] **Step 4: 통과 확인** — Run: `npm test -- miniPlayer.test.tsx` → PASS

- [ ] **Step 5: 빌드 + 전체 테스트 + 스모크**

Run: `npm run build && npm test`
Expected: 성공 / 통과. 이어 `npm run dev`로 트랙 클릭→재생, 미니플레이어 표시, next/prev, EQ 프리셋 전환, 비주얼라이저 동작 확인.

- [ ] **Step 6: 커밋**

```bash
git add src/widgets/audioPlayer/miniPlayer.tsx src/features/audio/components/equalizerPanel.tsx src/app/layout.tsx src/views src/app/page.tsx src/app/search/page.tsx src/app/library/page.tsx src/test/widgets/miniPlayer.test.tsx
git commit -m "feat(player): add MiniPlayer, EqualizerPanel, wire usePlayer into views"
```

---

## Self-Review

**1. Spec 커버리지** (설계서 §7 플레이어/큐 + §8 오디오 엔진): playerStore/queueStore→Task4; 미니플레이어→Task7; 목표 그래프(듀얼소스+GainNode+BiquadFilter EQ+analyser)→Task3; 크로스페이드 램프→Task2; EQ 프리셋(EDM/Bass/Vocal/Flat)→Task1; 비주얼라이저 개선(펌핑효과 완성)→Task6; 재생 시 recent/cache 기록→Task5. 전체화면 플레이어는 후속(미니플레이어 확장)로 둠.
**2. Placeholder 스캔:** 모든 코드 단계에 실제 코드 포함. Task6는 "기존 파일 이식 + 핵심 diff 명시"로 구체화 — placeholder 아님.
**3. 타입 일관성:** `AudioEngine` 인터페이스(loadAndPlay/pause/resume/setEqPreset/getAnalyser/destroy)가 Task3 정의 → Task5 usePlayer에서 동일 사용. `EQPresetName`이 Task1 정의 → Task3/5/7 일관. `Track.streamUrl`/`isPlayable`(Phase 1)와 `addRecentPlay`/`cacheTrack`(Phase 2) 시그니처 일치. `usePlayer().play(track, list?)`가 Task5 정의 → Task7 뷰 연결에서 일치.

**범위 주의:** Phase 4 전용. 레거시(listModal/audioInstance 등) 제거는 Phase 5, 성능/연출 정리는 Phase 6.
