import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { flushSync } from "react-dom";
import type { Track } from "@/entities/track/model";
import { useCloudinaryTracks } from "@/features/cloudinary/hooks/useCloudinaryTracks";
import { useFavorites } from "@/features/library/hooks/useFavorites";
import { useRecentPlays } from "@/features/library/hooks/useRecentPlays";
import {
  getCachedTrack,
  getCachedTracks,
} from "@/shared/db/repositories/trackCacheRepo";
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import MusicShell from "@/widgets/musicShell";

jest.mock("@/features/cloudinary/hooks/useCloudinaryTracks");
jest.mock("@/features/library/hooks/useFavorites");
jest.mock("@/features/library/hooks/useRecentPlays");
jest.mock("@/shared/db/repositories/trackCacheRepo");
jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  useAudioPlayer: jest.fn(),
}));

const mockUseCloudinaryTracks = useCloudinaryTracks as jest.Mock;
const mockUseFavorites = useFavorites as jest.Mock;
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
const favoriteTrack = track("cloudinary:fav-1", "Favorite Track");
const recentTrack = track("cloudinary:recent-1", "Recent Track");
const mockAudioState = {
  currentTrack: null,
  isPlaying: false,
  audioAnalyser: null,
};

describe("MusicShell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAudioPlayer.mockReturnValue(mockAudioState);

    mockUseCloudinaryTracks.mockImplementation((query: string) => ({
      data: query ? [cloudTracks[1]] : cloudTracks,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    }));
    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set<string>(),
      isFavorite: () => false,
      toggle: jest.fn(),
    });
    mockUseRecentPlays.mockReturnValue({ recentIds: [] });
    mockGetCachedTracks.mockResolvedValue([]);
    mockGetCachedTrack.mockImplementation(async (trackId: string) =>
      [favoriteTrack, recentTrack, ...cloudTracks].find((item) => item.id === trackId),
    );
  });

  it("renders the EDMM catalog heading and loads blank-query Cloudinary tracks", () => {
    render(<MusicShell />);

    expect(
      screen.getByRole("heading", { name: "EDMM catalog" }),
    ).toBeInTheDocument();
    expect(mockUseCloudinaryTracks).toHaveBeenLastCalledWith("", { resourceType: "all" });
    expect(screen.getByRole("button", { name: "Select Cloud Track One" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select Cloud Track Two" })).toBeInTheDocument();
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

  it("shows cached favorite tracks in the Favorites view", async () => {
    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set(["cloudinary:fav-1"]),
      isFavorite: (id: string) => id === "cloudinary:fav-1",
      toggle: jest.fn(),
    });
    mockGetCachedTracks.mockResolvedValue([favoriteTrack]);

    render(<MusicShell />);
    fireEvent.click(screen.getByRole("button", { name: "Favorites" }));

    expect(mockGetCachedTracks).toHaveBeenCalledWith(["cloudinary:fav-1"]);
    expect(await screen.findByText("Favorite Track")).toBeInTheDocument();
  });

  it("shows cached recent tracks in the Recent view", async () => {
    mockUseRecentPlays.mockReturnValue({
      recentIds: ["cloudinary:recent-1"],
    });
    mockGetCachedTracks.mockResolvedValue([recentTrack]);

    render(<MusicShell />);
    fireEvent.click(screen.getByRole("button", { name: "Recent" }));

    expect(mockGetCachedTracks).toHaveBeenCalledWith(["cloudinary:recent-1"]);
    expect(await screen.findByText("Recent Track")).toBeInTheDocument();
  });

  it("starts on an initial Favorites view", async () => {
    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set(["cloudinary:fav-1"]),
      isFavorite: (id: string) => id === "cloudinary:fav-1",
      toggle: jest.fn(),
    });
    mockGetCachedTracks.mockResolvedValue([favoriteTrack]);

    render(<MusicShell initialView="favorites" />);

    expect(screen.getByRole("button", { name: "Favorites" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await screen.findByText("Favorite Track")).toBeInTheDocument();
  });

  it("updates detail selection when initialTrackId changes", async () => {
    mockGetCachedTrack.mockImplementation(async (trackId: string) =>
      [favoriteTrack, recentTrack, ...cloudTracks].find((item) => item.id === trackId),
    );

    const { rerender } = render(
      <MusicShell initialTrackId="cloudinary:fav-1" />,
    );

    expect(await screen.findByTestId("track-detail-title")).toHaveTextContent(
      "Favorite Track",
    );

    rerender(<MusicShell initialTrackId="cloudinary:all-3" />);

    expect(mockGetCachedTrack).toHaveBeenLastCalledWith("cloudinary:all-3");
    expect(await screen.findByTestId("track-detail-title")).toHaveTextContent(
      "Cloud Track Three",
    );
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

  it("clears selected details when the selected favorite leaves the visible queue", async () => {
    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set(["cloudinary:fav-1"]),
      isFavorite: (id: string) => id === "cloudinary:fav-1",
      toggle: jest.fn(),
    });
    mockGetCachedTracks.mockResolvedValue([favoriteTrack]);

    render(<MusicShell />);
    fireEvent.click(screen.getByRole("button", { name: "Favorites" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Select Favorite Track" }),
    );

    expect(await screen.findByTestId("track-detail-title")).toHaveTextContent(
      "Favorite Track",
    );

    act(() => {
      flushSync(() => {
        screen.getByRole("button", { name: "All" }).click();
      });

      expect(screen.queryByTestId("track-detail-title")).not.toBeInTheDocument();
      expect(screen.queryByText("Favorite Track")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Play selected" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Select a track" })).toBeInTheDocument();
    });
  });

  it("plays a track with the visible queue", () => {
    const onPlay = jest.fn();

    render(<MusicShell onPlay={onPlay} />);
    fireEvent.click(screen.getByRole("button", { name: "Play Cloud Track One" }));

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

  it("injects a selected list item into controller without auto-play", () => {
    const onPlay = jest.fn();

    render(<MusicShell onPlay={onPlay} />);
    fireEvent.click(screen.getByRole("button", { name: "Select Cloud Track Two" }));

    expect(onPlay).toHaveBeenCalledWith(cloudTracks[1], cloudTracks, false);
  });

  it("prefers latest recent play as first controller seed when present", async () => {
    const onPlay = jest.fn();
    mockUseRecentPlays.mockReturnValue({ recentIds: ["cloudinary:recent-1"] });

    render(<MusicShell onPlay={onPlay} />);

    await waitFor(() => {
      expect(onPlay).toHaveBeenCalledWith(recentTrack, [recentTrack], false);
    });
  });

  it("shows loading and empty states without live services", async () => {
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
      expect(screen.getByText("No tracks in this view.")).toBeInTheDocument();
    });
  });

  it("closes and reopens the track detail aside", () => {
    render(<MusicShell />);

    const closeButton = screen.getByRole("button", { name: "Close track detail" });
    fireEvent.click(closeButton);

    const openButton = screen.getByRole("button", { name: "Open track detail" });
    expect(openButton).toBeInTheDocument();

    fireEvent.click(openButton);
    expect(screen.getByRole("button", { name: "Close track detail" })).toBeInTheDocument();
  });
});
