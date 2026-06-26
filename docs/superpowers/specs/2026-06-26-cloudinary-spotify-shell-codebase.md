# EDMM Cloudinary + Spotify Shell 개편: 3단계 코드베이스 기반 구체화

작성일: 2026-06-26

## 목적

2단계 기획설계를 실제 코드베이스의 파일 단위 작업으로 고정한다. 이 문서는 구현 계획과 Subagent task 분리의 기준이다.

## 현재 활성 구조

### Route

- `src/app/page.tsx`
  - landing 전용.
- `src/app/search/page.tsx`
  - `SearchView`를 `AudioPlayerShell`로 감싸 렌더링.
- `src/app/library/page.tsx`
  - `LibraryView`를 `AudioPlayerShell`로 감싸 렌더링.
- `src/app/track/[id]/page.tsx`
  - `trackId`를 추출해 `TrackDetailPageClient`에 전달.
- `src/app/track/[id]/trackDetailPageClient.tsx`
  - `TrackDetailView`를 `AudioPlayerShell`로 감싸 렌더링.

### Providers

- `src/app/appProviders.tsx`
  - `TanstackProvider`, `AudioPlayerProvider`, `ToggleProvider`를 제공.
  - `AudioPlayerWidget`을 전역 마운트.
- `src/widgets/audioPlayer/audioPlayerShell.tsx`
  - 현재는 `playTrack` render prop만 제공.
  - shell 개편 후에는 삭제하거나 호환 wrapper로 축소 가능.

### Data

- `src/entities/track/model.ts`
  - `Track.source`가 `"audius"`만 허용.
- `src/shared/api/audius/audiusAdapter.ts`
  - Audius raw track normalization.
- `src/shared/api/audius/audiusClient.ts`
  - Audius host discovery, trending, search.
- `src/app/api/audius/*`
  - search, trending, stream route.
- `src/shared/db/repositories/trackCacheRepo.ts`
  - `Track` 전체 payload cache.
- `src/shared/db/repositories/favoritesRepo.ts`
  - favorite ID CRUD.
- `src/shared/db/repositories/recentPlaysRepo.ts`
  - recent play ID CRUD.

### Views and Widgets

- `src/views/search/index.tsx`
  - full-page Audius search UI.
  - browse cards, quick search, Audius source label, result list.
- `src/views/library/index.tsx`
  - favorite/recent tracks를 cached tracks로 hydrate.
- `src/views/trackDetail/index.tsx`
  - full-page track detail.
  - lyrics hook 호출.
- `src/widgets/trackList/*`
  - simple row list with play/favorite/detail link.
- `src/features/audio/*`
  - global desktop/mobile player.
- `src/features/landing/components/dustySnow.tsx`
  - star count and star position generation.
- `src/shared/styles/global.css`
  - landing starfield CSS와 player seek CSS.

## 생성할 파일

### Cloudinary data

- `src/shared/api/cloudinary/cloudinaryAdapter.ts`
  - `CloudinaryResource` type
  - `adaptCloudinaryTrack(resource): Track`
  - filename/title fallback helpers
- `src/shared/api/cloudinary/cloudinaryClient.ts`
  - `fetchCloudinaryTracks(query?: string): Promise<Track[]>`
  - env validation
  - Basic auth header generation
  - Admin Search URL/expression construction
  - short in-memory cache
- `src/shared/api/cloudinary/__tests__/cloudinaryAdapter.test.ts`
  - raw mp3/video resource mapping tests
  - sparse metadata fallback tests
- `src/shared/api/cloudinary/__tests__/cloudinaryClient.test.ts`
  - env validation
  - Search URL, folder expression, query expression, auth header
  - upstream failure
- `src/app/api/cloudinary/tracks/route.ts`
  - Next route returning `Track[]`
- `src/test/app/api/cloudinary/tracks.route.test.ts`
  - route success and 502/500 paths
- `src/features/cloudinary/hooks/useCloudinaryTracks.ts`
  - TanStack Query hook and Dexie cache side effect
- `src/test/features/cloudinary/useCloudinaryTracks.test.tsx`
  - no Audius URL, route call, cache behavior, error behavior

### Unified shell

- `src/widgets/musicShell/index.tsx`
  - unified app shell client component
  - owns search query, active view, selected track ID
  - renders header/main/aside
- `src/widgets/musicShell/musicTrackList.tsx`
  - shell-specific track rows with artwork, duration, favorite, selected state
- `src/widgets/musicShell/musicShellHeader.tsx`
  - brand, search box, view controls
- `src/widgets/musicShell/trackDetailAside.tsx`
  - cache-backed detail panel
- `src/test/widgets/musicShell.test.tsx`
  - Cloudinary list, favorites view, search, aside selection, play

### Route compatibility

- `src/app/library/page.tsx`
  - change to redirect `/search?view=favorites`
- `src/app/track/[id]/page.tsx`
  - redirect to `/search?track=<encoded-id>`
- `src/test/app/musicRoutes.test.tsx`
  - route redirect behavior

## 수정할 파일

### Domain

- `src/entities/track/model.ts`
  - `source: "audius" | "cloudinary"` or preferably `TrackSource` alias.

### Search view

- `src/views/search/index.tsx`
  - replace current full-page Audius search with `MusicShell`.
  - remove Audius labels and browse card dependency from active runtime path.

### Player

- `src/features/audio/ui/audioPlayer.tsx`
  - keep fixed bottom container.
  - update inner grid to left/center/right.
- `src/features/audio/components/playerControlsSection.tsx`
  - focus on center transport controls and volume/right controls.
  - keep keyboard handling.
- `src/features/audio/components/playerTrackDetails.tsx`
  - refine seek bar states and labels.
- `src/features/audio/components/albumArtwork.tsx`
  - remove persistent rotation from desktop player artwork.
- `src/features/audio/ui/mobileAudioPlayer.tsx`
  - align mini-player style with desktop.

### Landing

- `src/features/landing/components/dustySnow.tsx`
  - reduce default `count`.
  - emit `left` as `%`.
- `src/shared/styles/global.css`
  - `.rose-starfield` right-aligned 80% width.

### Tests to update

- `src/entities/track/__tests__/model.test.ts`
  - allow `cloudinary` source.
- `src/test/views/search.test.tsx`
  - rewrite around Cloudinary unified shell behavior.
- `src/test/features/search/useTrackSearch.test.tsx`
  - replace with Cloudinary hook tests or remove after hook removal.
- `src/test/app/api/audius/route.test.ts`
  - retire from active suite if Audius route files are removed.
- `src/test/features/audio/audioPlayer.test.tsx`
  - update for 3-zone player and artwork/detail navigation target.
- `src/test/features/landing/roseSpaceBackground.test.tsx`
  - assert reduced count and right-aligned starfield if appropriate.

## 삭제 또는 비활성화 후보

The code should remove active external music API paths when replacement is in place.

- `src/shared/api/audius/*`
- `src/app/api/audius/*`
- `src/features/discover/hooks/useTrending.ts`
- `src/test/features/discover/*`
- `src/test/app/api/audius/route.test.ts`
- `src/shared/api/lyrics/*`
- `src/app/api/lyrics/route.ts`
- `src/features/lyrics/hooks/useLyrics.ts`
- `src/test/features/lyrics/*`
- `src/test/app/api/lyrics/*`

Deletion should happen after Cloudinary list, playback, detail, and favorites pass their targeted tests. If any deleted file is still imported, TypeScript should catch it.

## Query and Cache Behavior

Recommended `useCloudinaryTracks` behavior:

- Blank query fetches all Cloudinary tracks from the configured folder.
- Nonblank query fetches Cloudinary search results scoped to the configured folder.
- Each returned track is cached with `cacheTrack`.
- Cache failures are logged but do not fail the UI.
- TanStack `staleTime`: 2 to 5 minutes.
- Server-side in-memory cache: 30 to 60 seconds, keyed by normalized query.

## Filename Fallback Rule

Current Cloudinary sample:

```text
edmm/media-pipeline/aespa 에스파 'LEMONADE' MV
```

Fallback parsing should be conservative:

- Base filename becomes title candidate.
- If context/metadata title exists, use it.
- If context/metadata artist exists, use it.
- If no artist exists, use `"Cloudinary"`.
- Do not attempt fragile artist/title parsing from every filename pattern in the first implementation.

## UI Copy Replacements

Remove or replace Audius-specific copy:

- `Searching Audius...` -> `Loading Cloudinary tracks...`
- `Audius track` -> `Cloudinary track`
- `Rose search` can become `Cloudinary catalog` or `EDMM catalog`
- Browse cards that imply external discovery should become catalog filters or quick local searches.

## Verification Commands

Run targeted tests during tasks:

- `npm test -- src/shared/api/cloudinary/__tests__/cloudinaryAdapter.test.ts`
- `npm test -- src/shared/api/cloudinary/__tests__/cloudinaryClient.test.ts`
- `npm test -- src/test/app/api/cloudinary/tracks.route.test.ts`
- `npm test -- src/test/features/cloudinary/useCloudinaryTracks.test.tsx`
- `npm test -- src/test/widgets/musicShell.test.tsx`
- `npm test -- src/test/features/audio/audioPlayer.test.tsx`
- `npm test -- src/test/features/landing/roseSpaceBackground.test.tsx`

Final verification:

- `npm test -- --runInBand`
- `npx tsc --noEmit`

## Implementation Constraint

Implementation must be TDD-first. For each behavior-changing task:

1. Write a failing test.
2. Run the test and confirm the expected failure.
3. Implement the minimal code.
4. Run the targeted test and confirm pass.
5. Run broader checks before completion.
