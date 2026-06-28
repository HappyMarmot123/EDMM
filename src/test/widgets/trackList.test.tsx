import { render, screen, fireEvent } from "@testing-library/react";
import { Track } from "@/entities/Track/model";
import { useFavorites } from "@/features/library/hooks/useFavorites";
import { TrackList } from "@/widgets/trackList";

jest.mock("@/features/library/hooks/useFavorites");

const mockUseFavorites = useFavorites as jest.Mock;

const tracks: Track[] = [
  {
    id: "track-1",
    source: "cloudinary",
    title: "Alpha",
    artistId: "artist-1",
    artistName: "Artist A",
    albumName: "Album A",
    artworkUrl: "https://example.com/alpha.jpg",
    durationMs: 180000,
    streamUrl: "https://example.com/alpha.mp3",
    metadata: {},
  },
  {
    id: "track-2",
    source: "cloudinary",
    title: "Beta",
    artistId: "artist-2",
    artistName: "Artist B",
    albumName: "Album B",
    artworkUrl: "https://example.com/beta.jpg",
    durationMs: 200000,
    streamUrl: "https://example.com/beta.mp3",
    metadata: {},
  },
];

describe("TrackList", () => {
  const mockOnPlay = jest.fn();
  const mockToggleFavorite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFavorites.mockReturnValue({
      isFavorite: (id: string) => id === "track-2",
      toggle: mockToggleFavorite,
    });
  });

  it("calls onPlay with the clicked track", () => {
    render(<TrackList tracks={tracks} onPlay={mockOnPlay} />);

    fireEvent.click(screen.getByRole("button", { name: "Play Alpha" }));

    expect(mockOnPlay).toHaveBeenCalledTimes(1);
    expect(mockOnPlay).toHaveBeenCalledWith(tracks[0]);
  });

  it("calls favorites hook toggle action when favorite button is clicked", () => {
    render(<TrackList tracks={tracks} onPlay={mockOnPlay} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Add Alpha to favorites" })
    );

    expect(mockToggleFavorite).toHaveBeenCalledTimes(1);
    expect(mockToggleFavorite).toHaveBeenCalledWith("track-1");
  });

  it("renders loading message when loading", () => {
    render(<TrackList tracks={tracks} onPlay={mockOnPlay} isLoading />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders empty message when track list is empty", () => {
    render(<TrackList tracks={[]} onPlay={mockOnPlay} />);

    expect(screen.getByText(/트랙이 없습니다/)).toBeInTheDocument();
  });

  it.each([undefined, null])(
    "renders empty message when tracks is %s",
    (value) => {
      if (value === undefined) {
        render(<TrackList onPlay={mockOnPlay} />);
      } else {
        render(<TrackList tracks={null} onPlay={mockOnPlay} />);
      }

      expect(screen.getByText(/트랙이 없습니다/)).toBeInTheDocument();
    }
  );
});
