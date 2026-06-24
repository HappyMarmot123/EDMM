import type { PropsWithChildren } from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Track } from "@/entities/track/model";
import { useFavorites } from "@/features/library/hooks/useFavorites";
import { useTrending } from "@/features/discover/hooks/useTrending";
import { HomeView } from "@/views/home";

jest.mock("@/features/discover/hooks/useTrending");
jest.mock("@/features/library/hooks/useFavorites");

const mockUseTrending = useTrending as jest.Mock;
const mockUseFavorites = useFavorites as jest.Mock;
const mockToggleFavorite = jest.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

const tracks: Track[] = [
  {
    id: "track-1",
    source: "audius",
    title: "Trending Alpha",
    artistId: "artist-1",
    artistName: "Artist One",
    albumName: "Album One",
    artworkUrl: "https://example.com/alpha.jpg",
    durationMs: 210000,
    streamUrl: "https://example.com/alpha.mp3",
    metadata: {},
  },
];

describe("HomeView", () => {
  const mockOnPlay = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFavorites.mockReturnValue({
      isFavorite: () => false,
      toggle: mockToggleFavorite,
    });
  });

  it("renders trending tracks", () => {
    mockUseTrending.mockReturnValue({
      data: tracks,
      isLoading: false,
    });

    render(<HomeView onPlay={mockOnPlay} />, { wrapper: createWrapper() });

    expect(screen.getByRole("heading")).toBeInTheDocument();
    expect(screen.getByText("Trending Alpha")).toBeInTheDocument();
    expect(mockOnPlay).not.toHaveBeenCalled();
  });

  it("renders loading state", () => {
    mockUseTrending.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<HomeView onPlay={mockOnPlay} />, { wrapper: createWrapper() });

    expect(screen.getByRole("heading")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
