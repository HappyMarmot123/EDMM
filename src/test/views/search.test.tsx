import { fireEvent, render, screen } from "@testing-library/react";
import type { Track } from "@/entities/track/model";
import { useCloudinaryTracks } from "@/features/cloudinary/hooks/useCloudinaryTracks";
import { useFavorites } from "@/features/library/hooks/useFavorites";
import { useRecentPlays } from "@/features/library/hooks/useRecentPlays";
import {
  getCachedTrack,
  getCachedTracks,
} from "@/shared/db/repositories/trackCacheRepo";
import { SearchView } from "@/views/search";

jest.mock("@/features/cloudinary/hooks/useCloudinaryTracks");
jest.mock("@/features/library/hooks/useFavorites");
jest.mock("@/features/library/hooks/useRecentPlays");
jest.mock("@/shared/db/repositories/trackCacheRepo");

const mockUseCloudinaryTracks = useCloudinaryTracks as jest.Mock;
const mockUseFavorites = useFavorites as jest.Mock;
const mockUseRecentPlays = useRecentPlays as jest.Mock;
const mockGetCachedTracks = getCachedTracks as jest.MockedFunction<
  typeof getCachedTracks
>;
const mockGetCachedTrack = getCachedTrack as jest.MockedFunction<
  typeof getCachedTrack
>;

const wrapperTrack: Track = {
  id: "cloudinary:search-wrapper",
  source: "cloudinary",
  title: "Wrapper Track",
  artistId: "cloudinary:artist",
  artistName: "EDMM",
  albumName: "Shell",
  artworkUrl: "",
  durationMs: 180000,
  streamUrl: "https://example.com/wrapper.mp3",
  metadata: {},
};
const favoriteTrack: Track = {
  ...wrapperTrack,
  id: "cloudinary:fav-1",
  title: "Search Favorite Track",
  streamUrl: "https://example.com/favorite.mp3",
};
const deepLinkedTrack: Track = {
  ...wrapperTrack,
  id: "cloudinary:asset-1",
  title: "Cached Deep Link Track",
  streamUrl: "https://example.com/deep-link.mp3",
};

describe("SearchView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCloudinaryTracks.mockReturnValue({
      data: [wrapperTrack],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set<string>(),
      isFavorite: () => false,
      toggle: jest.fn(),
    });
    mockUseRecentPlays.mockReturnValue({ recentIds: [] });
    mockGetCachedTracks.mockResolvedValue([]);
    mockGetCachedTrack.mockImplementation(async (trackId: string) =>
      [wrapperTrack, favoriteTrack, deepLinkedTrack].find((track) => track.id === trackId),
    );
  });

  it("renders the unified music shell heading", () => {
    render(<SearchView />);

    expect(
      screen.getByRole("heading", { name: "EDMM catalog" }),
    ).toBeInTheDocument();
  });

  it("passes play events through the shell", () => {
    const onPlay = jest.fn();

    render(<SearchView onPlay={onPlay} />);
    fireEvent.click(screen.getByRole("button", { name: "Play Wrapper Track" }));

    expect(onPlay).toHaveBeenCalledWith(wrapperTrack, [wrapperTrack]);
  });

  it("starts on the Favorites view from prop", async () => {
    mockUseFavorites.mockReturnValue({
      favoriteIds: new Set(["cloudinary:fav-1"]),
      isFavorite: (id: string) => id === "cloudinary:fav-1",
      toggle: jest.fn(),
    });
    mockGetCachedTracks.mockResolvedValue([favoriteTrack]);

    render(<SearchView initialView="favorites" />);

    expect(screen.getByRole("button", { name: "Favorites" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await screen.findByText("Search Favorite Track")).toBeInTheDocument();
  });

  it("opens cached track details from initialTrackId", async () => {
    render(<SearchView initialTrackId="cloudinary:asset-1" />);

    expect(mockGetCachedTrack).toHaveBeenCalledWith("cloudinary:asset-1");
    expect(await screen.findByTestId("track-detail-title")).toHaveTextContent(
      "Cached Deep Link Track",
    );
  });
});
