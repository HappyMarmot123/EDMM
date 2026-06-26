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
    mockGetCachedTrack.mockResolvedValue(wrapperTrack);
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
});
