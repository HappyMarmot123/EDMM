# Phase 2 — Dexie 로컬 데이터 레이어 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase DB를 대체하는 Dexie(IndexedDB) 로컬 우선 저장소를 도입하고, 좋아요·최근재생·플레이리스트를 Dexie repository + `useLiveQuery`로 구현한다(낙관적 업데이트 계승).

**Architecture:** Dexie 데이터베이스 1개(`EDMMDatabase`) + 테이블별 repository 함수(순수, 테스트 가능). React는 `dexie-react-hooks`의 `useLiveQuery`로 반응형 구독. 기존 Zustand `favoriteStore`/`recentPlayStore`는 repository 위 얇은 훅으로 대체한다.

**Tech Stack:** Dexie 4, dexie-react-hooks 4, TypeScript 6, Jest (fake-indexeddb), React 19.

## Global Constraints

- 매 태스크 종료 시 `npm test` 통과.
- 데이터는 **기기 로컬(IndexedDB)** 만 사용. 인증/유저ID 없음 — favorites는 `trackId`만으로 식별.
- `Track` 도메인 모델(Phase 1, `@/entities/track/model`)을 trackCache 페이로드로 사용.
- 이 단계에서 Supabase 쿼리 파일을 **삭제하지 않는다**(앱 green; 제거는 Phase 5). 새 Dexie 경로를 추가하고 신규 UI가 그것을 쓰게 한다.
- Jest 환경에서 IndexedDB는 `fake-indexeddb`로 대체한다(devDependency 추가).

---

## File Structure

- Create: `src/shared/db/edmmDB.ts` — Dexie DB 정의(테이블/인덱스)
- Create: `src/shared/db/repositories/favoritesRepo.ts`
- Create: `src/shared/db/repositories/recentPlaysRepo.ts`
- Create: `src/shared/db/repositories/playlistsRepo.ts`
- Create: `src/shared/db/repositories/trackCacheRepo.ts`
- Create: `src/features/library/hooks/useFavorites.ts` — `useLiveQuery` 기반
- Create: `src/features/library/hooks/useRecentPlays.ts`
- Create: `src/features/library/hooks/usePlaylists.ts`
- Modify: `jest.setup.js` — `import "fake-indexeddb/auto";`
- Test: `src/shared/db/repositories/__tests__/*.test.ts`

---

### Task 1: Dexie DB 정의 + 테스트 환경

**Files:**
- Create: `src/shared/db/edmmDB.ts`
- Modify: `jest.setup.js`
- Modify: `package.json` (fake-indexeddb)
- Test: `src/shared/db/__tests__/edmmDB.test.ts`

**Interfaces:**
- Consumes: `Track` (`@/entities/track/model`)
- Produces: `db` (EDMMDatabase 인스턴스), 테이블 타입 `FavoriteRow`, `PlaylistRow`, `PlaylistTrackRow`, `RecentPlayRow`, `TrackCacheRow`

- [ ] **Step 1: fake-indexeddb 설치 + setup 등록**

```bash
npm install -D fake-indexeddb
```
`jest.setup.js` 최상단에 추가:
```js
import "fake-indexeddb/auto";
```

- [ ] **Step 2: 실패하는 테스트 작성**

```ts
// src/shared/db/__tests__/edmmDB.test.ts
import { db } from "../edmmDB";

afterEach(async () => { await db.delete(); await db.open(); });

it("opens with expected tables", () => {
  expect(db.tables.map((t) => t.name).sort()).toEqual(
    ["favorites", "playlistTracks", "playlists", "recentPlays", "trackCache"]
  );
});
```

- [ ] **Step 3: 실패 확인** — Run: `npm test -- edmmDB.test.ts` → FAIL

- [ ] **Step 4: 최소 구현**

```ts
// src/shared/db/edmmDB.ts
import Dexie, { Table } from "dexie";
import { Track } from "@/entities/track/model";

export interface FavoriteRow { id?: number; trackId: string; addedAt: number; }
export interface PlaylistRow { id?: number; name: string; createdAt: number; }
export interface PlaylistTrackRow { id?: number; playlistId: number; trackId: string; order: number; }
export interface RecentPlayRow { id?: number; trackId: string; playedAt: number; }
export interface TrackCacheRow { trackId: string; payload: Track; cachedAt: number; }

export class EDMMDatabase extends Dexie {
  favorites!: Table<FavoriteRow, number>;
  playlists!: Table<PlaylistRow, number>;
  playlistTracks!: Table<PlaylistTrackRow, number>;
  recentPlays!: Table<RecentPlayRow, number>;
  trackCache!: Table<TrackCacheRow, string>;

  constructor() {
    super("edmm");
    this.version(1).stores({
      favorites: "++id, &trackId, addedAt",
      playlists: "++id, name, createdAt",
      playlistTracks: "++id, playlistId, trackId, order",
      recentPlays: "++id, trackId, playedAt",
      trackCache: "trackId, cachedAt",
    });
  }
}

export const db = new EDMMDatabase();
```

- [ ] **Step 5: 통과 확인** — Run: `npm test -- edmmDB.test.ts` → PASS

- [ ] **Step 6: 커밋**

```bash
git add src/shared/db/edmmDB.ts jest.setup.js package.json package-lock.json src/shared/db/__tests__
git commit -m "feat(db): add Dexie EDMMDatabase and fake-indexeddb test setup"
```

---

### Task 2: favorites repository (낙관적 토글 계승)

**Files:**
- Create: `src/shared/db/repositories/favoritesRepo.ts`
- Test: `src/shared/db/repositories/__tests__/favoritesRepo.test.ts`

**Interfaces:**
- Consumes: `db`, `FavoriteRow`
- Produces:
  - `async function addFavorite(trackId: string): Promise<void>`
  - `async function removeFavorite(trackId: string): Promise<void>`
  - `async function toggleFavorite(trackId: string): Promise<boolean>` — 토글 후 상태 반환
  - `async function isFavorite(trackId: string): Promise<boolean>`
  - `async function getAllFavorites(): Promise<FavoriteRow[]>`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/shared/db/repositories/__tests__/favoritesRepo.test.ts
import { db } from "@/shared/db/edmmDB";
import { toggleFavorite, isFavorite, getAllFavorites } from "../favoritesRepo";

afterEach(async () => { await db.delete(); await db.open(); });

it("toggles favorite on and off", async () => {
  expect(await isFavorite("t1")).toBe(false);
  expect(await toggleFavorite("t1")).toBe(true);
  expect(await isFavorite("t1")).toBe(true);
  expect((await getAllFavorites()).length).toBe(1);
  expect(await toggleFavorite("t1")).toBe(false);
  expect(await isFavorite("t1")).toBe(false);
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- favoritesRepo.test.ts` → FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/shared/db/repositories/favoritesRepo.ts
import { db, FavoriteRow } from "@/shared/db/edmmDB";

export async function isFavorite(trackId: string): Promise<boolean> {
  return (await db.favorites.where("trackId").equals(trackId).count()) > 0;
}
export async function addFavorite(trackId: string): Promise<void> {
  if (!(await isFavorite(trackId))) {
    await db.favorites.add({ trackId, addedAt: Date.now() });
  }
}
export async function removeFavorite(trackId: string): Promise<void> {
  await db.favorites.where("trackId").equals(trackId).delete();
}
export async function toggleFavorite(trackId: string): Promise<boolean> {
  return db.transaction("rw", db.favorites, async () => {
    if (await isFavorite(trackId)) {
      await removeFavorite(trackId);
      return false;
    }
    await addFavorite(trackId);
    return true;
  });
}
export async function getAllFavorites(): Promise<FavoriteRow[]> {
  return db.favorites.orderBy("addedAt").reverse().toArray();
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- favoritesRepo.test.ts` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/db/repositories/favoritesRepo.ts src/shared/db/repositories/__tests__/favoritesRepo.test.ts
git commit -m "feat(db): add favorites repository with transactional toggle"
```

---

### Task 3: recentPlays repository (상한 50개)

**Files:**
- Create: `src/shared/db/repositories/recentPlaysRepo.ts`
- Test: `src/shared/db/repositories/__tests__/recentPlaysRepo.test.ts`

**Interfaces:**
- Consumes: `db`, `RecentPlayRow`
- Produces:
  - `async function addRecentPlay(trackId: string): Promise<void>` — 중복 제거 후 최신화, 최대 50개 유지
  - `async function getRecentPlays(): Promise<RecentPlayRow[]>`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/shared/db/repositories/__tests__/recentPlaysRepo.test.ts
import { db } from "@/shared/db/edmmDB";
import { addRecentPlay, getRecentPlays } from "../recentPlaysRepo";

afterEach(async () => { await db.delete(); await db.open(); });

it("keeps most recent first and dedupes", async () => {
  await addRecentPlay("a");
  await addRecentPlay("b");
  await addRecentPlay("a"); // re-play a
  const rows = await getRecentPlays();
  expect(rows.map((r) => r.trackId)).toEqual(["a", "b"]);
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- recentPlaysRepo.test.ts` → FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/shared/db/repositories/recentPlaysRepo.ts
import { db, RecentPlayRow } from "@/shared/db/edmmDB";

const MAX_RECENT = 50;

export async function addRecentPlay(trackId: string): Promise<void> {
  await db.transaction("rw", db.recentPlays, async () => {
    await db.recentPlays.where("trackId").equals(trackId).delete();
    await db.recentPlays.add({ trackId, playedAt: Date.now() });
    const count = await db.recentPlays.count();
    if (count > MAX_RECENT) {
      const oldest = await db.recentPlays.orderBy("playedAt").limit(count - MAX_RECENT).primaryKeys();
      await db.recentPlays.bulkDelete(oldest);
    }
  });
}
export async function getRecentPlays(): Promise<RecentPlayRow[]> {
  return db.recentPlays.orderBy("playedAt").reverse().toArray();
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- recentPlaysRepo.test.ts` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/db/repositories/recentPlaysRepo.ts src/shared/db/repositories/__tests__/recentPlaysRepo.test.ts
git commit -m "feat(db): add recentPlays repository with dedupe and cap"
```

---

### Task 4: playlists repository

**Files:**
- Create: `src/shared/db/repositories/playlistsRepo.ts`
- Test: `src/shared/db/repositories/__tests__/playlistsRepo.test.ts`

**Interfaces:**
- Consumes: `db`, `PlaylistRow`, `PlaylistTrackRow`
- Produces:
  - `async function createPlaylist(name: string): Promise<number>` (생성된 id)
  - `async function addTrackToPlaylist(playlistId: number, trackId: string): Promise<void>` (order 자동 증가)
  - `async function getPlaylistTracks(playlistId: number): Promise<string[]>` (order 순 trackId)
  - `async function getPlaylists(): Promise<PlaylistRow[]>`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/shared/db/repositories/__tests__/playlistsRepo.test.ts
import { db } from "@/shared/db/edmmDB";
import { createPlaylist, addTrackToPlaylist, getPlaylistTracks } from "../playlistsRepo";

afterEach(async () => { await db.delete(); await db.open(); });

it("creates playlist and appends tracks in order", async () => {
  const id = await createPlaylist("My Mix");
  await addTrackToPlaylist(id, "t1");
  await addTrackToPlaylist(id, "t2");
  expect(await getPlaylistTracks(id)).toEqual(["t1", "t2"]);
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- playlistsRepo.test.ts` → FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/shared/db/repositories/playlistsRepo.ts
import { db, PlaylistRow } from "@/shared/db/edmmDB";

export async function createPlaylist(name: string): Promise<number> {
  return db.playlists.add({ name, createdAt: Date.now() });
}
export async function getPlaylists(): Promise<PlaylistRow[]> {
  return db.playlists.orderBy("createdAt").reverse().toArray();
}
export async function addTrackToPlaylist(playlistId: number, trackId: string): Promise<void> {
  const order = await db.playlistTracks.where("playlistId").equals(playlistId).count();
  await db.playlistTracks.add({ playlistId, trackId, order });
}
export async function getPlaylistTracks(playlistId: number): Promise<string[]> {
  const rows = await db.playlistTracks.where("playlistId").equals(playlistId).sortBy("order");
  return rows.map((r) => r.trackId);
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- playlistsRepo.test.ts` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/db/repositories/playlistsRepo.ts src/shared/db/repositories/__tests__/playlistsRepo.test.ts
git commit -m "feat(db): add playlists repository"
```

---

### Task 5: trackCache repository

**Files:**
- Create: `src/shared/db/repositories/trackCacheRepo.ts`
- Test: `src/shared/db/repositories/__tests__/trackCacheRepo.test.ts`

**Interfaces:**
- Consumes: `db`, `Track`, `TrackCacheRow`
- Produces:
  - `async function cacheTrack(track: Track): Promise<void>`
  - `async function getCachedTrack(trackId: string): Promise<Track | undefined>`
  - `async function getCachedTracks(trackIds: string[]): Promise<Track[]>`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/shared/db/repositories/__tests__/trackCacheRepo.test.ts
import { db } from "@/shared/db/edmmDB";
import { cacheTrack, getCachedTrack } from "../trackCacheRepo";
import { Track } from "@/entities/track/model";

afterEach(async () => { await db.delete(); await db.open(); });

const t: Track = { id: "audius:1", source: "audius", title: "S", artistId: "a", artistName: "N", artworkUrl: "u", durationMs: 1, metadata: {} };

it("caches and retrieves a track", async () => {
  await cacheTrack(t);
  expect((await getCachedTrack("audius:1"))?.title).toBe("S");
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- trackCacheRepo.test.ts` → FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/shared/db/repositories/trackCacheRepo.ts
import { db } from "@/shared/db/edmmDB";
import { Track } from "@/entities/track/model";

export async function cacheTrack(track: Track): Promise<void> {
  await db.trackCache.put({ trackId: track.id, payload: track, cachedAt: Date.now() });
}
export async function getCachedTrack(trackId: string): Promise<Track | undefined> {
  return (await db.trackCache.get(trackId))?.payload;
}
export async function getCachedTracks(trackIds: string[]): Promise<Track[]> {
  const rows = await db.trackCache.bulkGet(trackIds);
  return rows.filter((r): r is NonNullable<typeof r> => !!r).map((r) => r.payload);
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- trackCacheRepo.test.ts` → PASS

- [ ] **Step 5: 커밋**

```bash
git add src/shared/db/repositories/trackCacheRepo.ts src/shared/db/repositories/__tests__/trackCacheRepo.test.ts
git commit -m "feat(db): add trackCache repository"
```

---

### Task 6: React 훅 (useFavorites / useRecentPlays / usePlaylists) — useLiveQuery

**Files:**
- Create: `src/features/library/hooks/useFavorites.ts`
- Create: `src/features/library/hooks/useRecentPlays.ts`
- Create: `src/features/library/hooks/usePlaylists.ts`
- Test: `src/test/features/library/useFavorites.test.tsx`

**Interfaces:**
- Consumes: repositories (Task 2~4), `useLiveQuery`
- Produces:
  - `useFavorites()` → `{ favoriteIds: Set<string>; toggle: (id: string) => Promise<void>; isFavorite: (id: string) => boolean }`
  - `useRecentPlays()` → `{ recentIds: string[] }`
  - `usePlaylists()` → `{ playlists: PlaylistRow[]; create: (name: string) => Promise<number> }`

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
// src/test/features/library/useFavorites.test.tsx
import { renderHook, act, waitFor } from "@testing-library/react";
import { db } from "@/shared/db/edmmDB";
import { useFavorites } from "@/features/library/hooks/useFavorites";

afterEach(async () => { await db.delete(); await db.open(); });

it("reflects toggled favorite reactively", async () => {
  const { result } = renderHook(() => useFavorites());
  await act(async () => { await result.current.toggle("t1"); });
  await waitFor(() => expect(result.current.isFavorite("t1")).toBe(true));
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- useFavorites.test.tsx` → FAIL

- [ ] **Step 3: 최소 구현**

```ts
// src/features/library/hooks/useFavorites.ts
import { useLiveQuery } from "dexie-react-hooks";
import { getAllFavorites, toggleFavorite as toggleRepo } from "@/shared/db/repositories/favoritesRepo";

export function useFavorites() {
  const rows = useLiveQuery(getAllFavorites, [], []);
  const favoriteIds = new Set(rows.map((r) => r.trackId));
  return {
    favoriteIds,
    isFavorite: (id: string) => favoriteIds.has(id),
    toggle: async (id: string) => { await toggleRepo(id); },
  };
}
```
```ts
// src/features/library/hooks/useRecentPlays.ts
import { useLiveQuery } from "dexie-react-hooks";
import { getRecentPlays } from "@/shared/db/repositories/recentPlaysRepo";
export function useRecentPlays() {
  const rows = useLiveQuery(getRecentPlays, [], []);
  return { recentIds: rows.map((r) => r.trackId) };
}
```
```ts
// src/features/library/hooks/usePlaylists.ts
import { useLiveQuery } from "dexie-react-hooks";
import { getPlaylists, createPlaylist } from "@/shared/db/repositories/playlistsRepo";
export function usePlaylists() {
  const playlists = useLiveQuery(getPlaylists, [], []);
  return { playlists, create: (name: string) => createPlaylist(name) };
}
```

- [ ] **Step 4: 통과 확인** — Run: `npm test -- useFavorites.test.tsx` → PASS

- [ ] **Step 5: 빌드 + 전체 테스트 게이트**

Run: `npm run build && npm test`
Expected: 성공 / 통과

- [ ] **Step 6: 커밋**

```bash
git add src/features/library src/test/features/library
git commit -m "feat(library): add Dexie-backed useFavorites/useRecentPlays/usePlaylists hooks"
```

---

## Self-Review

**1. Spec 커버리지** (설계서 §6 대비): §6.1 스키마(favorites/playlists/playlistTracks/recentPlays/trackCache)→Task1; §6.2 이행(Zustand→Dexie repo + useLiveQuery, 낙관적 토글 계승)→Task2,6. 기존 Supabase 쿼리 제거는 Phase 5에서 처리(green 유지).
**2. Placeholder 스캔:** 모든 단계 실제 코드 포함. 없음.
**3. 타입 일관성:** Row 타입(`FavoriteRow` 등)이 Task1 정의 → Task2~6에서 동일 사용. `toggleFavorite(trackId): Promise<boolean>` 시그니처가 Task2 정의와 Task6 사용에서 일치. `Track`은 Phase 1 모델 그대로 trackCache 페이로드에 사용.

**범위 주의:** Phase 2 전용. Supabase/Drizzle 실제 제거는 Phase 5.
