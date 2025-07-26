import React from "react";
import { render } from "@testing-library/react";
import { useListModal } from "@/features/listModal/hook/useListModal";

// useListModal의 모든 의존성을 모의(mock) 처리합니다.
jest.mock("@/shared/providers/audioPlayerProvider", () => ({
  useAudioPlayer: jest.fn(),
}));
jest.mock("@/shared/providers/authProvider", () => ({
  useAuth: jest.fn(),
}));
jest.mock("@/app/store/cloudinaryStore", () => jest.fn());
jest.mock("@/features/listModal/hook/useFavorites", () => ({
  useFavorites: jest.fn(),
}));
jest.mock("@/shared/hooks/useVolumeControl", () => ({
  useVolumeControl: jest.fn(),
}));
jest.mock("sonner", () => ({
  toast: jest.fn(),
}));
jest.mock("@/app/store/favoriteStore", () => jest.fn());
jest.mock("@/features/listModal/hook/useFavoriteAction", () => ({
  useFavoriteAction: jest.fn(),
}));
jest.mock("@/shared/hooks/useViewport", () => ({
  useViewport: jest.fn(),
}));

// 타입 캐스팅을 위해 모의된 훅들을 가져옵니다.
import { useAudioPlayer } from "@/shared/providers/audioPlayerProvider";
import { useAuth } from "@/shared/providers/authProvider";
import useCloudinaryStore from "@/app/store/cloudinaryStore";
import { useFavorites } from "@/features/listModal/hook/useFavorites";
import { useVolumeControl } from "@/shared/hooks/useVolumeControl";
import favoriteStore from "@/app/store/favoriteStore";
import { useFavoriteAction } from "@/features/listModal/hook/useFavoriteAction";
import { useViewport } from "@/shared/hooks/useViewport";

// 모의 훅/스토어에 대한 참조를 저장합니다.
const mockUseAudioPlayer = useAudioPlayer as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;
const mockUseCloudinaryStore = useCloudinaryStore as unknown as jest.Mock;
const mockUseFavorites = useFavorites as jest.Mock;
const mockUseVolumeControl = useVolumeControl as jest.Mock;
const mockFavoriteStore = favoriteStore as unknown as jest.Mock;
const mockUseFavoriteAction = useFavoriteAction as jest.Mock;
const mockUseViewport = useViewport as jest.Mock;

// 훅을 호출하기 위한 테스트 컴포넌트입니다.
const TestComponent = () => {
  useListModal();
  return null;
};

describe("useListModal hook - cursor visibility logic", () => {
  let secondaryCursor: HTMLDivElement;
  const stableCloudinaryData = new Map(); // 안정적인 참조를 위해 외부에 선언

  beforeEach(() => {
    // 모든 모의된 의존성에 대한 기본 반환 값을 설정합니다.
    mockUseAudioPlayer.mockReturnValue({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isBuffering: false,
      volume: 1,
      isMuted: false,
      togglePlayPause: jest.fn(),
      nextTrack: jest.fn(),
      prevTrack: jest.fn(),
      setVolume: jest.fn(),
      setLiveVolume: jest.fn(),
      toggleMute: jest.fn(),
      handleSelectTrack: jest.fn(),
      audioAnalyser: null,
    });
    mockUseAuth.mockReturnValue({ user: null });
    mockUseCloudinaryStore.mockImplementation((selector) => {
      const state = {
        cloudinaryData: stableCloudinaryData, // 항상 동일한 참조를 사용
        isLoadingCloudinary: false,
      };
      return selector(state);
    });
    mockUseFavorites.mockReturnValue({ data: [], isLoading: false });
    mockUseVolumeControl.mockReturnValue({
      localVolume: 1,
      showVolumeSlider: false,
      handleVolumeChange: jest.fn(),
      handleVolumeChangeEnd: jest.fn(),
      handleVolumeMouseEnter: jest.fn(),
      handleVolumeMouseLeave: jest.fn(),
    });
    mockFavoriteStore.mockReturnValue({
      favoriteAssetIds: new Set(),
      setFavorites: jest.fn(),
      toggleFavorite: jest.fn(),
    });
    mockUseFavoriteAction.mockReturnValue({
      toggleFavorite: jest.fn(),
      isPending: false,
      isLoading: false,
      error: null,
      optimisticFavoriteIds: new Set(),
    });

    // 각 테스트 전에 커서 엘리먼트를 생성하고 DOM에 추가합니다.
    secondaryCursor = document.createElement("div");
    secondaryCursor.className = "secondary-cursor";
    document.body.appendChild(secondaryCursor);
  });

  afterEach(() => {
    // DOM과 모의 객체를 정리합니다.
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  test("should not hide cursor on initial server-side render (isClient: false)", () => {
    mockUseViewport.mockReturnValue({ isClient: false, isMobile: false });
    render(<TestComponent />);
    expect(secondaryCursor.classList.contains("hidden")).toBe(false);
  });

  test("should hide cursor on desktop client-side render (isClient: true, isMobile: false)", () => {
    mockUseViewport.mockReturnValue({ isClient: true, isMobile: false });
    render(<TestComponent />);
    expect(secondaryCursor.classList.contains("hidden")).toBe(true);
  });

  test("should not hide cursor on mobile client-side render (isClient: true, isMobile: true)", () => {
    mockUseViewport.mockReturnValue({ isClient: true, isMobile: true });
    render(<TestComponent />);
    expect(secondaryCursor.classList.contains("hidden")).toBe(false);
  });

  test('should remove "hidden" class from cursor on unmount', () => {
    mockUseViewport.mockReturnValue({ isClient: true, isMobile: false });
    const { unmount } = render(<TestComponent />);
    expect(secondaryCursor.classList.contains("hidden")).toBe(true);
    unmount();
    expect(secondaryCursor.classList.contains("hidden")).toBe(false);
  });

  test("should not throw an error if cursor element is not found", () => {
    document.body.removeChild(secondaryCursor);
    mockUseViewport.mockReturnValue({ isClient: true, isMobile: false });
    expect(() => render(<TestComponent />)).not.toThrow();
  });
});
