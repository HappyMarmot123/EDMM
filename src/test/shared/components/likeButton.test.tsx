import { render, screen, fireEvent } from "@testing-library/react";
import { LikeButton } from "@/shared/components/likeButton";
import { CloudinaryResource } from "@/shared/types/dataType";

// Mock dependencies
jest.mock("@/features/auth/components/protectTooltip", () => {
  return function MockProtectTooltip({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div data-testid="protect-tooltip">{children}</div>;
  };
});

jest.mock("@/entities/Track/trackFavoriteAdapter", () => ({
  TrackFavoriteAdapter: {
    unifyTrack: jest.fn((track) => ({ id: track.asset_id || track.assetId })),
  },
}));

describe("LikeButton", () => {
  const mockTrack: CloudinaryResource = {
    asset_id: "test-asset-id",
    created_at: "2023-01-01",
    status: "active",
    public_id: "test-public-id",
    type: "upload",
    resource_type: "raw",
    asset_folder: "test-folder",
    secure_url: "https://example.com/test.mp3",
    context: {
      alt: "Test Producer",
      caption: "Test Track",
    },
    title: "Test Track",
    producer: "Test Producer",
    album_secure_url: "https://example.com/album.jpg",
  };

  const mockRole = {
    favoriteInteract: true,
  };

  const mockToggleFavorite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render correctly with basic props", () => {
    render(
      <LikeButton
        track={mockTrack}
        role={mockRole}
        isFavorite={false}
        toggleFavorite={mockToggleFavorite}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("should render as favorited when isFavorite is true", () => {
    render(
      <LikeButton
        track={mockTrack}
        role={mockRole}
        isFavorite={true}
        toggleFavorite={mockToggleFavorite}
      />
    );

    const heartIcon = screen.getByRole("button").querySelector("svg");
    expect(heartIcon).toHaveClass("text-pink-500", "fill-pink-500/30");
  });

  it("should call toggleFavorite when clicked", () => {
    render(
      <LikeButton
        track={mockTrack}
        role={mockRole}
        isFavorite={false}
        toggleFavorite={mockToggleFavorite}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockToggleFavorite).toHaveBeenCalledWith("test-asset-id");
  });

  it("should prevent event propagation when clicked", () => {
    const mockParentClick = jest.fn();
    render(
      <div onClick={mockParentClick}>
        <LikeButton
          track={mockTrack}
          role={mockRole}
          isFavorite={false}
          toggleFavorite={mockToggleFavorite}
        />
      </div>
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockToggleFavorite).toHaveBeenCalled();
    expect(mockParentClick).not.toHaveBeenCalled();
  });

  it("should be disabled when favoriteInteract is false", () => {
    const disabledRole = { favoriteInteract: false };
    render(
      <LikeButton
        track={mockTrack}
        role={disabledRole}
        isFavorite={false}
        toggleFavorite={mockToggleFavorite}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("should show loading state when isLoading is true", () => {
    render(
      <LikeButton
        track={mockTrack}
        role={mockRole}
        isFavorite={false}
        toggleFavorite={mockToggleFavorite}
        isLoading={true}
      />
    );

    const button = screen.getByRole("button");
    const heartIcon = button.querySelector("svg");

    expect(button).toBeDisabled();
    expect(heartIcon).toHaveClass("opacity-50", "animate-pulse");
  });

  it("should be disabled when loading even if favoriteInteract is true", () => {
    render(
      <LikeButton
        track={mockTrack}
        role={mockRole}
        isFavorite={false}
        toggleFavorite={mockToggleFavorite}
        isLoading={true}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("should not show hover effects when loading", () => {
    render(
      <LikeButton
        track={mockTrack}
        role={mockRole}
        isFavorite={false}
        toggleFavorite={mockToggleFavorite}
        isLoading={true}
      />
    );

    const button = screen.getByRole("button");
    const heartIcon = button.querySelector("svg");

    expect(heartIcon).not.toHaveClass("hover:text-pink-500");
  });

  it("should not call toggleFavorite when loading and clicked", () => {
    render(
      <LikeButton
        track={mockTrack}
        role={mockRole}
        isFavorite={false}
        toggleFavorite={mockToggleFavorite}
        isLoading={true}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockToggleFavorite).not.toHaveBeenCalled();
  });

  it("should return null when role is not provided", () => {
    const { container } = render(
      <LikeButton
        track={mockTrack}
        role={null as any}
        isFavorite={false}
        toggleFavorite={mockToggleFavorite}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should default isLoading to false when not provided", () => {
    render(
      <LikeButton
        track={mockTrack}
        role={mockRole}
        isFavorite={false}
        toggleFavorite={mockToggleFavorite}
      />
    );

    const button = screen.getByRole("button");
    const heartIcon = button.querySelector("svg");

    expect(button).not.toBeDisabled();
    expect(heartIcon).not.toHaveClass("opacity-50", "animate-pulse");
  });
});
