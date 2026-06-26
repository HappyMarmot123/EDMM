import type { PropsWithChildren } from "react";
import { act, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Track } from "@/entities/track/model";
import { getCachedTracks } from "@/shared/db/repositories/trackCacheRepo";
import { useFavorites } from "@/features/library/hooks/useFavorites";
import { useRecentPlays } from "@/features/library/hooks/useRecentPlays";
import { LibraryView } from "@/views/library";

jest.mock("@/features/library/hooks/useFavorites");
jest.mock("@/features/library/hooks/useRecentPlays");
jest.mock("@/shared/db/repositories/trackCacheRepo");

const mockUseFavorites = useFavorites as jest.Mock;
const mockUseRecentPlays = useRecentPlays as jest.Mock;
const mockGetCachedTracks = getCachedTracks as jest.Mock;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

const renderLibrary = () => {
  const mockOnPlay = jest.fn();
  const result = render(<LibraryView onPlay={mockOnPlay} />, {
    wrapper: createWrapper(),
  });

  return result;
};

const track = (id: string, title: string): Track => ({
  id,
  source: "cloudinary",
  title,
  artistId: "artist-1",
  artistName: "Artist",
  artworkUrl: "https://example.com/artwork.jpg",
  durationMs: 180000,
  streamUrl: "https://example.com/track.mp3",
  metadata: {},
});

describe("LibraryView", () => {
  const mockToggleFavorite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set(),
      isFavorite: () => false,
      toggle: mockToggleFavorite,
    });

    mockUseRecentPlays.mockReturnValue({ recentIds: [] });
    mockGetCachedTracks.mockResolvedValue([]);
  });

  it("renders cached favorites track", async () => {
    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set(["fav-1"]),
      isFavorite: () => true,
      toggle: mockToggleFavorite,
    });

    mockGetCachedTracks.mockResolvedValue([track("fav-1", "Liked Song")]);

    renderLibrary();

    expect(await screen.findByText("Liked Song")).toBeInTheDocument();
  });

  it("refreshes tracks when favorite and recent ids change", async () => {
    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set(["fav-1"]),
      isFavorite: () => true,
      toggle: mockToggleFavorite,
    });
    mockUseRecentPlays.mockReturnValue({ recentIds: [] });

    mockGetCachedTracks.mockImplementation((ids: string[]) => {
      if (ids[0] === "fav-1") {
        return Promise.resolve([track("fav-1", "Favorite One")]);
      }

      if (ids[0] === "fav-2") {
        return Promise.resolve([track("fav-2", "Favorite Two")]);
      }

      if (ids[0] === "recent-1") {
        return Promise.resolve([track("recent-1", "Recent One")]);
      }

      return Promise.resolve([]);
    });

    const { rerender } = renderLibrary();

    expect(await screen.findByText("Favorite One")).toBeInTheDocument();

    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set(["fav-2"]),
      isFavorite: () => true,
      toggle: mockToggleFavorite,
    });
    mockUseRecentPlays.mockReturnValue({ recentIds: ["recent-1"] });

    rerender(<LibraryView />);

    expect(await screen.findByText("Favorite Two")).toBeInTheDocument();
    expect(await screen.findByText("Recent One")).toBeInTheDocument();
  });

  it("renders empty states when no ids are available", () => {
    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set(),
      isFavorite: () => false,
      toggle: mockToggleFavorite,
    });
    mockUseRecentPlays.mockReturnValue({ recentIds: [] });

    renderLibrary();

    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("Favorites")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Recent Plays/i })).not.toBeInTheDocument();
    expect(mockGetCachedTracks).not.toHaveBeenCalled();
  });

  it("shows loading states for both favorites and recent sections", async () => {
    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set(["fav-1"]),
      isFavorite: () => true,
      toggle: mockToggleFavorite,
    });
    mockUseRecentPlays.mockReturnValue({ recentIds: ["recent-1"] });

    let favoriteResolve: (value: Track[]) => void = () => {};
    let recentResolve: (value: Track[]) => void = () => {};

    mockGetCachedTracks
      .mockImplementationOnce(
        () => new Promise<Track[]>((resolve) => {
          favoriteResolve = resolve;
        }),
      )
      .mockImplementationOnce(
        () => new Promise<Track[]>((resolve) => {
          recentResolve = resolve;
        }),
      );

    renderLibrary();

    expect(screen.getAllByText("Loading...")).toHaveLength(2);

    await act(async () => {
      favoriteResolve([track("fav-1", "Favorite Loading")]);
      recentResolve([track("recent-1", "Recent Loading")]);
    });

    expect(await screen.findByText("Favorite Loading")).toBeInTheDocument();
    expect(await screen.findByText("Recent Loading")).toBeInTheDocument();
  });

  it("deduplicates ids and excludes overlap between favorites and recent", async () => {
    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set(["fav-2", "fav-1", "fav-1"]),
      isFavorite: () => true,
      toggle: mockToggleFavorite,
    });
    mockUseRecentPlays.mockReturnValue({ recentIds: ["fav-1", "recent-1", "fav-1"] });

    mockGetCachedTracks.mockImplementation((ids: string[]) => {
      if (ids.includes("fav-2") || ids.includes("fav-1")) {
        return Promise.resolve([
          track("fav-2", "Favorite Two"),
          track("fav-1", "Favorite One"),
        ]);
      }

      if (ids[0] === "recent-1") {
        return Promise.resolve([track("recent-1", "Recent Only")]);
      }

      return Promise.resolve([]);
    });

    renderLibrary();

    expect(mockGetCachedTracks).toHaveBeenNthCalledWith(1, ["fav-2", "fav-1"]);
    expect(mockGetCachedTracks).toHaveBeenNthCalledWith(2, ["recent-1"]);

    expect(await screen.findByText("Favorite Two")).toBeInTheDocument();
    expect(await screen.findByText("Favorite One")).toBeInTheDocument();
    expect(screen.getByText("Recent Only")).toBeInTheDocument();
  });
});
