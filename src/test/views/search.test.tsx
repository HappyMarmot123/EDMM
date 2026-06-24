import type { PropsWithChildren } from "react";
import { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Track } from "@/entities/track/model";
import { SearchView } from "@/views/search";
import { useFavorites } from "@/features/library/hooks/useFavorites";
import { useTrackSearch } from "@/features/search/hooks/useTrackSearch";

jest.mock("@/features/search/hooks/useTrackSearch");
jest.mock("@/features/library/hooks/useFavorites");

const mockUseTrackSearch = useTrackSearch as jest.Mock;
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
    title: "Search Track One",
    artistId: "artist-1",
    artistName: "Artist One",
    albumName: "Album One",
    artworkUrl: "https://example.com/search-one.jpg",
    durationMs: 213000,
    streamUrl: "https://example.com/search-one.mp3",
    metadata: {},
  },
];

describe("SearchView", () => {
  const mockOnPlay = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUseFavorites.mockReturnValue({
      isFavorite: () => false,
      toggle: mockToggleFavorite,
    });
    mockUseTrackSearch.mockImplementation((query: string) => ({
      data: query.trim() ? tracks : undefined,
      isLoading: false,
    }));
  });

  it("renders query result after typing into search input", () => {
    render(<SearchView onPlay={mockOnPlay} />, { wrapper: createWrapper() });

    const queryInput = screen.getByRole("searchbox", { name: /query input/i });
    const searchValue = "  search terms  ";
    const normalizedSearchValue = "search terms";
    fireEvent.change(queryInput, { target: { value: searchValue } });

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(mockUseTrackSearch).toHaveBeenLastCalledWith(normalizedSearchValue);
    expect(screen.getByTestId("track-row-title-track-1")).toBeInTheDocument();
  });

  afterEach(() => {
    jest.useRealTimers();
  });
});
