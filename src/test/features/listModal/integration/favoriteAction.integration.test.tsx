import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { useFavoriteAction } from "@/features/listModal/hook/useFavoriteAction";
import { LikeButton } from "@/shared/components/likeButton";
import { CloudinaryResource } from "@/shared/types/dataType";

// Mock dependencies
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

jest.mock("@/shared/providers/authProvider", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/app/store/favoriteStore", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/shared/api/httpClient", () => ({
  httpClient: {
    request: jest.fn(),
  },
}));

jest.mock("lodash", () => ({
  debounce: jest.fn((fn) => fn),
}));

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

// Mock React hooks
const mockAddOptimistic = jest.fn();
const mockStartTransition = jest.fn((fn) => fn());

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useOptimistic: jest.fn(() => [
    { favoriteAssetIds: new Set(), pendingToggle: null },
    mockAddOptimistic,
  ]),
  useTransition: jest.fn(() => [false, mockStartTransition]),
}));

// Simple Test Component
const TestComponent: React.FC<{
  user: any;
  track: CloudinaryResource;
  favoriteStore: any;
}> = ({ user, track, favoriteStore }) => {
  const { useAuth } = require("@/shared/providers/authProvider");
  const useFavoriteStore = require("@/app/store/favoriteStore").default;
  const { httpClient } = require("@/shared/api/httpClient");

  (useAuth as jest.Mock).mockReturnValue({ user });
  (useFavoriteStore as unknown as jest.Mock).mockReturnValue(favoriteStore);
  (httpClient.request as jest.Mock).mockResolvedValue({ data: "success" });

  const { toggleFavorite, isPending, isLoading } = useFavoriteAction();

  const role = { favoriteInteract: true };
  const isFavorite = favoriteStore.favoriteAssetIds.has(track.asset_id);

  return (
    <div>
      <div data-testid="loading-indicator">
        {isPending && <span>Loading...</span>}
        {isLoading && <span>Processing...</span>}
      </div>
      <LikeButton
        track={track}
        role={role}
        isFavorite={isFavorite}
        toggleFavorite={toggleFavorite}
        isLoading={isLoading}
      />
    </div>
  );
};

describe("Favorite Action Integration Tests", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
  };

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

  const mockFavoriteStore = {
    favoriteAssetIds: new Set(),
    setFavorites: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render LikeButton with correct props", () => {
    render(
      <TestComponent
        user={mockUser}
        track={mockTrack}
        favoriteStore={mockFavoriteStore}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("should handle click and trigger optimistic update", () => {
    render(
      <TestComponent
        user={mockUser}
        track={mockTrack}
        favoriteStore={mockFavoriteStore}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockAddOptimistic).toHaveBeenCalledWith({
      type: "TOGGLE_FAVORITE",
      assetId: "test-asset-id",
    });
  });

  it("should show error toast when user is not logged in", () => {
    render(
      <TestComponent
        user={null}
        track={mockTrack}
        favoriteStore={mockFavoriteStore}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(toast.error).toHaveBeenCalledWith(
      "You need to login to like tracks."
    );
  });

  it("should show loading state when pending", () => {
    const { useTransition } = require("react");
    useTransition.mockReturnValue([true, mockStartTransition]);

    render(
      <TestComponent
        user={mockUser}
        track={mockTrack}
        favoriteStore={mockFavoriteStore}
      />
    );

    const loadingIndicator = screen.getByTestId("loading-indicator");
    expect(loadingIndicator).toHaveTextContent("Processing...");
  });

  it("should reflect favorite state in UI", () => {
    const favoritedStore = {
      ...mockFavoriteStore,
      favoriteAssetIds: new Set(["test-asset-id"]),
    };

    render(
      <TestComponent
        user={mockUser}
        track={mockTrack}
        favoriteStore={favoritedStore}
      />
    );

    const button = screen.getByRole("button");
    const heartIcon = button.querySelector("svg");

    expect(heartIcon).toHaveClass("text-pink-500", "fill-pink-500/30");
  });

  it("should disable button when loading", () => {
    const { useTransition } = require("react");
    useTransition.mockReturnValue([true, mockStartTransition]);

    render(
      <TestComponent
        user={mockUser}
        track={mockTrack}
        favoriteStore={mockFavoriteStore}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });
});
