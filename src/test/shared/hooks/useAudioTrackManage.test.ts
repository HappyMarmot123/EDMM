import { renderHook, act } from "@testing-library/react";
import { useAudioTrackManage } from "@/shared/hooks/audio/useAudioTrackManage";
import useCloudinaryStore from "@/app/store/cloudinaryStore";
import useTrackStore from "@/app/store/trackStore";
import useAudioInstanceStore from "@/app/store/audioInstanceStore";
import {
  CloudinaryResource,
  TrackInfo,
  CloudinaryResourceMap,
} from "@/shared/types/dataType";

// Mock zustand stores
jest.mock("@/app/store/cloudinaryStore");
jest.mock("@/app/store/trackStore");
jest.mock("@/app/store/audioInstanceStore");

const useCloudinaryStoreMock = useCloudinaryStore as unknown as jest.Mock;
const useTrackStoreMock = useTrackStore as unknown as jest.Mock;
const useAudioInstanceStoreMock = useAudioInstanceStore as unknown as jest.Mock;

const mockTrack1: TrackInfo = {
  assetId: "1",
  name: "Track 1",
  producer: "Producer 1",
  artworkId: "https://via.placeholder.com/224",
  album: "Album 1",
  url: "https://example.com/track1.mp3",
};

const mockCloudinaryResource1: CloudinaryResource = {
  asset_id: "1",
  title: "Track 1",
  producer: "Producer 1",
  album_secure_url: "https://via.placeholder.com/48",
  context: { caption: "Album 1", alt: "Track 1 Album Art" },
  secure_url: "https://example.com/track1.mp3",
  public_id: "public1",
  resource_type: "video",
  type: "upload",
  created_at: "",
  status: "active",
  asset_folder: "audio",
};

const mockCloudinaryResource2: CloudinaryResource = {
  ...mockCloudinaryResource1,
  asset_id: "2",
  title: "Track 2",
  producer: "Producer 2",
};

const mockCloudinaryResource3: CloudinaryResource = {
  ...mockCloudinaryResource1,
  asset_id: "3",
  title: "Track 3",
  producer: "Producer 3",
};

const mockCloudinaryData: CloudinaryResourceMap = new Map([
  ["1", mockCloudinaryResource1],
  ["2", mockCloudinaryResource2],
  ["3", mockCloudinaryResource3],
]);

describe("useAudioTrackManage Hook with useReducer", () => {
  let mockSetTrack: jest.Mock;
  const mockTogglePlayPause = jest.fn();

  const setupTrackStoreMock = (currentTrack: TrackInfo) => {
    useTrackStoreMock.mockImplementation((selector: (state: any) => any) => {
      const state = {
        currentTrack,
        isPlaying: false,
        setTrack: mockSetTrack,
        togglePlayPause: mockTogglePlayPause,
      };
      return selector(state);
    });
  };

  beforeEach(() => {
    mockSetTrack = jest.fn();

    useCloudinaryStoreMock.mockImplementation(
      (selector: (state: any) => any) => {
        const state = {
          cloudinaryData: mockCloudinaryData,
        };
        return selector(state);
      }
    );

    setupTrackStoreMock(mockTrack1);

    useAudioInstanceStoreMock.mockImplementation(
      (selector: (state: any) => any) => {
        const state = {
          audioContext: { state: "running" },
        };
        return selector(state);
      }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call setTrack with the next track when playNextTrack is called", () => {
    const { result } = renderHook(() => useAudioTrackManage());

    act(() => {
      result.current.playNextTrack();
    });

    expect(mockSetTrack).toHaveBeenCalledWith(
      expect.objectContaining({ assetId: "2" }),
      false
    );
  });

  it("should call setTrack with the previous track when playPrevTrack is called", () => {
    setupTrackStoreMock({ ...mockTrack1, assetId: "2" }); // start from track 2

    const { result } = renderHook(() => useAudioTrackManage());

    act(() => {
      result.current.playPrevTrack();
    });

    expect(mockSetTrack).toHaveBeenCalledWith(
      expect.objectContaining({ assetId: "1" }),
      false
    );
  });

  it("should loop to the first track when playNextTrack is on the last track", () => {
    setupTrackStoreMock({ ...mockTrack1, assetId: "3" }); // start from track 3
    const { result } = renderHook(() => useAudioTrackManage());

    act(() => {
      result.current.playNextTrack();
    });

    expect(mockSetTrack).toHaveBeenCalledWith(
      expect.objectContaining({ assetId: "1" }),
      false
    );
  });
});
