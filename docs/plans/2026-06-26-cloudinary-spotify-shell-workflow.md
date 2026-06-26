# Cloudinary + Spotify Style Shell Migration (2026-06-26)

- Date: 2026-06-26
- Owner: EDMM refactor pass
- Delivery mode: Subagent-Driven

## 1) Idea Proposal and Screening

- Use Cloudinary only as runtime catalog source.
- Remove external music APIs from the request path (audius / stream / lyrics).
- Move all main list and detail interaction into `/search` as a single shell.
- Keep landing stars lower and anchored to right-side 80% area.

## 2) Architecture Plan

- Data source
  - `GET /api/cloudinary/tracks`
  - server-side `fetchCloudinaryTracks`, client hook `useCloudinaryTracks`
- Shell layout
  - Header + main list + footer
  - Detail panel in right `aside`
- Detail/deep links
  - `/library` redirects to `/search?view=favorites`
  - `/track/[id]` redirects to `/search?track=<encodedId>`
- Player UX
  - Updated controls with shuffle/repeat toggles and status label
  - Improved progress header time row

## 3) Implementation Mapping

- `src/features/cloudinary/*`
- `src/widgets/musicShell/*`
- `src/app/search/page.tsx`, `src/app/search/searchPageClient.tsx`
- `src/app/library/page.tsx`, `src/app/track/[id]/page.tsx`
- `src/features/landing/components/dustySnow.tsx`, `src/shared/styles/global.css`
- `src/features/audio/components/playerControlsSection.tsx`, `src/features/audio/components/playerTrackDetails.tsx`

## 4) Document Review

- Tests and docs were aligned with the merged shell and Cloudinary-only flow.
- Search/list states and track detail expectations were updated where list source changed.

## 5) Task Split

- Task A: remove external APIs and switch catalog queries to Cloudinary.
- Task B: merge Favorites/Search surface and route behavior.
- Task C: apply Spotify-like shell structure and aside detail area.
- Task D: polish player control UX and add shuffle/repeat controls.
- Task E: tune landing stars and run cleanup checks (including `.tmp` scan).

## 6) Implementation Status

- [x] Cloudinary-only catalog queries are active.
- [x] `/search` shell integrated with favorites/recent/all view switching.
- [x] `/library` and `/track/[id]` now redirect to shell-compatible flows.
- [x] Detail area is rendered inside the right aside.
- [x] Player controls improved with shuffle/repeat controls.
- [x] Player progress header and timing labels improved.
- [x] Landing starfield reduced and positioned to right 80% width.
- [x] `/search` Next.js page props type corrected (`searchParams` is Promise-based).
- [x] `.tmp` scan performed (no `.tmp` directory/file found).

## 7) Validation Checklist

- `npm test`
- `npm run lint`
- `npm run build`
- `npm test -- src/test/app/musicRoutes.test.tsx src/test/views/search.test.tsx src/test/widgets/musicShell.test.tsx src/test/widgets/trackList.test.tsx`
