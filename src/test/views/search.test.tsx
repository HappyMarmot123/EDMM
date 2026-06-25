import type { PropsWithChildren } from "react";
import { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Track } from "@/entities/track/model";
import { SearchView } from "@/views/search";
import { useTrackSearch } from "@/features/search/hooks/useTrackSearch";

jest.mock("@/features/search/hooks/useTrackSearch");

const mockUseTrackSearch = useTrackSearch as jest.Mock;

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
    mockUseTrackSearch.mockImplementation((query: string) => ({
      data: query.trim() ? tracks : undefined,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    }));
  });

  it("renders the full search surface before a query is entered", () => {
    render(<SearchView onPlay={mockOnPlay} />, { wrapper: createWrapper() });

    expect(screen.getByRole("heading", { name: "Search" })).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", {
        name: /search tracks, artists, or moods/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Browse by vibe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /melodic techno/i })).toBeInTheDocument();
    expect(screen.queryByTestId("search-result-title-track-1")).not.toBeInTheDocument();
  });

  it("renders query result after typing into search input", () => {
    render(<SearchView onPlay={mockOnPlay} />, { wrapper: createWrapper() });

    const queryInput = screen.getByRole("searchbox", {
      name: /search tracks, artists, or moods/i,
    });
    const searchValue = "  search terms  ";
    const normalizedSearchValue = "search terms";
    fireEvent.change(queryInput, { target: { value: searchValue } });

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(mockUseTrackSearch).toHaveBeenLastCalledWith(normalizedSearchValue);
    expect(screen.getByTestId("search-result-title-track-1")).toBeInTheDocument();
  });

  it("starts a search from a browse card", () => {
    render(<SearchView onPlay={mockOnPlay} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole("button", { name: /melodic techno/i }));

    expect(mockUseTrackSearch).toHaveBeenLastCalledWith("melodic techno");
    expect(screen.getByDisplayValue("melodic techno")).toBeInTheDocument();
  });

  it("renders loading, empty, and error states", () => {
    mockUseTrackSearch.mockImplementation((query: string) => ({
      data: query.trim() ? [] : undefined,
      isLoading: query === "loading",
      isError: query === "broken",
      refetch: jest.fn(),
    }));

    const { rerender } = render(<SearchView onPlay={mockOnPlay} />, {
      wrapper: createWrapper(),
    });

    const queryInput = screen.getByRole("searchbox", {
      name: /search tracks, artists, or moods/i,
    });
    fireEvent.change(queryInput, { target: { value: "loading" } });

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(screen.getByRole("status")).toHaveTextContent("Searching Audius");

    fireEvent.change(queryInput, { target: { value: "no results" } });

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(screen.getByText(/No tracks found for "no results"/)).toBeInTheDocument();

    fireEvent.change(queryInput, { target: { value: "broken" } });

    act(() => {
      jest.advanceTimersByTime(250);
    });
    rerender(<SearchView onPlay={mockOnPlay} />);

    expect(screen.getByText("Search failed")).toBeInTheDocument();
  });

  afterEach(() => {
    jest.useRealTimers();
  });
});
