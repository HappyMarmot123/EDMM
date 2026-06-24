# Phase 1 — 외부 API 어댑터 + Route 프록시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 키 없는 외부 음악 API(Audius/Deezer/lyrics.ovh 등)를 Next route handler 프록시 + 어댑터로 감싸 공통 도메인 모델(`Track`/`Artist`/`Album`)로 정규화하고, 재생 가능한 풀트랙 카탈로그를 확보한다.

**Architecture:** 모든 외부 호출은 `app/api/*` route handler를 경유(CORS·User-Agent·레이트리밋 제어). 각 소스별 raw client는 응답을 받고, Adapter가 도메인 모델로 정규화한다. 클라이언트는 TanStack Query 훅으로 도메인 모델만 소비한다.

**Tech Stack:** Next 16 route handlers, TypeScript 6, TanStack Query 5, Jest/RTL.

## Global Constraints

- 매 태스크 종료 시 `npm test` 통과 + 관련 라우트 빌드 성공.
- 외부 API는 **키 불필요**한 것만 사용. 재생 소스 = **Audius**(풀트랙). Deezer는 메타/30초 preview 보강.
- 도메인 모델은 본 계획 Task 1에서 확정한 형태가 **이후 모든 단계(2~6)의 단일 진실원천**이다. 필드명/타입을 임의 변경 금지.
- 기존 `UnifiedTrack`(`src/shared/types/dataType.ts`)와 Adapter 패턴 자산을 계승한다.
- 이 단계에서 Cloudinary/Spotify 호출을 **삭제하지 않는다**(앱 green 유지; 제거는 Phase 5).

---

## File Structure

- Create: `src/entities/track/model.ts` — `Track` 도메인 타입 + 타입가드
- Create: `src/entities/artist/model.ts` — `Artist` 타입
- Create: `src/entities/album/model.ts` — `Album` 타입
- Create: `src/shared/api/audius/audiusClient.ts` — Audius raw 호출(호스트 디스커버리 포함)
- Create: `src/shared/api/audius/audiusAdapter.ts` — Audius 응답 → `Track`
- Create: `src/shared/api/deezer/deezerClient.ts`, `deezerAdapter.ts`
- Create: `src/shared/api/lyrics/lyricsClient.ts`
- Create: `src/app/api/audius/trending/route.ts`, `src/app/api/audius/search/route.ts`, `src/app/api/audius/stream/[id]/route.ts`
- Create: `src/app/api/deezer/search/route.ts`
- Create: `src/app/api/lyrics/route.ts`
- Create: `src/features/discover/hooks/useTrending.ts`
- Create: `src/features/search/hooks/useTrackSearch.ts`
- Create: `src/features/lyrics/hooks/useLyrics.ts`
- Test: 각 어댑터/클라이언트/훅에 대응하는 `__tests__` 또는 `src/test/**`

---

### Task 1: 도메인 모델 확정 (`Track`/`Artist`/`Album`)

**Files:**
- Create: `src/entities/track/model.ts`
- Create: `src/entities/artist/model.ts`
- Create: `src/entities/album/model.ts`
- Test: `src/entities/track/__tests__/model.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `interface Track { id: string; source: "audius" | "deezer"; title: string; artistId: string; artistName: string; albumName?: string; artworkUrl: string; durationMs: number; streamUrl?: string; metadata: Record<string, unknown>; }`
  - `interface Artist { id: string; name: string; imageUrl?: string; bio?: string; }`
  - `interface Album { id: string; title: string; artworkUrl: string; artistName: string; trackIds: string[]; }`
  - `function isPlayable(t: Track): boolean` — `streamUrl`이 존재하면 true

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/entities/track/__tests__/model.test.ts
import { Track, isPlayable } from "../model";

describe("Track model", () => {
  const base: Track = {
    id: "audius:1", source: "audius", title: "T", artistId: "a1",
    artistName: "A", artworkUrl: "u", durationMs: 1000, metadata: {},
  };
  it("isPlayable is false without streamUrl", () => {
    expect(isPlayable(base)).toBe(false);
  });
  it("isPlayable is true with streamUrl", () => {
    expect(isPlayable({ ...base, streamUrl: "https://x" })).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- track/__tests__/model.test.ts`
Expected: FAIL ("Cannot find module ../model")

- [ ] **Step 3: 최소 구현**

```ts
// src/entities/track/model.ts
export interface Track {
  id: string;
  source: "audius" | "deezer";
  title: string;
  artistId: string;
  artistName: string;
  albumName?: string;
  artworkUrl: string;
  durationMs: number;
  streamUrl?: string;
  metadata: Record<string, unknown>;
}
export function isPlayable(t: Track): boolean {
  return typeof t.streamUrl === "string" && t.streamUrl.length > 0;
}
```
```ts
// src/entities/artist/model.ts
export interface Artist { id: string; name: string; imageUrl?: string; bio?: string; }
```
```ts
// src/entities/album/model.ts
export interface Album { id: string; title: string; artworkUrl: string; artistName: string; trackIds: string[]; }
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- track/__tests__/model.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/entities/track src/entities/artist src/entities/album
git commit -m "feat(entities): add Track/Artist/Album domain models"
```

---

### Task 2: Audius 어댑터 (응답 → Track)

**Files:**
- Create: `src/shared/api/audius/audiusAdapter.ts`
- Test: `src/shared/api/audius/__tests__/audiusAdapter.test.ts`

**Interfaces:**
- Consumes: `Track` (Task 1)
- Produces: `function adaptAudiusTrack(raw: AudiusTrackRaw): Track`, `interface AudiusTrackRaw`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/shared/api/audius/__tests__/audiusAdapter.test.ts
import { adaptAudiusTrack } from "../audiusAdapter";

const raw = {
  id: "abc",
  title: "Song",
  user: { id: "u1", name: "DJ" },
  duration: 180, // seconds
  artwork: { "480x480": "https://art/480.jpg" },
};

describe("adaptAudiusTrack", () => {
  it("normalizes audius track to domain Track", () => {
    const t = adaptAudiusTrack(raw as any);
    expect(t.id).toBe("audius:abc");
    expect(t.source).toBe("audius");
    expect(t.artistId).toBe("u1");
    expect(t.artistName).toBe("DJ");
    expect(t.durationMs).toBe(180000);
    expect(t.artworkUrl).toBe("https://art/480.jpg");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- audiusAdapter.test.ts`
Expected: FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/shared/api/audius/audiusAdapter.ts
import { Track } from "@/entities/track/model";

export interface AudiusTrackRaw {
  id: string;
  title: string;
  user: { id: string; name: string };
  duration: number; // seconds
  artwork?: Record<string, string> | null;
}

export function adaptAudiusTrack(raw: AudiusTrackRaw): Track {
  const artworkUrl =
    raw.artwork?.["480x480"] ?? raw.artwork?.["150x150"] ?? "";
  return {
    id: `audius:${raw.id}`,
    source: "audius",
    title: raw.title,
    artistId: raw.user.id,
    artistName: raw.user.name,
    artworkUrl,
    durationMs: raw.duration * 1000,
    streamUrl: `/api/audius/stream/${raw.id}`,
    metadata: { rawId: raw.id },
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- audiusAdapter.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/api/audius/audiusAdapter.ts src/shared/api/audius/__tests__
git commit -m "feat(api): add Audius track adapter"
```

---

### Task 3: Audius client (호스트 디스커버리 + trending/search)

**Files:**
- Create: `src/shared/api/audius/audiusClient.ts`
- Test: `src/shared/api/audius/__tests__/audiusClient.test.ts`

**Interfaces:**
- Consumes: `adaptAudiusTrack`, `Track`
- Produces:
  - `async function getAudiusHost(): Promise<string>` — `https://api.audius.co`에서 호스트 1개 선택(캐시)
  - `async function fetchTrending(genre?: string): Promise<Track[]>`
  - `async function searchAudiusTracks(query: string): Promise<Track[]>`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/shared/api/audius/__tests__/audiusClient.test.ts
import { fetchTrending } from "../audiusClient";

global.fetch = jest.fn();

describe("fetchTrending", () => {
  beforeEach(() => (global.fetch as jest.Mock).mockReset());

  it("returns adapted tracks", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: ["https://host1"] }) }) // host discovery
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [
        { id: "x", title: "S", user: { id: "u", name: "N" }, duration: 60, artwork: { "480x480": "a" } },
      ] }) });
    const tracks = await fetchTrending();
    expect(tracks[0].id).toBe("audius:x");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- audiusClient.test.ts`
Expected: FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/shared/api/audius/audiusClient.ts
import { Track } from "@/entities/track/model";
import { adaptAudiusTrack, AudiusTrackRaw } from "./audiusAdapter";

const APP_NAME = "EDMM";
let cachedHost: string | null = null;

export async function getAudiusHost(): Promise<string> {
  if (cachedHost) return cachedHost;
  const res = await fetch("https://api.audius.co");
  if (!res.ok) throw new Error("Audius host discovery failed");
  const { data } = (await res.json()) as { data: string[] };
  cachedHost = data[0];
  return cachedHost;
}

export async function fetchTrending(genre?: string): Promise<Track[]> {
  const host = await getAudiusHost();
  const url = new URL(`${host}/v1/tracks/trending`);
  url.searchParams.set("app_name", APP_NAME);
  if (genre) url.searchParams.set("genre", genre);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Audius trending failed");
  const { data } = (await res.json()) as { data: AudiusTrackRaw[] };
  return data.map(adaptAudiusTrack);
}

export async function searchAudiusTracks(query: string): Promise<Track[]> {
  const host = await getAudiusHost();
  const url = new URL(`${host}/v1/tracks/search`);
  url.searchParams.set("app_name", APP_NAME);
  url.searchParams.set("query", query);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Audius search failed");
  const { data } = (await res.json()) as { data: AudiusTrackRaw[] };
  return data.map(adaptAudiusTrack);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- audiusClient.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/api/audius/audiusClient.ts src/shared/api/audius/__tests__/audiusClient.test.ts
git commit -m "feat(api): add Audius client with host discovery, trending, search"
```

---

### Task 4: Audius route handlers (trending/search/stream 프록시)

**Files:**
- Create: `src/app/api/audius/trending/route.ts`
- Create: `src/app/api/audius/search/route.ts`
- Create: `src/app/api/audius/stream/[id]/route.ts`
- Test: `src/test/app/api/audius/route.test.ts`

**Interfaces:**
- Consumes: `fetchTrending`, `searchAudiusTracks`, `getAudiusHost`
- Produces: `GET /api/audius/trending?genre=`, `GET /api/audius/search?q=`, `GET /api/audius/stream/[id]` (302 redirect to host stream)

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/test/app/api/audius/route.test.ts
import { GET } from "@/app/api/audius/trending/route";
jest.mock("@/shared/api/audius/audiusClient", () => ({
  fetchTrending: jest.fn(async () => [{ id: "audius:1" }]),
}));

it("trending route returns json array", async () => {
  const res = await GET(new Request("http://x/api/audius/trending"));
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body[0].id).toBe("audius:1");
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- audius/route.test.ts`
Expected: FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/app/api/audius/trending/route.ts
import { NextResponse } from "next/server";
import { fetchTrending } from "@/shared/api/audius/audiusClient";

export async function GET(req: Request) {
  const genre = new URL(req.url).searchParams.get("genre") ?? undefined;
  try {
    return NextResponse.json(await fetchTrending(genre));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
```
```ts
// src/app/api/audius/search/route.ts
import { NextResponse } from "next/server";
import { searchAudiusTracks } from "@/shared/api/audius/audiusClient";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (!q) return NextResponse.json([]);
  try {
    return NextResponse.json(await searchAudiusTracks(q));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
```
```ts
// src/app/api/audius/stream/[id]/route.ts
import { NextResponse } from "next/server";
import { getAudiusHost } from "@/shared/api/audius/audiusClient";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const host = await getAudiusHost();
  return NextResponse.redirect(`${host}/v1/tracks/${id}/stream?app_name=EDMM`);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- audius/route.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/app/api/audius src/test/app/api/audius
git commit -m "feat(api): add Audius route handlers (trending/search/stream proxy)"
```

---

### Task 5: Deezer 어댑터 + client + 검색 route (메타/preview 보강)

**Files:**
- Create: `src/shared/api/deezer/deezerAdapter.ts`, `deezerClient.ts`
- Create: `src/app/api/deezer/search/route.ts`
- Test: `src/shared/api/deezer/__tests__/deezerAdapter.test.ts`

**Interfaces:**
- Consumes: `Track`
- Produces: `function adaptDeezerTrack(raw): Track` (`source: "deezer"`, `streamUrl = raw.preview`), `async function searchDeezer(q: string): Promise<Track[]>`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/shared/api/deezer/__tests__/deezerAdapter.test.ts
import { adaptDeezerTrack } from "../deezerAdapter";
it("maps deezer preview to streamUrl", () => {
  const t = adaptDeezerTrack({
    id: 7, title: "D", duration: 200,
    artist: { id: 9, name: "Ar" }, album: { title: "Al", cover_medium: "c" },
    preview: "https://prev.mp3",
  } as any);
  expect(t.id).toBe("deezer:7");
  expect(t.source).toBe("deezer");
  expect(t.streamUrl).toBe("https://prev.mp3");
  expect(t.durationMs).toBe(200000);
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- deezerAdapter.test.ts` → FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/shared/api/deezer/deezerAdapter.ts
import { Track } from "@/entities/track/model";
export interface DeezerTrackRaw {
  id: number; title: string; duration: number;
  artist: { id: number; name: string };
  album: { title: string; cover_medium?: string };
  preview: string;
}
export function adaptDeezerTrack(raw: DeezerTrackRaw): Track {
  return {
    id: `deezer:${raw.id}`,
    source: "deezer",
    title: raw.title,
    artistId: String(raw.artist.id),
    artistName: raw.artist.name,
    albumName: raw.album.title,
    artworkUrl: raw.album.cover_medium ?? "",
    durationMs: raw.duration * 1000,
    streamUrl: raw.preview,
    metadata: { rawId: raw.id },
  };
}
```
```ts
// src/shared/api/deezer/deezerClient.ts
import { adaptDeezerTrack, DeezerTrackRaw } from "./deezerAdapter";
import { Track } from "@/entities/track/model";
export async function searchDeezer(q: string): Promise<Track[]> {
  const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Deezer search failed");
  const { data } = (await res.json()) as { data: DeezerTrackRaw[] };
  return data.map(adaptDeezerTrack);
}
```
```ts
// src/app/api/deezer/search/route.ts
import { NextResponse } from "next/server";
import { searchDeezer } from "@/shared/api/deezer/deezerClient";
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (!q) return NextResponse.json([]);
  try { return NextResponse.json(await searchDeezer(q)); }
  catch (e) { return NextResponse.json({ error: String(e) }, { status: 502 }); }
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- deezerAdapter.test.ts` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/api/deezer src/app/api/deezer
git commit -m "feat(api): add Deezer adapter/client/search route"
```

---

### Task 6: lyrics.ovh client + route

**Files:**
- Create: `src/shared/api/lyrics/lyricsClient.ts`
- Create: `src/app/api/lyrics/route.ts`
- Test: `src/shared/api/lyrics/__tests__/lyricsClient.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `async function fetchLyrics(artist: string, title: string): Promise<string | null>`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/shared/api/lyrics/__tests__/lyricsClient.test.ts
import { fetchLyrics } from "../lyricsClient";
global.fetch = jest.fn();
it("returns lyrics string", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ lyrics: "la la" }) });
  expect(await fetchLyrics("A", "T")).toBe("la la");
});
it("returns null on 404", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });
  expect(await fetchLyrics("A", "T")).toBeNull();
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- lyricsClient.test.ts` → FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/shared/api/lyrics/lyricsClient.ts
export async function fetchLyrics(artist: string, title: string): Promise<string | null> {
  const res = await fetch(
    `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { lyrics?: string };
  return data.lyrics ?? null;
}
```
```ts
// src/app/api/lyrics/route.ts
import { NextResponse } from "next/server";
import { fetchLyrics } from "@/shared/api/lyrics/lyricsClient";
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const artist = sp.get("artist") ?? "";
  const title = sp.get("title") ?? "";
  return NextResponse.json({ lyrics: await fetchLyrics(artist, title) });
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- lyricsClient.test.ts` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/api/lyrics src/app/api/lyrics
git commit -m "feat(api): add lyrics.ovh client and route"
```

---

### Task 7: TanStack Query 훅 (useTrending / useTrackSearch / useLyrics)

**Files:**
- Create: `src/features/discover/hooks/useTrending.ts`
- Create: `src/features/search/hooks/useTrackSearch.ts`
- Create: `src/features/lyrics/hooks/useLyrics.ts`
- Test: `src/test/features/discover/useTrending.test.tsx`

**Interfaces:**
- Consumes: `/api/audius/trending`, `/api/audius/search`, `/api/lyrics`, `Track`
- Produces: `useTrending(genre?)`, `useTrackSearch(query)`, `useLyrics(artist, title)` — 각기 `UseQueryResult`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/features/discover/useTrending.test.tsx
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTrending } from "@/features/discover/hooks/useTrending";

global.fetch = jest.fn(async () => ({ ok: true, json: async () => [{ id: "audius:1" }] })) as any;

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

it("fetches trending tracks", async () => {
  const { result } = renderHook(() => useTrending(), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.[0].id).toBe("audius:1");
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- useTrending.test.tsx` → FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/features/discover/hooks/useTrending.ts
import { useQuery } from "@tanstack/react-query";
import { Track } from "@/entities/track/model";

async function getTrending(genre?: string): Promise<Track[]> {
  const res = await fetch(`/api/audius/trending${genre ? `?genre=${genre}` : ""}`);
  if (!res.ok) throw new Error("trending fetch failed");
  return res.json();
}
export function useTrending(genre?: string) {
  return useQuery({
    queryKey: ["trending", genre ?? "all"],
    queryFn: () => getTrending(genre),
    staleTime: 5 * 60_000,
  });
}
```
```ts
// src/features/search/hooks/useTrackSearch.ts
import { useQuery } from "@tanstack/react-query";
import { Track } from "@/entities/track/model";

async function search(q: string): Promise<Track[]> {
  const res = await fetch(`/api/audius/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("search failed");
  return res.json();
}
export function useTrackSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => search(query),
    enabled: query.trim().length > 0,
    staleTime: 60_000,
  });
}
```
```ts
// src/features/lyrics/hooks/useLyrics.ts
import { useQuery } from "@tanstack/react-query";

async function getLyrics(artist: string, title: string): Promise<string | null> {
  const res = await fetch(`/api/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`);
  if (!res.ok) return null;
  return (await res.json()).lyrics ?? null;
}
export function useLyrics(artist: string, title: string) {
  return useQuery({
    queryKey: ["lyrics", artist, title],
    queryFn: () => getLyrics(artist, title),
    enabled: !!artist && !!title,
    staleTime: Infinity,
  });
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- useTrending.test.tsx` → PASS

- [ ] **Step 5: 빌드 + 전체 테스트 게이트**

Run: `npm run build && npm test`
Expected: 성공 / 통과

- [ ] **Step 6: 커밋**

```bash
git add src/features/discover src/features/search src/features/lyrics src/test/features/discover
git commit -m "feat(features): add TanStack Query hooks for trending/search/lyrics"
```

---

## Self-Review

**1. Spec 커버리지** (설계서 §5 대비): §5.1 도메인 모델→Task1; §5.2 API 역할(Audius/Deezer/lyrics)→Task2~6; §5.3 route 프록시 경유 + TanStack Query→Task4,7. MusicBrainz/Wikipedia/TheAudioDB는 아티스트 페이지(Phase 3·후속)에서 동일 패턴으로 추가 — 본 계획은 P0 재생/검색/가사에 집중.
**2. Placeholder 스캔:** 모든 코드 단계에 실제 코드 포함, "TBD/적절히" 없음.
**3. 타입 일관성:** `Track`(id에 `source:` prefix, `durationMs`, `streamUrl`)이 Task1 정의 → Task2/5 어댑터, Task3/7 client/hook에서 동일하게 사용. `getAudiusHost`/`fetchTrending`/`searchAudiusTracks` 시그니처가 Task3 정의와 Task4 사용에서 일치.

**범위 주의:** 본 계획은 Phase 1 전용. 도메인 모델은 Phase 2~6의 단일 진실원천.
