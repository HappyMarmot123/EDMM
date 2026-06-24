# Phase 3 — 라우트/페이지 골격 + views 레이어 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 단일 페이지 앱을 멀티 라우트(홈/검색/트랙상세/보관함)로 분리하고, 페이지 조립 전용 `views` 레이어와 공통 트랙 리스트 위젯을 도입한다.

**Architecture:** App Router 라우트(`app/*/page.tsx`)는 얇은 진입점으로 `views/*` 컴포넌트를 렌더한다. `views`는 features 훅(Phase 1/2)과 widgets(`trackList`)를 조립한다. FSD 단방향 의존성 유지: `app → views → widgets → features → entities → shared`.

**Tech Stack:** Next 16 App Router, React 19, TanStack Query 5, Dexie hooks, Tailwind 4.

## Global Constraints

- 매 태스크 종료 시 `npm run build` 성공 + `npm test` 통과.
- 새 라우트는 Phase 1 훅(`useTrending`/`useTrackSearch`)과 Phase 2 훅(`useFavorites`/`useRecentPlays`)을 소비한다. 외부 API/DB 직접 호출 금지.
- 기존 랜딩(`app/page.tsx → widgets/landing`)은 이 단계에서 **제거하지 않고** 홈을 새 라우트로 추가·전환 준비만 한다. 랜딩 연출 정리는 Phase 6.
- 재생 트리거는 공통 `onPlay(track)` 콜백으로 위젯에서 위로 전달(실제 플레이어 연결은 Phase 4). 이 단계에서는 `onPlay`를 prop으로 받아 no-op/console로 둔다.
- 모든 페이지는 `loading.tsx`를 갖는다.

---

## File Structure

- Create: `src/widgets/trackList/index.tsx` — `Track[]` 렌더 + 좋아요 토글 + onPlay
- Create: `src/widgets/trackList/trackRow.tsx`
- Create: `src/views/home/index.tsx` — 트렌딩 섹션
- Create: `src/views/search/index.tsx` — 검색 입력 + 결과
- Create: `src/views/trackDetail/index.tsx` — 트랙 정보 + 가사
- Create: `src/views/library/index.tsx` — 좋아요/최근
- Create: `src/app/search/page.tsx`, `src/app/search/loading.tsx`
- Create: `src/app/track/[id]/page.tsx`, `src/app/track/[id]/loading.tsx`
- Create: `src/app/library/page.tsx`, `src/app/library/loading.tsx`
- Create: `src/widgets/navSidebar/index.tsx` — 라우트 네비게이션
- Test: `src/test/widgets/trackList.test.tsx`, `src/test/views/*.test.tsx`

---

### Task 1: 공통 trackList 위젯

**Files:**
- Create: `src/widgets/trackList/index.tsx`
- Create: `src/widgets/trackList/trackRow.tsx`
- Test: `src/test/widgets/trackList.test.tsx`

**Interfaces:**
- Consumes: `Track` (entities), `useFavorites` (Phase 2)
- Produces:
  - `interface TrackListProps { tracks: Track[]; onPlay: (track: Track) => void; isLoading?: boolean; }`
  - `function TrackList(props: TrackListProps): JSX.Element`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/widgets/trackList.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import TrackList from "@/widgets/trackList";
import { Track } from "@/entities/track/model";

jest.mock("@/features/library/hooks/useFavorites", () => ({
  useFavorites: () => ({ favoriteIds: new Set(), isFavorite: () => false, toggle: jest.fn() }),
}));

const tracks: Track[] = [
  { id: "audius:1", source: "audius", title: "Song A", artistId: "a", artistName: "DJ", artworkUrl: "u", durationMs: 1000, metadata: {} },
];

it("renders rows and fires onPlay on click", () => {
  const onPlay = jest.fn();
  render(<TrackList tracks={tracks} onPlay={onPlay} />);
  expect(screen.getByText("Song A")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Song A"));
  expect(onPlay).toHaveBeenCalledWith(tracks[0]);
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- trackList.test.tsx` → FAIL

- [ ] **Step 3: 최소 구현**

```tsx
// src/widgets/trackList/trackRow.tsx
"use client";
import { Track } from "@/entities/track/model";

export default function TrackRow({
  track, onPlay, isFavorite, onToggleFavorite,
}: {
  track: Track; onPlay: (t: Track) => void;
  isFavorite: boolean; onToggleFavorite: (id: string) => void;
}) {
  return (
    <li className="flex items-center gap-3 p-2 hover:bg-white/5">
      <button className="flex-1 text-left" onClick={() => onPlay(track)}>
        <span className="block font-medium">{track.title}</span>
        <span className="block text-sm opacity-70">{track.artistName}</span>
      </button>
      <button aria-label="favorite" onClick={() => onToggleFavorite(track.id)}>
        {isFavorite ? "♥" : "♡"}
      </button>
    </li>
  );
}
```
```tsx
// src/widgets/trackList/index.tsx
"use client";
import { Track } from "@/entities/track/model";
import { useFavorites } from "@/features/library/hooks/useFavorites";
import TrackRow from "./trackRow";

export interface TrackListProps {
  tracks: Track[];
  onPlay: (track: Track) => void;
  isLoading?: boolean;
}

export default function TrackList({ tracks, onPlay, isLoading }: TrackListProps) {
  const { isFavorite, toggle } = useFavorites();
  if (isLoading) return <p className="p-4 opacity-70">불러오는 중…</p>;
  if (tracks.length === 0) return <p className="p-4 opacity-70">트랙이 없습니다.</p>;
  return (
    <ul>
      {tracks.map((t) => (
        <TrackRow key={t.id} track={t} onPlay={onPlay} isFavorite={isFavorite(t.id)} onToggleFavorite={toggle} />
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- trackList.test.tsx` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/widgets/trackList src/test/widgets/trackList.test.tsx
git commit -m "feat(widgets): add reusable TrackList with favorite toggle and onPlay"
```

---

### Task 2: 홈(디스커버) 뷰 + 라우트 전환

**Files:**
- Create: `src/views/home/index.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/loading.tsx` (이미 존재하면 유지)
- Test: `src/test/views/home.test.tsx`

**Interfaces:**
- Consumes: `useTrending` (Phase 1), `TrackList` (Task 1)
- Produces: `function HomeView({ onPlay }: { onPlay: (t: Track) => void }): JSX.Element`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/views/home.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomeView from "@/views/home";

jest.mock("@/features/discover/hooks/useTrending", () => ({
  useTrending: () => ({ data: [
    { id: "audius:1", source: "audius", title: "Trend1", artistId: "a", artistName: "DJ", artworkUrl: "", durationMs: 1, metadata: {} },
  ], isLoading: false }),
}));
jest.mock("@/features/library/hooks/useFavorites", () => ({
  useFavorites: () => ({ favoriteIds: new Set(), isFavorite: () => false, toggle: jest.fn() }),
}));

it("renders trending tracks", async () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <HomeView onPlay={jest.fn()} />
    </QueryClientProvider>
  );
  await waitFor(() => expect(screen.getByText("Trend1")).toBeInTheDocument());
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- home.test.tsx` → FAIL

- [ ] **Step 3: 최소 구현**

```tsx
// src/views/home/index.tsx
"use client";
import { Track } from "@/entities/track/model";
import { useTrending } from "@/features/discover/hooks/useTrending";
import TrackList from "@/widgets/trackList";

export default function HomeView({ onPlay }: { onPlay: (t: Track) => void }) {
  const { data, isLoading } = useTrending();
  return (
    <section className="p-4">
      <h1 className="text-2xl font-bold mb-4">트렌딩</h1>
      <TrackList tracks={data ?? []} onPlay={onPlay} isLoading={isLoading} />
    </section>
  );
}
```
`src/app/page.tsx`를 새 홈 뷰로 전환(임시 onPlay는 Phase 4에서 연결):
```tsx
// src/app/page.tsx
import HomeView from "@/views/home";
const Page: React.FC = () => <HomeView onPlay={() => {}} />;
export default Page;
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- home.test.tsx` → PASS

- [ ] **Step 5: 빌드 게이트** — Run: `npm run build` → 성공

- [ ] **Step 6: 커밋**

```bash
git add src/views/home src/app/page.tsx src/test/views/home.test.tsx
git commit -m "feat(views): add Home discover view and switch root route"
```

---

### Task 3: 검색 뷰 + `/search` 라우트

**Files:**
- Create: `src/views/search/index.tsx`
- Create: `src/app/search/page.tsx`, `src/app/search/loading.tsx`
- Test: `src/test/views/search.test.tsx`

**Interfaces:**
- Consumes: `useTrackSearch` (Phase 1), `TrackList`
- Produces: `function SearchView({ onPlay }): JSX.Element` (내부에서 debounce 입력 상태 관리)

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/views/search.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SearchView from "@/views/search";

jest.mock("@/features/search/hooks/useTrackSearch", () => ({
  useTrackSearch: (q: string) => ({
    data: q ? [{ id: "audius:9", source: "audius", title: "Result", artistId: "a", artistName: "X", artworkUrl: "", durationMs: 1, metadata: {} }] : [],
    isLoading: false,
  }),
}));
jest.mock("@/features/library/hooks/useFavorites", () => ({
  useFavorites: () => ({ favoriteIds: new Set(), isFavorite: () => false, toggle: jest.fn() }),
}));

it("shows results after typing", async () => {
  render(<QueryClientProvider client={new QueryClient()}><SearchView onPlay={jest.fn()} /></QueryClientProvider>);
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "edm" } });
  await waitFor(() => expect(screen.getByText("Result")).toBeInTheDocument());
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- search.test.tsx` → FAIL

- [ ] **Step 3: 최소 구현**

```tsx
// src/views/search/index.tsx
"use client";
import { useState } from "react";
import { Track } from "@/entities/track/model";
import { useTrackSearch } from "@/features/search/hooks/useTrackSearch";
import TrackList from "@/widgets/trackList";

export default function SearchView({ onPlay }: { onPlay: (t: Track) => void }) {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useTrackSearch(query);
  return (
    <section className="p-4">
      <input
        type="search" role="searchbox" placeholder="트랙·아티스트 검색"
        className="w-full p-2 rounded bg-white/10 mb-4"
        value={query} onChange={(e) => setQuery(e.target.value)}
      />
      <TrackList tracks={data ?? []} onPlay={onPlay} isLoading={isLoading && !!query} />
    </section>
  );
}
```
```tsx
// src/app/search/page.tsx
import SearchView from "@/views/search";
export default function Page() { return <SearchView onPlay={() => {}} />; }
```
```tsx
// src/app/search/loading.tsx
export default function Loading() { return <p className="p-4 opacity-70">검색 준비 중…</p>; }
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- search.test.tsx` → PASS

- [ ] **Step 5: 빌드 게이트** — Run: `npm run build` → 성공

- [ ] **Step 6: 커밋**

```bash
git add src/views/search src/app/search src/test/views/search.test.tsx
git commit -m "feat(views): add Search view and /search route"
```

---

### Task 4: 트랙 상세 뷰 + `/track/[id]` 라우트 (가사)

**Files:**
- Create: `src/views/trackDetail/index.tsx`
- Create: `src/app/track/[id]/page.tsx`, `src/app/track/[id]/loading.tsx`
- Test: `src/test/views/trackDetail.test.tsx`

**Interfaces:**
- Consumes: `getCachedTrack` (Phase 2), `useLyrics` (Phase 1)
- Produces: `function TrackDetailView({ trackId }: { trackId: string }): JSX.Element`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/views/trackDetail.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TrackDetailView from "@/views/trackDetail";

jest.mock("@/shared/db/repositories/trackCacheRepo", () => ({
  getCachedTrack: jest.fn(async () => ({ id: "audius:1", source: "audius", title: "Song A", artistId: "a", artistName: "DJ", artworkUrl: "", durationMs: 1, metadata: {} })),
}));
jest.mock("@/features/lyrics/hooks/useLyrics", () => ({ useLyrics: () => ({ data: "la la la" }) }));

it("renders track title and lyrics", async () => {
  render(<QueryClientProvider client={new QueryClient()}><TrackDetailView trackId="audius:1" /></QueryClientProvider>);
  await waitFor(() => expect(screen.getByText("Song A")).toBeInTheDocument());
  expect(screen.getByText("la la la")).toBeInTheDocument();
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- trackDetail.test.tsx` → FAIL

- [ ] **Step 3: 최소 구현**

```tsx
// src/views/trackDetail/index.tsx
"use client";
import { useEffect, useState } from "react";
import { Track } from "@/entities/track/model";
import { getCachedTrack } from "@/shared/db/repositories/trackCacheRepo";
import { useLyrics } from "@/features/lyrics/hooks/useLyrics";

export default function TrackDetailView({ trackId }: { trackId: string }) {
  const [track, setTrack] = useState<Track | null>(null);
  useEffect(() => { getCachedTrack(trackId).then((t) => setTrack(t ?? null)); }, [trackId]);
  const { data: lyrics } = useLyrics(track?.artistName ?? "", track?.title ?? "");
  if (!track) return <p className="p-4 opacity-70">트랙 정보를 찾을 수 없습니다.</p>;
  return (
    <section className="p-4">
      <h1 className="text-2xl font-bold">{track.title}</h1>
      <p className="opacity-70 mb-4">{track.artistName}</p>
      <pre className="whitespace-pre-wrap">{lyrics ?? "가사를 찾을 수 없습니다."}</pre>
    </section>
  );
}
```
```tsx
// src/app/track/[id]/page.tsx
import TrackDetailView from "@/views/trackDetail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TrackDetailView trackId={decodeURIComponent(id)} />;
}
```
```tsx
// src/app/track/[id]/loading.tsx
export default function Loading() { return <p className="p-4 opacity-70">트랙 불러오는 중…</p>; }
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- trackDetail.test.tsx` → PASS

- [ ] **Step 5: 빌드 게이트** — Run: `npm run build` → 성공

- [ ] **Step 6: 커밋**

```bash
git add src/views/trackDetail src/app/track src/test/views/trackDetail.test.tsx
git commit -m "feat(views): add TrackDetail view with lyrics and /track/[id] route"
```

---

### Task 5: 보관함 뷰 + `/library` 라우트

**Files:**
- Create: `src/views/library/index.tsx`
- Create: `src/app/library/page.tsx`, `src/app/library/loading.tsx`
- Test: `src/test/views/library.test.tsx`

**Interfaces:**
- Consumes: `useFavorites`, `useRecentPlays` (Phase 2), `getCachedTracks` (Phase 2), `TrackList`
- Produces: `function LibraryView({ onPlay }): JSX.Element`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/views/library.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import LibraryView from "@/views/library";

jest.mock("@/features/library/hooks/useFavorites", () => ({
  useFavorites: () => ({ favoriteIds: new Set(["audius:1"]), isFavorite: () => true, toggle: jest.fn() }),
}));
jest.mock("@/features/library/hooks/useRecentPlays", () => ({ useRecentPlays: () => ({ recentIds: [] }) }));
jest.mock("@/shared/db/repositories/trackCacheRepo", () => ({
  getCachedTracks: jest.fn(async () => [{ id: "audius:1", source: "audius", title: "Liked", artistId: "a", artistName: "DJ", artworkUrl: "", durationMs: 1, metadata: {} }]),
}));

it("renders liked tracks", async () => {
  render(<LibraryView onPlay={jest.fn()} />);
  await waitFor(() => expect(screen.getByText("Liked")).toBeInTheDocument());
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- library.test.tsx` → FAIL

- [ ] **Step 3: 최소 구현**

```tsx
// src/views/library/index.tsx
"use client";
import { useEffect, useState } from "react";
import { Track } from "@/entities/track/model";
import { useFavorites } from "@/features/library/hooks/useFavorites";
import { getCachedTracks } from "@/shared/db/repositories/trackCacheRepo";
import TrackList from "@/widgets/trackList";

export default function LibraryView({ onPlay }: { onPlay: (t: Track) => void }) {
  const { favoriteIds } = useFavorites();
  const [tracks, setTracks] = useState<Track[]>([]);
  useEffect(() => { getCachedTracks([...favoriteIds]).then(setTracks); }, [favoriteIds]);
  return (
    <section className="p-4">
      <h1 className="text-2xl font-bold mb-4">좋아요</h1>
      <TrackList tracks={tracks} onPlay={onPlay} />
    </section>
  );
}
```
```tsx
// src/app/library/page.tsx
import LibraryView from "@/views/library";
export default function Page() { return <LibraryView onPlay={() => {}} />; }
```
```tsx
// src/app/library/loading.tsx
export default function Loading() { return <p className="p-4 opacity-70">보관함 불러오는 중…</p>; }
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- library.test.tsx` → PASS

- [ ] **Step 5: 빌드 게이트** — Run: `npm run build` → 성공

- [ ] **Step 6: 커밋**

```bash
git add src/views/library src/app/library src/test/views/library.test.tsx
git commit -m "feat(views): add Library view and /library route"
```

---

### Task 6: 네비게이션 사이드바 + 전역 레이아웃 연결

**Files:**
- Create: `src/widgets/navSidebar/index.tsx`
- Modify: `src/app/layout.tsx`
- Test: `src/test/widgets/navSidebar.test.tsx`

**Interfaces:**
- Consumes: next/link
- Produces: `function NavSidebar(): JSX.Element` (홈/검색/보관함 링크)

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/widgets/navSidebar.test.tsx
import { render, screen } from "@testing-library/react";
import NavSidebar from "@/widgets/navSidebar";
it("renders nav links", () => {
  render(<NavSidebar />);
  expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: "검색" })).toHaveAttribute("href", "/search");
  expect(screen.getByRole("link", { name: "보관함" })).toHaveAttribute("href", "/library");
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- navSidebar.test.tsx` → FAIL

- [ ] **Step 3: 최소 구현**

```tsx
// src/widgets/navSidebar/index.tsx
import Link from "next/link";
const items = [
  { href: "/", label: "홈" },
  { href: "/search", label: "검색" },
  { href: "/library", label: "보관함" },
];
export default function NavSidebar() {
  return (
    <nav className="flex flex-col gap-2 p-4">
      {items.map((it) => (
        <Link key={it.href} href={it.href} className="hover:underline">{it.label}</Link>
      ))}
    </nav>
  );
}
```
`src/app/layout.tsx`의 body 내부에 `<NavSidebar />`를 페이지 콘텐츠와 함께 배치(기존 provider 구조 유지하며 레이아웃 컨테이너만 추가).

- [ ] **Step 4: 통과 확인** — Run: `npm test -- navSidebar.test.tsx` → PASS

- [ ] **Step 5: 빌드 + 전체 테스트 + 스모크**

Run: `npm run build && npm test`
Expected: 성공 / 통과. 이어 `npm run dev`로 `/`, `/search`, `/library`, `/track/<id>` 이동 확인.

- [ ] **Step 6: 커밋**

```bash
git add src/widgets/navSidebar src/app/layout.tsx src/test/widgets/navSidebar.test.tsx
git commit -m "feat(widgets): add NavSidebar and wire routes into layout"
```

---

## Self-Review

**1. Spec 커버리지** (설계서 §4 레이어 재편 + §9 페이지 맵): views 신설→Task2~5; 라우트 `/`,`/search`,`/track/[id]`,`/library`→Task2~5; trackList 위젯→Task1; navSidebar→Task6. `/artist/[id]`,`/playlist/[id]`(P1)는 동일 패턴으로 후속 추가 — 본 계획은 P0 라우트 골격에 집중. listModal 폐기는 Phase 5(플레이어가 라우트로 대체된 뒤).
**2. Placeholder 스캔:** 모든 단계 실제 코드 포함. `onPlay`는 의도적으로 Phase 4에서 연결되는 인터페이스로, prop 시그니처를 명시하고 임시 no-op을 제공 — placeholder 아님.
**3. 타입 일관성:** `Track`(entities) 일관 사용. `TrackListProps.onPlay: (track: Track) => void`가 Task1 정의 → Task2~5 뷰에서 동일 시그니처로 전달. Phase 1/2 훅 시그니처(`useTrending`, `useTrackSearch`, `useFavorites`, `getCachedTrack(s)`)와 일치.

**범위 주의:** Phase 3 전용. 실제 재생 연결은 Phase 4, 레거시 제거는 Phase 5, 연출/성능은 Phase 6.
