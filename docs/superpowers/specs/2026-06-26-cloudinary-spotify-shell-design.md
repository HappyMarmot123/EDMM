# EDMM Cloudinary + Spotify Shell 개편: 2단계 기획설계

작성일: 2026-06-26

## 목표

EDMM의 음악 영역을 Cloudinary 소유 음원 catalog 기반으로 재구성하고, Search/Favorites/Detail/Player를 Spotify 웹앱에 가까운 단일 shell 경험으로 묶는다. 기존 외부 음악 API(Audius, lyrics)는 active runtime path에서 제거한다.

## 제품 방향

이 개편의 첫 화면은 랜딩이 아니라 실제 음악 앱 사용 경험이다. 사용자는 `/search`에서 Cloudinary 음원 목록을 바로 보고, 검색어로 좁히고, favorite을 토글하고, 트랙을 재생하며, 오른쪽 aside에서 선택한 트랙 정보를 확인한다.

시각 방향은 Spotify의 구조적 밀도를 따르되 색상과 브랜드 톤은 EDMM의 rose-on-black 세계를 유지한다.

- App surface: 거의 검정에 가까운 배경, 낮은 대비의 panel, 명확한 hover/focus state
- Accent: Spotify green을 그대로 복제하지 않고 EDMM rose accent를 유지
- Typography: compact, scan-first, track title과 control label의 위계 명확화
- Motion: player와 landing의 장식 모션은 줄이고, 사용자가 컨트롤하는 상태 변화에 집중

## 정보 구조

### 라우트

- `/`: 기존 landing 유지. 단, starfield 밀도와 너비를 조정한다.
- `/search`: 통합 music app shell의 canonical route.
- `/library`: `/search?view=favorites`로 redirect한다.
- `/track/[id]`: `/search?track=<encoded-id>`로 redirect하거나, 서버 redirect가 어렵다면 client에서 unified shell로 이동시킨다.

### Shell Layout

Desktop:

```text
┌────────────────────────────────────────────────────────────┐
│ Header: brand / search input / view toggles / status        │
├──────────────────────────────────────┬─────────────────────┤
│ Main: Cloudinary list + filters       │ Aside: Track detail │
│ - All tracks                          │ - artwork/title     │
│ - Favorites                           │ - artist/album      │
│ - Recent                              │ - source metadata   │
│ - Empty/error/loading states          │ - actions           │
├──────────────────────────────────────┴─────────────────────┤
│ Footer player: track info / controls+seek / volume          │
└────────────────────────────────────────────────────────────┘
```

Mobile:

```text
┌────────────────────────────┐
│ Header + search             │
├────────────────────────────┤
│ Track list                  │
│ Detail opens inline/sheet   │
├────────────────────────────┤
│ Mini player                 │
└────────────────────────────┘
```

The right aside is a true app panel, not a separate decorative card. It should be present on desktop and collapse below the list or into a compact detail section on mobile.

## 데이터 설계

### Cloudinary Track Source

Server-only route:

- `GET /api/cloudinary/tracks`
- Query params:
  - `q`: optional search string
  - `limit`: optional, capped server-side
- Reads:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `CLOUDINARY_AUDIO_FOLDER`

The server route calls Cloudinary Admin Search with `resource_type:video` and the configured folder. It returns normalized `Track[]`.

Client hook:

- `useCloudinaryTracks(query?: string)`
- Calls `/api/cloudinary/tracks?q=...`
- Caches each returned track through `cacheTrack`
- Query key: `["cloudinary-tracks", normalizedQuery]`

### Track Mapping

Cloudinary asset to `Track`:

- `id`: `cloudinary:${asset_id}` when `asset_id` exists; otherwise `cloudinary:${public_id}`
- `source`: `"cloudinary"`
- `title`: context/metadata title if present; otherwise filename-derived fallback
- `artistName`: context/metadata artist if present; otherwise `"Cloudinary"`
- `albumName`: context/metadata album if present; otherwise folder or format label
- `artworkUrl`: Cloudinary artwork metadata if present; otherwise empty string
- `durationMs`: `duration * 1000`
- `streamUrl`: `secure_url`
- `metadata`: includes `publicId`, `assetId`, `format`, `resourceType`, `bytes`, `createdAt`, `tags`, raw context, and raw metadata if Cloudinary returns it

### Search Semantics

Cloudinary is the only music catalog. Search means:

1. Ask Cloudinary Search API for matching assets when `q` is present.
2. Search fields should include public ID, filename, tags, and context through sanitized prefix tokens. Raw user query text must not be interpolated into the Cloudinary expression.
3. Structured metadata is mapped if returned, but is not requested by default because it can depend on Cloudinary account tier. If metadata is sparse, filename fallback remains valid.

No Audius, Spotify, Deezer, MusicBrainz, lyrics.ovh, Wikipedia, or other music discovery APIs are part of this implementation.

## Component 설계

### `features/cloudinary`

Purpose: Cloudinary catalog access and normalization.

- `src/shared/api/cloudinary/cloudinaryAdapter.ts`
  - Pure mapping from raw Cloudinary resource to `Track`
  - Unit-tested without network
- `src/shared/api/cloudinary/cloudinaryClient.ts`
  - Server-only Cloudinary Admin Search call
  - Handles env validation, auth, expression construction, response parsing
- `src/features/cloudinary/hooks/useCloudinaryTracks.ts`
  - Client query hook
  - Caches fetched tracks in Dexie

### `widgets/musicShell`

Purpose: one shell for active music browsing.

- `src/widgets/musicShell/index.tsx`
  - Client component
  - Owns selected track ID, current view, search query
  - Renders header, main list, aside detail
  - Receives `playTrack` from `useAudioPlayer`

### `views/search`

Purpose: route-level composition for `/search`.

- Keep exported `SearchView`, but change its responsibility from full standalone page to unified music app view or a wrapper around `MusicShell`.
- Remove Audius-specific browse copy.
- Show Cloudinary list and favorites inside the same surface.

### `views/library`

Purpose: compatibility only.

- Remove active full-page library experience from runtime path.
- `/library` redirects to `/search?view=favorites`.
- Existing favorite hooks remain reusable.

### `views/trackDetail`

Purpose: detail content usable inside right aside.

- Create `TrackDetailAside` from the current `TrackDetailView` concepts.
- Do not call lyrics API.
- Load from cache by selected `trackId`.
- If selected track is not cached, show a concise empty state.

### `features/audio`

Purpose: player polish, not engine rewrite.

- Keep `AudioPlayerProvider` and playback behavior.
- Rework desktop visual structure into 3-zone grid.
- Keep mobile player, but align styles and states.
- Keep keyboard controls.
- Do not add shuffle/repeat unless already supported by provider.

### `features/landing`

Purpose: scoped starfield adjustment.

- Reduce default `DustySnow` count.
- Make starfield 80% width and right aligned.
- Change star left positions from viewport width to local percentage.

## Error Handling

- Missing Cloudinary env:
  - Server route returns 500 with `{ error: "Cloudinary configuration is missing" }`.
  - Client renders a clear source unavailable state.
- Cloudinary upstream failure:
  - Server route returns 502 with generic error text.
  - Client renders retry action.
- Empty Cloudinary folder:
  - Unified list renders empty state that explains no tracks are available in the configured Cloudinary folder.
- Sparse metadata:
  - Adapter falls back to filename/public ID parsing.
- Uncached detail ID:
  - Aside renders "Select a track from the list" or "Track details are not cached."

## Testing Strategy

Use TDD for implementation tasks.

Required test groups:

- Cloudinary adapter maps raw mp3/video resources to `Track`.
- Cloudinary client builds server request with `resource_type:video`, configured folder, search query, and server-only auth.
- `/api/cloudinary/tracks` returns normalized tracks and handles env/upstream errors.
- `useCloudinaryTracks` calls the new route, caches returned tracks, and does not call Audius.
- Unified `/search` shows Cloudinary tracks, search input, favorites view, and detail aside.
- `/library` redirects or aliases to `/search?view=favorites`.
- `/track/[id]` opens the unified route with detail state.
- Player layout keeps desktop player mounted and renders the new 3-zone controls.
- Landing starfield renders fewer stars and right-aligned 80% starfield.

## Out of Scope

- Uploading new audio to Cloudinary.
- Editing Cloudinary metadata in-app.
- Rebuilding the audio engine.
- Adding shuffle/repeat if not already supported.
- Recreating Spotify branding, exact colors, logos, or protected assets.
- Adding a new external catalog after removing Audius.

## Acceptance Criteria

- `/search` loads a Cloudinary-backed track list.
- Search and Favorite live in one route/surface.
- `/library` no longer presents a separate page.
- Track detail appears in the right aside on desktop.
- Existing external music APIs are not used by active runtime music UI.
- Player footer has a Spotify-like three-zone interaction rhythm and polished controls.
- Landing starfield is sparser, right-aligned, and 80% width.
- Targeted tests and `npx tsc --noEmit` pass.
