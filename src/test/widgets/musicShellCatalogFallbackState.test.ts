import type { Track } from "@/entities/track";
import { resolveCatalogFallbackState } from "@/widgets/musicShell/catalogFallbackState";

const track = (id: string): Track => ({
  id,
  source: "cloudinary",
  title: `Track ${id}`,
  artistId: `artist-${id}`,
  artistName: "EDMM Artist",
  albumName: "EDMM Album",
  artworkUrl: "",
  durationMs: 180000,
  streamUrl: `https://example.com/${id}.mp3`,
  metadata: {},
});

describe("resolveCatalogFallbackState", () => {
  it("keeps stale catalog tracks when catalog refetch fails", () => {
    const staleTracks = [track("stale-1")];

    const state = resolveCatalogFallbackState({
      activeView: "all",
      currentTracks: [],
      previousCatalogTracks: staleTracks,
      isCatalogLoading: false,
      isCatalogError: true,
      hasSearchQuery: true,
      recentUnavailable: false,
    });

    expect(state.status).toBe("catalog_error_with_stale_data");
    expect(state.visibleTracks).toEqual(staleTracks);
    expect(state.isShowingStaleData).toBe(true);
    expect(state.notice?.title).toBe("검색 결과를 새로 불러오지 못했습니다");
  });

  it("returns catalog error without tracks when there is no stale data", () => {
    const state = resolveCatalogFallbackState({
      activeView: "all",
      currentTracks: [],
      previousCatalogTracks: [],
      isCatalogLoading: false,
      isCatalogError: true,
      hasSearchQuery: false,
      recentUnavailable: false,
    });

    expect(state.status).toBe("catalog_error_empty");
    expect(state.visibleTracks).toEqual([]);
    expect(state.notice?.primaryActionLabel).toBe("다시 시도");
  });

  it("separates search empty from catalog error", () => {
    const state = resolveCatalogFallbackState({
      activeView: "all",
      currentTracks: [],
      previousCatalogTracks: [],
      isCatalogLoading: false,
      isCatalogError: false,
      hasSearchQuery: true,
      recentUnavailable: false,
    });

    expect(state.status).toBe("search_empty");
    expect(state.emptyMessage).toBe("검색 결과가 없습니다.");
  });

  it("marks recent unavailable without blocking all catalog behavior", () => {
    const state = resolveCatalogFallbackState({
      activeView: "recent",
      currentTracks: [],
      previousCatalogTracks: [],
      isCatalogLoading: false,
      isCatalogError: false,
      hasSearchQuery: false,
      recentUnavailable: true,
    });

    expect(state.status).toBe("recent_unavailable");
    expect(state.emptyMessage).toBe("최근 재생 목록을 불러올 수 없습니다.");
  });
});
