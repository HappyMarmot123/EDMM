# Cloudinary Spotify Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the active music catalog with Cloudinary audio resources and reorganize Search/Favorites/Detail/Player into a Spotify-like EDMM app shell.

**Architecture:** Build Cloudinary as a server-only catalog source, normalize it into the existing `Track` model, then render a unified `/search` shell with list, favorites, right-side detail, and global player footer. Keep the audio engine and Dexie repositories; remove active Audius/lyrics runtime paths only after replacement tests pass.

**Tech Stack:** Next.js App Router, React 19, TypeScript, TanStack Query, Dexie, Jest, Testing Library, Tailwind CSS utilities.

---

## Files

Create:

- `src/shared/api/cloudinary/cloudinaryAdapter.ts`
- `src/shared/api/cloudinary/cloudinaryClient.ts`
- `src/shared/api/cloudinary/__tests__/cloudinaryAdapter.test.ts`
- `src/shared/api/cloudinary/__tests__/cloudinaryClient.test.ts`
- `src/app/api/cloudinary/tracks/route.ts`
- `src/test/app/api/cloudinary/tracks.route.test.ts`
- `src/features/cloudinary/hooks/useCloudinaryTracks.ts`
- `src/test/features/cloudinary/useCloudinaryTracks.test.tsx`
- `src/widgets/musicShell/index.tsx`
- `src/widgets/musicShell/musicShellHeader.tsx`
- `src/widgets/musicShell/musicTrackList.tsx`
- `src/widgets/musicShell/trackDetailAside.tsx`
- `src/test/widgets/musicShell.test.tsx`
- `src/test/app/musicRoutes.test.tsx`

Modify:

- `src/entities/track/model.ts`
- `src/entities/track/__tests__/model.test.ts`
- `src/views/search/index.tsx`
- `src/app/library/page.tsx`
- `src/app/track/[id]/page.tsx`
- `src/features/audio/ui/audioPlayer.tsx`
- `src/features/audio/components/playerControlsSection.tsx`
- `src/features/audio/components/playerTrackDetails.tsx`
- `src/features/audio/components/albumArtwork.tsx`
- `src/features/audio/ui/mobileAudioPlayer.tsx`
- `src/test/views/search.test.tsx`
- `src/test/features/audio/audioPlayer.test.tsx`
- `src/features/landing/components/dustySnow.tsx`
- `src/shared/styles/global.css`
- `src/test/features/landing/roseSpaceBackground.test.tsx`

Delete after replacement is green:

- `src/shared/api/audius/audiusAdapter.ts`
- `src/shared/api/audius/audiusClient.ts`
- `src/shared/api/audius/__tests__/audiusAdapter.test.ts`
- `src/shared/api/audius/__tests__/audiusClient.test.ts`
- `src/app/api/audius/search/route.ts`
- `src/app/api/audius/trending/route.ts`
- `src/app/api/audius/stream/[id]/route.ts`
- `src/test/app/api/audius/route.test.ts`
- `src/features/discover/hooks/useTrending.ts`
- `src/test/features/discover/useTrending.test.tsx`
- `src/test/features/discover/useTrending.cache.test.tsx`
- `src/shared/api/lyrics/lyricsClient.ts`
- `src/shared/api/lyrics/__tests__/lyricsClient.test.ts`
- `src/app/api/lyrics/route.ts`
- `src/features/lyrics/hooks/useLyrics.ts`
- `src/test/features/lyrics/useLyrics.test.tsx`
- `src/test/app/api/lyrics/route.test.ts`

---

## Task 1: Cloudinary Track Model and Adapter

**Files:**

- Modify: `src/entities/track/model.ts`
- Modify: `src/entities/track/__tests__/model.test.ts`
- Create: `src/shared/api/cloudinary/cloudinaryAdapter.ts`
- Create: `src/shared/api/cloudinary/__tests__/cloudinaryAdapter.test.ts`

- [ ] **Step 1: Write failing model and adapter tests**

Add `src/shared/api/cloudinary/__tests__/cloudinaryAdapter.test.ts`:

```ts
import { adaptCloudinaryTrack } from "../cloudinaryAdapter";

const raw = {
  asset_id: "asset-1",
  public_id: "edmm/media-pipeline/aespa LEMONADE MV",
  resource_type: "video",
  type: "upload",
  format: "mp3",
  secure_url: "https://res.cloudinary.com/demo/video/upload/aespa.mp3",
  bytes: 6205101,
  duration: 191.28,
  created_at: "2026-06-26T00:00:00Z",
  tags: ["edmm"],
};

describe("adaptCloudinaryTrack", () => {
  it("normalizes a Cloudinary mp3 resource to Track", () => {
    expect(adaptCloudinaryTrack(raw)).toMatchObject({
      id: "cloudinary:asset-1",
      source: "cloudinary",
      title: "aespa LEMONADE MV",
      artistName: "Cloudinary",
      albumName: "media-pipeline",
      artworkUrl: "",
      durationMs: 191280,
      streamUrl: raw.secure_url,
      metadata: {
        publicId: raw.public_id,
        assetId: raw.asset_id,
        format: "mp3",
        resourceType: "video",
        bytes: 6205101,
        tags: ["edmm"],
      },
    });
  });

  it("uses context metadata before filename fallback", () => {
    const track = adaptCloudinaryTrack({
      ...raw,
      context: {
        custom: {
          title: "LEMONADE",
          artist: "aespa",
          album: "Single",
          artworkUrl: "https://example.com/art.jpg",
        },
      },
    });

    expect(track.title).toBe("LEMONADE");
    expect(track.artistName).toBe("aespa");
    expect(track.albumName).toBe("Single");
    expect(track.artworkUrl).toBe("https://example.com/art.jpg");
  });
});
```

Update `src/entities/track/__tests__/model.test.ts` with a Cloudinary source case:

```ts
it("allows Cloudinary tracks to be playable", () => {
  const track: Track = {
    id: "cloudinary:asset-1",
    source: "cloudinary",
    title: "Cloud Track",
    artistId: "cloudinary",
    artistName: "Cloudinary",
    artworkUrl: "",
    durationMs: 1000,
    streamUrl: "https://res.cloudinary.com/demo/video/upload/song.mp3",
    metadata: {},
  };

  expect(isPlayable(track)).toBe(true);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm test -- src/shared/api/cloudinary/__tests__/cloudinaryAdapter.test.ts src/entities/track/__tests__/model.test.ts
```

Expected: fail because `cloudinaryAdapter.ts` does not exist and `Track.source` does not allow `"cloudinary"`.

- [ ] **Step 3: Implement model and adapter**

Change `src/entities/track/model.ts`:

```ts
export type TrackSource = "audius" | "cloudinary";

export interface Track {
  id: string;
  source: TrackSource;
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

Create `src/shared/api/cloudinary/cloudinaryAdapter.ts`:

```ts
import type { Track } from "@/entities/track/model";

type CloudinaryContext = {
  custom?: Record<string, string | undefined>;
};

export interface CloudinaryResource {
  asset_id?: string;
  public_id: string;
  resource_type?: string;
  type?: string;
  format?: string;
  secure_url?: string;
  bytes?: number;
  duration?: number;
  created_at?: string;
  tags?: string[];
  context?: CloudinaryContext;
  metadata?: Record<string, unknown>;
}

const basename = (publicId: string) => {
  const lastSegment = publicId.split("/").filter(Boolean).at(-1) ?? publicId;
  return lastSegment.replace(/\.[a-z0-9]+$/i, "").trim();
};

const folderName = (publicId: string) => {
  const segments = publicId.split("/").filter(Boolean);
  return segments.length > 1 ? segments.at(-2) ?? "Cloudinary" : "Cloudinary";
};

const readString = (
  source: Record<string, unknown> | undefined,
  key: string,
) => {
  const value = source?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

export function adaptCloudinaryTrack(resource: CloudinaryResource): Track {
  const custom = resource.context?.custom;
  const metadata = resource.metadata;
  const assetId = resource.asset_id ?? resource.public_id;
  const title =
    readString(custom, "title") ?? readString(metadata, "title") ?? basename(resource.public_id);
  const artistName =
    readString(custom, "artist") ?? readString(metadata, "artist") ?? "Cloudinary";
  const albumName =
    readString(custom, "album") ?? readString(metadata, "album") ?? folderName(resource.public_id);
  const artworkUrl =
    readString(custom, "artworkUrl") ?? readString(metadata, "artworkUrl") ?? "";

  return {
    id: `cloudinary:${assetId}`,
    source: "cloudinary",
    title,
    artistId: `cloudinary:${artistName}`,
    artistName,
    albumName,
    artworkUrl,
    durationMs: Math.round((resource.duration ?? 0) * 1000),
    streamUrl: resource.secure_url ?? "",
    metadata: {
      publicId: resource.public_id,
      assetId: resource.asset_id,
      format: resource.format,
      resourceType: resource.resource_type,
      type: resource.type,
      bytes: resource.bytes,
      createdAt: resource.created_at,
      tags: resource.tags ?? [],
      context: resource.context,
      cloudinaryMetadata: resource.metadata,
    },
  };
}
```

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```bash
npm test -- src/shared/api/cloudinary/__tests__/cloudinaryAdapter.test.ts src/entities/track/__tests__/model.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/entities/track/model.ts src/entities/track/__tests__/model.test.ts src/shared/api/cloudinary/cloudinaryAdapter.ts src/shared/api/cloudinary/__tests__/cloudinaryAdapter.test.ts
git commit -m "feat(cloudinary): normalize audio resources"
```

---

## Task 2: Cloudinary Client, API Route, and Hook

**Files:**

- Create: `src/shared/api/cloudinary/cloudinaryClient.ts`
- Create: `src/shared/api/cloudinary/__tests__/cloudinaryClient.test.ts`
- Create: `src/app/api/cloudinary/tracks/route.ts`
- Create: `src/test/app/api/cloudinary/tracks.route.test.ts`
- Create: `src/features/cloudinary/hooks/useCloudinaryTracks.ts`
- Create: `src/test/features/cloudinary/useCloudinaryTracks.test.tsx`

- [ ] **Step 1: Write failing tests**

Create tests for:

- `fetchCloudinaryTracks("")` calls Cloudinary Search with folder-scoped `resource_type:video`.
- `fetchCloudinaryTracks("lemonade")` includes safe prefix-token search clauses in expression.
- missing env throws `Cloudinary configuration is missing`.
- route returns JSON tracks.
- hook calls `/api/cloudinary/tracks?q=...` and caches tracks.

Minimum hook assertion:

```ts
expect(mockFetch).toHaveBeenCalledWith("/api/cloudinary/tracks?q=lemonade");
expect(mockCacheTrack).toHaveBeenCalledWith(expect.objectContaining({
  id: "cloudinary:asset-1",
}));
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm test -- src/shared/api/cloudinary/__tests__/cloudinaryClient.test.ts src/test/app/api/cloudinary/tracks.route.test.ts src/test/features/cloudinary/useCloudinaryTracks.test.tsx
```

Expected: fail because files do not exist.

- [ ] **Step 3: Implement Cloudinary client**

Create `src/shared/api/cloudinary/cloudinaryClient.ts` with these exported functions:

```ts
import type { Track } from "@/entities/track/model";
import {
  adaptCloudinaryTrack,
  type CloudinaryResource,
} from "./cloudinaryAdapter";

const CACHE_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 100;
const MAX_SEARCH_TOKENS = 8;
const SEARCH_TOKEN_REGEX = /[\p{L}\p{N}_-]+/gu;
const SEARCH_FIELDS = ["public_id", "filename", "tags", "context"] as const;

type CacheEntry = {
  expiresAt: number;
  tracks: Track[];
};

const responseCache = new Map<string, CacheEntry>();

const assertServerEnvironment = () => {
  const hasNodeProcess =
    typeof process !== "undefined" && Boolean(process.versions?.node);

  if (
    typeof window !== "undefined" &&
    typeof window.document !== "undefined" &&
    !hasNodeProcess
  ) {
    throw new Error("Cloudinary client can only be used on the server");
  }
};

const requiredEnv = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_AUDIO_FOLDER;

  if (!cloudName || !apiKey || !apiSecret || !folder) {
    throw new Error("Cloudinary configuration is missing");
  }

  return { cloudName, apiKey, apiSecret, folder };
};

const escapeExpressionValue = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const searchTokens = (query: string) =>
  (query.match(SEARCH_TOKEN_REGEX) ?? []).slice(0, MAX_SEARCH_TOKENS);

const searchExpressionForToken = (token: string) =>
  `(${SEARCH_FIELDS.map((field) => `${field}:${token}*`).join(" OR ")})`;

const pruneCloudinaryTrackCache = (now: number) => {
  for (const [key, entry] of responseCache) {
    if (entry.expiresAt <= now) responseCache.delete(key);
  }

  while (responseCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey === undefined) break;
    responseCache.delete(oldestKey);
  }
};

export function buildCloudinaryExpression(folder: string, query: string) {
  const escapedFolder = escapeExpressionValue(folder);
  const base = `resource_type:video AND (asset_folder="${escapedFolder}" OR folder="${escapedFolder}")`;
  const tokens = searchTokens(query);
  if (tokens.length === 0) return base;

  return `${base} AND ${tokens.map(searchExpressionForToken).join(" AND ")}`;
}

export function clearCloudinaryTrackCacheForTests() {
  responseCache.clear();
}

export async function fetchCloudinaryTracks(query = ""): Promise<Track[]> {
  assertServerEnvironment();

  const normalizedQuery = query.trim();
  const now = Date.now();
  pruneCloudinaryTrackCache(now);

  const cached = responseCache.get(normalizedQuery);
  if (cached && cached.expiresAt > now) return cached.tracks;

  const { cloudName, apiKey, apiSecret, folder } = requiredEnv();
  const url = new URL(`https://api.cloudinary.com/v1_1/${cloudName}/resources/search`);
  url.searchParams.set("expression", buildCloudinaryExpression(folder, normalizedQuery));
  url.searchParams.set("max_results", "100");
  url.searchParams.append("with_field", "tags");
  url.searchParams.append("with_field", "context");

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Cloudinary search failed with status ${response.status}`);
  }

  const body = (await response.json()) as { resources?: CloudinaryResource[] };
  const tracks = (body.resources ?? []).map(adaptCloudinaryTrack);
  const fetchedAt = Date.now();

  responseCache.set(normalizedQuery, {
    expiresAt: fetchedAt + CACHE_TTL_MS,
    tracks,
  });
  pruneCloudinaryTrackCache(fetchedAt);
  return tracks;
}
```

- [ ] **Step 4: Implement route and hook**

Create `src/app/api/cloudinary/tracks/route.ts`:

```ts
import { NextResponse } from "next/server";
import { fetchCloudinaryTracks } from "@/shared/api/cloudinary/cloudinaryClient";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  try {
    return NextResponse.json(await fetchCloudinaryTracks(query));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      message === "Cloudinary configuration is missing" ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
```

Create `src/features/cloudinary/hooks/useCloudinaryTracks.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/entities/track/model";
import { cacheTrack } from "@/shared/db/repositories/trackCacheRepo";
import { useHydrated } from "@/shared/hooks/useHydrated";

async function getCloudinaryTracks(query: string): Promise<Track[]> {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
  const response = await fetch(`/api/cloudinary/tracks${suffix}`);

  if (!response.ok) throw new Error("cloudinary tracks fetch failed");

  const tracks = (await response.json()) as Track[];
  const cacheResults = await Promise.allSettled(tracks.map(cacheTrack));
  cacheResults.forEach((result) => {
    if (result.status === "rejected") {
      console.warn("Failed to cache Cloudinary track:", result.reason);
    }
  });
  return tracks;
}

export function useCloudinaryTracks(query = "") {
  const hydrated = useHydrated();
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: ["cloudinary-tracks", normalizedQuery],
    queryFn: () => getCloudinaryTracks(normalizedQuery),
    enabled: hydrated,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}
```

- [ ] **Step 5: Run tests and verify GREEN**

Run:

```bash
npm test -- src/shared/api/cloudinary/__tests__/cloudinaryClient.test.ts src/test/app/api/cloudinary/tracks.route.test.ts src/test/features/cloudinary/useCloudinaryTracks.test.tsx
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/shared/api/cloudinary/cloudinaryClient.ts src/shared/api/cloudinary/__tests__/cloudinaryClient.test.ts src/app/api/cloudinary/tracks/route.ts src/test/app/api/cloudinary/tracks.route.test.ts src/features/cloudinary/hooks/useCloudinaryTracks.ts src/test/features/cloudinary/useCloudinaryTracks.test.tsx
git commit -m "feat(cloudinary): expose track catalog route"
```

---

## Task 3: Unified Music Shell and Search/Favorites Merge

**Files:**

- Create: `src/widgets/musicShell/index.tsx`
- Create: `src/widgets/musicShell/musicShellHeader.tsx`
- Create: `src/widgets/musicShell/musicTrackList.tsx`
- Create: `src/widgets/musicShell/trackDetailAside.tsx`
- Create: `src/test/widgets/musicShell.test.tsx`
- Modify: `src/views/search/index.tsx`
- Modify: `src/test/views/search.test.tsx`

- [ ] **Step 1: Write failing shell tests**

Test these behaviors:

- `/search` view renders heading `EDMM catalog`.
- blank query loads Cloudinary tracks.
- typing query calls `useCloudinaryTracks` with normalized query.
- `Favorites` view shows cached favorite tracks.
- selecting a row populates the right detail aside.
- clicking play calls `onPlay(track, tracks)`.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm test -- src/test/widgets/musicShell.test.tsx src/test/views/search.test.tsx
```

Expected: fail because `MusicShell` does not exist and `SearchView` still renders Audius search.

- [ ] **Step 3: Implement shell components**

Core `SearchView` replacement:

```tsx
"use client";

import MusicShell from "@/widgets/musicShell";
import type { Track } from "@/entities/track/model";

export interface SearchViewProps {
  onPlay?: (track: Track, queue?: Track[]) => void;
}

export function SearchView({ onPlay }: SearchViewProps) {
  return <MusicShell onPlay={onPlay} />;
}

export default SearchView;
```

`MusicShell` state contract:

```tsx
type MusicView = "all" | "favorites" | "recent";

const [query, setQuery] = useState("");
const [view, setView] = useState<MusicView>("all");
const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
```

The shell should:

- use `useCloudinaryTracks(query)` for all/search results.
- use `useFavorites`, `useRecentPlays`, and `getCachedTracks` for library-backed views.
- cache Cloudinary fetch results through the hook.
- pass selected track ID into `TrackDetailAside`.

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```bash
npm test -- src/test/widgets/musicShell.test.tsx src/test/views/search.test.tsx
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/widgets/musicShell src/views/search/index.tsx src/test/widgets/musicShell.test.tsx src/test/views/search.test.tsx
git commit -m "feat(shell): merge search and favorites"
```

---

## Task 4: Route Compatibility and Right Aside Detail

**Files:**

- Modify: `src/app/library/page.tsx`
- Modify: `src/app/track/[id]/page.tsx`
- Modify: `src/app/track/[id]/trackDetailPageClient.tsx`
- Create: `src/test/app/musicRoutes.test.tsx`
- Update: `src/test/views/trackDetail.test.tsx`

- [ ] **Step 1: Write failing route tests**

Test:

- `LibraryPage()` calls `redirect("/search?view=favorites")`.
- `TrackPage({ params })` redirects to `/search?track=<encoded-id>`.
- `TrackDetailAside` renders cached track detail without lyrics UI.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm test -- src/test/app/musicRoutes.test.tsx src/test/views/trackDetail.test.tsx
```

Expected: fail because current routes render full pages and detail imports lyrics.

- [ ] **Step 3: Implement redirects**

`src/app/library/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/search?view=favorites");
}
```

`src/app/track/[id]/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getTrackId } from "./trackId";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const trackId = await getTrackId(params);
  redirect(`/search?track=${encodeURIComponent(trackId)}`);
}
```

- [ ] **Step 4: Remove lyrics from active detail path**

Ensure `TrackDetailAside` uses `getCachedTrack(trackId)` and does not import:

```ts
import { useLyrics } from "@/features/lyrics/hooks/useLyrics";
```

- [ ] **Step 5: Run tests and verify GREEN**

Run:

```bash
npm test -- src/test/app/musicRoutes.test.tsx src/test/views/trackDetail.test.tsx
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/library/page.tsx src/app/track/[id]/page.tsx src/app/track/[id]/trackDetailPageClient.tsx src/widgets/musicShell/trackDetailAside.tsx src/test/app/musicRoutes.test.tsx src/test/views/trackDetail.test.tsx
git commit -m "feat(routes): move track detail into music shell"
```

---

## Task 5: Player UI/UX Polish

**Files:**

- Modify: `src/features/audio/ui/audioPlayer.tsx`
- Modify: `src/features/audio/components/playerControlsSection.tsx`
- Modify: `src/features/audio/components/playerTrackDetails.tsx`
- Modify: `src/features/audio/components/albumArtwork.tsx`
- Modify: `src/features/audio/ui/mobileAudioPlayer.tsx`
- Modify: `src/test/features/audio/audioPlayer.test.tsx`

- [ ] **Step 1: Write failing player tests**

Assert:

- desktop player has left, center, right zones by test IDs:
  - `player-track-zone`
  - `player-control-zone`
  - `player-volume-zone`
- play button remains circular and disabled without a track.
- artwork button still opens detail route.
- rotating artwork class is absent in persistent player.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm test -- src/test/features/audio/audioPlayer.test.tsx
```

Expected: fail because zones and no-rotation expectations do not exist yet.

- [ ] **Step 3: Implement desktop player zones**

`AudioPlayer` inner layout should become:

```tsx
<div
  id="player"
  className="mx-auto grid min-h-[96px] w-full max-w-[1440px] grid-cols-[minmax(220px,1fr)_minmax(360px,1.4fr)_minmax(160px,1fr)] items-center gap-4 px-4 pt-3 sm:px-6 lg:px-8"
>
  <section data-testid="player-track-zone" className="flex min-w-0 items-center gap-3">
    <AlbumArtwork ... />
    <PlayerTrackSummary ... />
  </section>
  <section data-testid="player-control-zone" className="min-w-0">
    <PlayerControlsSection currentTrackInfo={currentTrack} />
    <PlayerTrackDetails ... />
  </section>
  <section data-testid="player-volume-zone" className="flex justify-end">
    <PlayerVolumeControls />
  </section>
</div>
```

If extracting `PlayerTrackSummary` or `PlayerVolumeControls` is too large for the task, keep them inside existing components but preserve the test IDs and visual zones.

- [ ] **Step 4: Remove persistent artwork rotation**

In `albumArtwork.tsx`, remove:

```ts
isPlaying && "animate-rotate-album active"
```

The artwork can still show buffering state and hover/focus states.

- [ ] **Step 5: Run tests and verify GREEN**

Run:

```bash
npm test -- src/test/features/audio/audioPlayer.test.tsx
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/audio/ui/audioPlayer.tsx src/features/audio/components/playerControlsSection.tsx src/features/audio/components/playerTrackDetails.tsx src/features/audio/components/albumArtwork.tsx src/features/audio/ui/mobileAudioPlayer.tsx src/test/features/audio/audioPlayer.test.tsx
git commit -m "feat(player): polish spotify style footer controls"
```

---

## Task 6: Landing Starfield Adjustment

**Files:**

- Modify: `src/features/landing/components/dustySnow.tsx`
- Modify: `src/shared/styles/global.css`
- Modify: `src/test/features/landing/roseSpaceBackground.test.tsx`

- [ ] **Step 1: Write failing landing tests**

Assert:

- default rendered star count is lower than 150, expected 96.
- `.rose-starfield` has right-aligned 80% width through class/style contract.
- generated star left positions use `%`, not `vw`.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm test -- src/test/features/landing/roseSpaceBackground.test.tsx
```

Expected: fail because current count is 150 and positions are `vw`.

- [ ] **Step 3: Implement starfield changes**

In `dustySnow.tsx`:

```ts
left: `${(pseudoRandom(seed) * 100).toFixed(4)}%`,
```

Change default:

```ts
count = 96,
```

In `global.css`:

```css
.rose-starfield {
  position: absolute;
  inset-block: 0;
  right: 0;
  left: auto;
  width: 80%;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
```

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```bash
npm test -- src/test/features/landing/roseSpaceBackground.test.tsx
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/landing/components/dustySnow.tsx src/shared/styles/global.css src/test/features/landing/roseSpaceBackground.test.tsx
git commit -m "feat(landing): reduce and right align starfield"
```

---

## Task 7: External API Retirement and Final Verification

**Files:**

- Delete Audius and lyrics files listed in the top deletion section.
- Modify imports/tests that still reference Audius or lyrics.
- Modify: `docs/README.md` if it still states Cloudinary is removed.

- [ ] **Step 1: Search for active external API references**

Run:

```bash
rg -n "audius|Audius|lyrics|lyrics\\.ovh|/api/lyrics|/api/audius|spotify|Spotify|deezer|MusicBrainz|Wikipedia" src docs -g "!coverage/**"
```

Expected: references remain only in historical docs or removed-file tests before cleanup.

- [ ] **Step 2: Delete retired runtime files**

Delete only after Tasks 1-6 pass. Do not delete Dexie favorites/recent/cache code.

- [ ] **Step 3: Update docs and tests**

`docs/README.md` should no longer claim runtime Cloudinary paths are removed. It should state that Cloudinary is the active owned-audio source and old external catalog APIs are retired.

- [ ] **Step 4: Run full verification**

Run:

```bash
npm test -- --runInBand
npx tsc --noEmit
```

Expected: both commands pass.

- [ ] **Step 5: Commit**

```bash
git add src docs
git commit -m "chore(api): retire external music sources"
```

---

## Plan Self-Review

- Requirement coverage:
  - Cloudinary audio list: Tasks 1-3.
  - No existing external music APIs: Task 7.
  - Landing star count and 80% right placement: Task 6.
  - Favorite/Search merge: Task 3.
  - Spotify-like header/main/footer/right aside: Tasks 3-5.
  - Player UI/UX polish: Task 5.
- Placeholder scan:
  - No placeholder markers or unspecified implementation gaps are intentionally left.
- Type consistency:
  - `TrackSource`, `CloudinaryResource`, `useCloudinaryTracks`, and `MusicShell` names are consistent across tasks.
- Execution mode:
  - User requested Subagent-driven implementation. Use fresh subagent per task with spec-compliance and code-quality review loops.
