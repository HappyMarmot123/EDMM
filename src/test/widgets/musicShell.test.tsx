import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSX } from "react";
import type { Track } from "@/entities/track";
import { useCloudinaryTracks } from "@/features/cloudinary/hooks/useCloudinaryTracks";
import { useRecentPlays } from "@/features/library";
import {
  getCachedTrack,
  getCachedTracks,
} from "@/shared/db";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { resolveCatalogFallbackState } from "@/widgets/musicShell/catalogFallbackState";
import MusicShell from "@/widgets/musicShell";
import MusicTrackList from "@/widgets/musicShell/musicTrackList";

jest.mock("react-virtuoso", () => ({
  Virtuoso: ({
    data,
    itemContent,
  }: {
    data: Track[];
    itemContent: (index: number, item: Track) => JSX.Element;
  }) => {
    return (
      <div>
        {data.map((item, index) => (
          <div key={item.id}>{itemContent(index, item)}</div>
        ))}
      </div>
    );
  },
}), { virtual: true });

jest.mock("@/features/cloudinary/hooks/useCloudinaryTracks");
jest.mock("@/features/library");
jest.mock("@/shared/db");
jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  useAudioPlayer: jest.fn(),
}));
jest.mock("@/features/audio", () => ({
  AudioVisualizer: () => <div>Audio visualizer</div>,
  EqualizerPanel: () => <div>Equalizer panel</div>,
}));

const mockUseCloudinaryTracks = useCloudinaryTracks as jest.Mock;
const mockUseRecentPlays = useRecentPlays as jest.Mock;
const mockUseAudioPlayer = useAudioPlayer as jest.MockedFunction<
  typeof useAudioPlayer
>;
const mockGetCachedTracks = getCachedTracks as jest.MockedFunction<
  typeof getCachedTracks
>;
const mockGetCachedTrack = getCachedTrack as jest.MockedFunction<
  typeof getCachedTrack
>;

const mockTrackSelectPlaybackMedia = (matches: boolean) => {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

const track = (id: string, title: string, artistName = "EDMM Artist"): Track => ({
  id,
  source: "cloudinary",
  title,
  artistId: `artist:${id}`,
  artistName,
  albumName: "Rose Archive",
  artworkUrl: "",
  durationMs: 184000,
  streamUrl: `https://example.com/${encodeURIComponent(id)}.mp3`,
  metadata: {},
});

const deferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
};

const cloudTracks = [
  track("cloudinary:all-1", "Cloud Track One", "Cloud Artist"),
  track("cloudinary:all-2", "Cloud Track Two", "Cloud Artist"),
  track("cloudinary:all-3", "Cloud Track Three", "Cloud Artist"),
];
const hiddenTrack = track("cloudinary:hidden-1", "Hidden Track");
const recentTrack = track("cloudinary:recent-1", "Recent Track");
const mockAudioState = {
  currentTrack: null,
  isPlaying: false,
  audioAnalyser: null,
} as unknown as ReturnType<typeof useAudioPlayer>;

const getDesktopViewButton = (name: string) =>
  within(screen.getByRole("navigation", { name: "Music views" })).getByRole(
    "button",
    { name },
  );

describe("MusicShell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTrackSelectPlaybackMedia(false);
    mockUseAudioPlayer.mockReturnValue(mockAudioState);

    mockUseCloudinaryTracks.mockImplementation((query: string) => ({
      data: query ? [cloudTracks[1]] : cloudTracks,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    }));
    mockUseRecentPlays.mockReturnValue({ recentIds: [] });
    mockGetCachedTracks.mockResolvedValue([]);
    mockGetCachedTrack.mockImplementation(async (trackId: string) =>
      [hiddenTrack, recentTrack, ...cloudTracks].find((item) => item.id === trackId),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the EDMM catalog heading and loads blank-query Cloudinary tracks", () => {
    const { container } = render(<MusicShell />);

    expect(
      screen.getByRole("heading", { name: "EDMM" }),
    ).toBeInTheDocument();
    // 뷰포트 높이는 케스케이드 순서에 안전한 전용 클래스로 고정 (100vh + @supports dvh)
    expect(container.querySelector("main.relative")).toHaveClass(
      "app-viewport-height",
    );
    expect(mockUseCloudinaryTracks).toHaveBeenLastCalledWith("", { resourceType: "all" });
    expect(screen.getByRole("button", { name: "Select Cloud Track One" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select Cloud Track Two" })).toBeInTheDocument();
  });

  it("loads initial viewport artwork immediately and defers the rest", () => {
    const artworkTracks = Array.from({ length: 9 }, (_, index) => ({
      ...track(`cloudinary:artwork-${index + 1}`, `Artwork Track ${index + 1}`),
      artworkUrl: `https://res.cloudinary.com/demo/image/upload/v171900000${index}/edmm/artwork-${index + 1}.jpg`,
    }));
    const priorityTrack = artworkTracks[0];
    const deferredTrack = artworkTracks[8];
    const priorityThumbnail =
      "https://res.cloudinary.com/demo/image/upload/c_fill,w_96,h_96,q_auto,f_auto/v1719000000/edmm/artwork-1.jpg";
    const deferredThumbnail =
      "https://res.cloudinary.com/demo/image/upload/c_fill,w_96,h_96,q_auto,f_auto/v1719000008/edmm/artwork-9.jpg";

    mockUseCloudinaryTracks.mockReturnValue({
      data: artworkTracks,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    const { container } = render(<MusicShell />);
    const priorityArtwork = container.querySelector(
      `[data-track-artwork-id="${priorityTrack.id}"]`,
    );
    const deferredArtwork = container.querySelector(
      `[data-track-artwork-id="${deferredTrack.id}"]`,
    );

    expect(priorityArtwork).toHaveStyle({
      backgroundImage: `url(${priorityThumbnail})`,
    });
    expect(deferredArtwork).not.toHaveStyle({
      backgroundImage: `url(${deferredThumbnail})`,
    });
    expect(
      deferredArtwork?.querySelector("[data-track-artwork-skeleton]"),
    ).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("pointerdown"));
    });

    expect(deferredArtwork).toHaveStyle({
      backgroundImage: `url(${deferredThumbnail})`,
    });
  });

  it("renders the decorative search backdrop behind the shell content", () => {
    const { container } = render(<MusicShell />);

    const backdrop = container.querySelector(".search-backdrop");
    expect(backdrop).toBeInTheDocument();
    expect(backdrop).toHaveAttribute("aria-hidden", "true");
    // 확정 디자인: 그레인 + 좌우 엣지 레터링 (그리드 없음)
    expect(backdrop?.querySelector(".search-backdrop__grid")).toBeNull();
    expect(
      backdrop?.querySelector(".search-backdrop__grain"),
    ).toBeInTheDocument();
    expect(backdrop?.querySelectorAll(".search-backdrop__edge")).toHaveLength(2);
    expect(backdrop?.querySelector(".search-backdrop__lettering")).toBeNull();
  });

  it("hides the scroll-to-top button while the list is at the top", () => {
    render(<MusicShell />);

    expect(
      screen.queryByRole("button", { name: "Scroll to top" }),
    ).not.toBeInTheDocument();
  });

  it("marks only the track list with the mobile bottom scroll fade", () => {
    const { container } = render(<MusicShell />);

    // 하단 스크롤 페이드는 모바일 리스트 전용
    const list = container.querySelector(".music-track-list");
    expect(list).toHaveClass("scroll-fade-bottom");
    expect(list).toHaveClass("scroll-fade-bottom--mobile");
    expect(list).toHaveAttribute("data-at-bottom");

    const detailAside = container.querySelector(
      "aside[aria-label='Track details']",
    );
    expect(detailAside).not.toHaveClass("scroll-fade-bottom");
    expect(detailAside).not.toHaveAttribute("data-at-bottom");
  });

  it("calls Cloudinary search with a normalized typed query", async () => {
    const user = userEvent.setup();

    render(<MusicShell />);
    await user.type(
      screen.getByRole("searchbox", { name: /search catalog/i }),
      "  lemonade  ",
    );

    expect(mockUseCloudinaryTracks).toHaveBeenLastCalledWith("lemonade", { resourceType: "all" });
    expect(screen.getByRole("button", { name: "Select Cloud Track Two" })).toBeInTheDocument();
  });

  it("keeps the last catalog results visible when a searched refetch fails", async () => {
    const user = userEvent.setup();
    const refetch = jest.fn();
    const staleSearchFallback = resolveCatalogFallbackState({
      activeView: "all",
      currentTracks: [],
      previousCatalogTracks: cloudTracks,
      isCatalogLoading: false,
      isCatalogError: true,
      hasSearchQuery: true,
      recentUnavailable: false,
    });

    mockUseCloudinaryTracks.mockReturnValueOnce({
      data: cloudTracks,
      isLoading: false,
      isError: false,
      refetch,
    });

    const { rerender } = render(<MusicShell />);

    expect(
      screen.getByRole("button", { name: "Select Cloud Track One" }),
    ).toBeInTheDocument();

    mockUseCloudinaryTracks.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });

    await user.type(
      screen.getByRole("searchbox", { name: /search catalog/i }),
      "broken",
    );
    rerender(<MusicShell />);

    expect(
      screen.getByText(staleSearchFallback.notice?.title ?? ""),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Catalog unavailable" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select Cloud Track One" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: staleSearchFallback.notice?.primaryActionLabel ?? "",
      }),
    );
    expect(refetch).toHaveBeenCalled();
  });

  it("renders a fallback notice secondary action only when both label and handler are provided", () => {
    const onSecondaryAction = jest.fn();

    const { rerender } = render(
      <MusicTrackList
        tracks={[]}
        isLoading={false}
        isError={false}
        onSelect={jest.fn()}
        onPlay={jest.fn()}
        fallbackNotice={{
          tone: "warning",
          title: "Recent unavailable",
          description: "Use the full catalog instead.",
          secondaryActionLabel: "View all",
        }}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "View all" }),
    ).not.toBeInTheDocument();

    rerender(
      <MusicTrackList
        tracks={[]}
        isLoading={false}
        isError={false}
        onSelect={jest.fn()}
        onPlay={jest.fn()}
        fallbackNotice={{
          tone: "warning",
          title: "Recent unavailable",
          description: "Use the full catalog instead.",
          secondaryActionLabel: "View all",
        }}
        onFallbackNoticeSecondaryAction={onSecondaryAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "View all" }));
    expect(onSecondaryAction).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText("No tracks in this view."),
    ).not.toBeInTheDocument();
  });

  it("shows cached recent tracks in the Recent view", async () => {
    mockUseRecentPlays.mockReturnValue({
      recentIds: ["cloudinary:recent-1"],
    });
    mockGetCachedTracks.mockResolvedValue([recentTrack]);

    render(<MusicShell />);
    fireEvent.click(getDesktopViewButton("Recent"));

    expect(mockGetCachedTracks).toHaveBeenCalledWith(["cloudinary:recent-1"]);
    expect(
      await screen.findByRole("button", { name: "Select Recent Track" }),
    ).toBeInTheDocument();
  });

  it("starts on an initial Recent view", async () => {
    mockUseRecentPlays.mockReturnValue({
      recentIds: ["cloudinary:recent-1"],
    });
    mockGetCachedTracks.mockResolvedValue([recentTrack]);

    render(<MusicShell initialView="recent" />);

    expect(getDesktopViewButton("Recent")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      await screen.findByRole("button", { name: "Select Recent Track" }),
    ).toBeInTheDocument();
  });

  it("does not render the mobile bottom tab navigation", () => {
    mockTrackSelectPlaybackMedia(true);

    render(<MusicShell />);

    expect(
      screen.queryByRole("navigation", { name: "Bottom tab navigation" }),
    ).not.toBeInTheDocument();
  });

  it("forces the mobile view to stay on All even when initialView is recent", async () => {
    mockTrackSelectPlaybackMedia(true);
    mockUseRecentPlays.mockReturnValue({
      recentIds: ["cloudinary:recent-1"],
    });
    mockGetCachedTracks.mockResolvedValue([recentTrack]);

    render(<MusicShell initialView="recent" />);

    // 모바일 모드에서는 playOnSelect가 켜져 접근성 이름이 "Select and play {title}"가 된다
    expect(
      await screen.findByRole("button", { name: "Select and play Cloud Track One" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Recent Track/ })).not.toBeInTheDocument();
  });

  it("updates detail selection when initialTrackId changes", async () => {
    mockGetCachedTrack.mockImplementation(async (trackId: string) =>
      [hiddenTrack, recentTrack, ...cloudTracks].find((item) => item.id === trackId),
    );

    const { rerender } = render(
      <MusicShell initialTrackId="cloudinary:hidden-1" />,
    );

    expect(await screen.findByTestId("track-detail-title")).toHaveTextContent(
      "Hidden Track",
    );

    rerender(<MusicShell initialTrackId="cloudinary:all-3" />);

    expect(mockGetCachedTrack).toHaveBeenLastCalledWith("cloudinary:all-3");
    expect(await screen.findByTestId("track-detail-title")).toHaveTextContent(
      "Cloud Track Three",
    );
  });

  it("syncs detail selection to a newly playing track after an initial route selection", async () => {
    const { rerender } = render(
      <MusicShell initialTrackId="cloudinary:hidden-1" />,
    );

    expect(await screen.findByTestId("track-detail-title")).toHaveTextContent(
      "Hidden Track",
    );

    mockUseAudioPlayer.mockReturnValue({
      ...mockAudioState,
      currentTrack: cloudTracks[1],
    });

    rerender(<MusicShell initialTrackId="cloudinary:hidden-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("track-detail-title")).toHaveTextContent(
        "Cloud Track Two",
      );
    });
  });

  it("rehydrates the initial player queue when catalog tracks load after refresh", async () => {
    const onPlay = jest.fn();
    mockUseCloudinaryTracks.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });

    const { rerender } = render(
      <MusicShell initialTrackId="cloudinary:all-1" onPlay={onPlay} />,
    );

    await waitFor(() => {
      expect(onPlay).toHaveBeenCalledWith(cloudTracks[0], [cloudTracks[0]], false);
    });

    onPlay.mockClear();
    mockUseCloudinaryTracks.mockReturnValue({
      data: cloudTracks,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    rerender(<MusicShell initialTrackId="cloudinary:all-1" onPlay={onPlay} />);

    await waitFor(() => {
      expect(onPlay).toHaveBeenCalledWith(cloudTracks[0], cloudTracks, false);
    });
  });

  it("opens an initial cached track detail even when it is not visible", async () => {
    const deepLinkedTrack = track("cloudinary:asset-1", "Route Selected Track");
    mockGetCachedTrack.mockImplementation(async (trackId: string) =>
      trackId === "cloudinary:asset-1" ? deepLinkedTrack : undefined,
    );

    render(<MusicShell initialTrackId="cloudinary:asset-1" />);

    expect(mockGetCachedTrack).toHaveBeenCalledWith("cloudinary:asset-1");
    expect(await screen.findByTestId("track-detail-title")).toHaveTextContent(
      "Route Selected Track",
    );
  });

  it("keeps an initial track detail loading while catalog data is still resolving", async () => {
    const onPlay = jest.fn();
    mockUseCloudinaryTracks.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    mockGetCachedTrack.mockResolvedValue(undefined);

    render(
      <MusicShell
        initialTrackId="cloudinary:pending-route-track"
        onPlay={onPlay}
      />,
    );

    await waitFor(() => {
      expect(mockGetCachedTrack).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText("Loading details...")).toBeInTheDocument();
    expect(screen.queryByText("Details unavailable")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Select a track" }),
    ).not.toBeInTheDocument();
    expect(onPlay).not.toHaveBeenCalled();
  });

  it("selects a row and hydrates the right-side detail aside from cache", async () => {
    render(<MusicShell />);

    fireEvent.click(screen.getByRole("button", { name: "Select Cloud Track One" }));

    expect(mockGetCachedTrack).toHaveBeenCalledWith("cloudinary:all-1");
    expect(await screen.findByTestId("track-detail-title")).toHaveTextContent(
      "Cloud Track One",
    );
  });

  it("does not show stale cached details after selecting another track", async () => {
    const firstLookup = deferred<Track | undefined>();
    const secondLookup = deferred<Track | undefined>();
    mockGetCachedTrack
      .mockReturnValueOnce(firstLookup.promise)
      .mockReturnValueOnce(secondLookup.promise);

    render(<MusicShell />);

    fireEvent.click(screen.getByRole("button", { name: "Select Cloud Track One" }));
    firstLookup.resolve(cloudTracks[0]);

    expect(await screen.findByTestId("track-detail-title")).toHaveTextContent(
      "Cloud Track One",
    );

    fireEvent.click(screen.getByRole("button", { name: "Select Cloud Track Two" }));

    await waitFor(() => {
      expect(screen.getByTestId("track-detail-title")).toHaveTextContent(
        "Cloud Track Two",
      );
    });
    expect(screen.queryByText("Cloud Track One")).toBeInTheDocument();
    expect(screen.getByTestId("track-detail-title")).not.toHaveTextContent(
      "Cloud Track One",
    );
  });

  it("clears selected details when the selected recent track leaves the visible queue", async () => {
    mockUseRecentPlays.mockReturnValue({
      recentIds: ["cloudinary:recent-1"],
    });
    mockGetCachedTracks.mockResolvedValue([recentTrack]);

    render(<MusicShell />);
    fireEvent.click(getDesktopViewButton("Recent"));
    fireEvent.click(
      await screen.findByRole("button", { name: "Select Recent Track" }),
    );

    expect(await screen.findByTestId("track-detail-title")).toHaveTextContent(
      "Recent Track",
    );

    fireEvent.click(getDesktopViewButton("All"));
    await waitFor(() => {
      expect(screen.queryByTestId("track-detail-title")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("Recent Track")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Play selected" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Select a track" })).toBeInTheDocument();
  });

  it("plays a track with the visible queue", () => {
    const onPlay = jest.fn();

    render(<MusicShell onPlay={onPlay} />);
    fireEvent.click(
      within(screen.getByRole("list", { name: "Track list" })).getByRole(
        "button",
        { name: "Play Cloud Track One" },
      ),
    );

    expect(onPlay).toHaveBeenLastCalledWith(
      cloudTracks[0],
      cloudTracks,
      true,
    );
  });

  it("auto seeds first visible track as the controller target on initial load", () => {
    const onPlay = jest.fn();

    render(<MusicShell onPlay={onPlay} />);

    expect(onPlay).toHaveBeenCalledWith(cloudTracks[0], cloudTracks, false);
  });

  it("selects a visible row without auto-playing", async () => {
    const onPlay = jest.fn();

    render(<MusicShell onPlay={onPlay} />);
    onPlay.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Select Cloud Track Two" }));

    expect(onPlay).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(mockGetCachedTrack).toHaveBeenCalledWith("cloudinary:all-2");
      expect(screen.getByTestId("track-detail-title")).toHaveTextContent(
        "Cloud Track Two",
      );
    });
  });

  it("plays a selected row on coarse pointer and tablet-sized viewports", async () => {
    const onPlay = jest.fn();
    mockTrackSelectPlaybackMedia(true);

    render(<MusicShell onPlay={onPlay} />);
    onPlay.mockClear();
    fireEvent.click(
      screen.getByRole("button", { name: "Select and play Cloud Track Two" }),
    );

    expect(onPlay).toHaveBeenLastCalledWith(
      cloudTracks[1],
      cloudTracks,
      true,
    );
    await waitFor(() => {
      expect(mockGetCachedTrack).toHaveBeenCalledWith("cloudinary:all-2");
      expect(screen.getByTestId("track-detail-title")).toHaveTextContent(
        "Cloud Track Two",
      );
    });
  });

  it("prefers latest recent play as first controller seed when present", async () => {
    const onPlay = jest.fn();
    mockUseRecentPlays.mockReturnValue({ recentIds: ["cloudinary:recent-1"] });

    render(<MusicShell onPlay={onPlay} />);

    await waitFor(() => {
      expect(onPlay).toHaveBeenCalledWith(recentTrack, [recentTrack], false);
    });
  });

  it("keeps seeded recent track details when the player current track syncs", async () => {
    const onPlay = jest.fn();
    mockUseRecentPlays.mockReturnValue({ recentIds: ["cloudinary:recent-1"] });

    const { rerender } = render(<MusicShell onPlay={onPlay} />);

    expect(await screen.findByTestId("track-detail-title")).toHaveTextContent(
      "Recent Track",
    );

    mockUseAudioPlayer.mockReturnValue({
      ...mockAudioState,
      currentTrack: recentTrack,
    });
    rerender(<MusicShell onPlay={onPlay} />);

    await waitFor(() => {
      expect(screen.getByTestId("track-detail-title")).toHaveTextContent(
        "Recent Track",
      );
      expect(
        screen.queryByRole("heading", { name: "Select a track" }),
      ).not.toBeInTheDocument();
    });
  });

  it("shows loading and empty states without live services", async () => {
    const emptyCatalogState = resolveCatalogFallbackState({
      activeView: "all",
      currentTracks: [],
      previousCatalogTracks: [],
      isCatalogLoading: false,
      isCatalogError: false,
      hasSearchQuery: false,
      recentUnavailable: false,
    });

    mockUseCloudinaryTracks.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });

    const { rerender } = render(<MusicShell />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading tracks");

    mockUseCloudinaryTracks.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    rerender(<MusicShell />);

    await waitFor(() => {
      expect(
        screen.getByText(emptyCatalogState.emptyMessage),
      ).toBeInTheDocument();
    });
  });

  it("toggles the track detail aside using the Overflow Wrap button", async () => {
    render(<MusicShell />);

    expect(await screen.findByText("Track Detail")).toBeInTheDocument();
    const aside = screen.getByLabelText("Track detail aside");
    expect(aside).toHaveClass("music-shell-aside--open");
    const closeButton = screen.getByRole("button", { name: "Close track detail" });
    fireEvent.click(closeButton);

    expect(screen.getByRole("button", { name: "Open track detail" })).toBeInTheDocument();
    expect(aside).toHaveClass("music-shell-aside--closed");

    fireEvent.click(screen.getByRole("button", { name: "Open track detail" }));
    expect(await screen.findByText("Track Detail")).toBeInTheDocument();
    expect(aside).toHaveClass("music-shell-aside--open");
    expect(screen.getByRole("button", { name: "Close track detail" })).toBeInTheDocument();
  });

});
