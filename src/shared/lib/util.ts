import { AudioPlayerState, CloudinaryResource } from "@/shared/types/dataType";
import { CSSProperties, SetStateAction } from "react";
import { Dispatch, MouseEvent, RefObject } from "react";
import clsx from "clsx";
import { Variants } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { debounce } from "lodash";
import { httpClient } from "@/shared/api/httpClient";

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const minutesStr = String(minutes).padStart(2, "0");
  const secsStr = String(secs).padStart(2, "0");
  return `${minutesStr}:${secsStr}`;
}

export function replaceKeyName(resource: CloudinaryResource) {
  return {
    ...resource,
    title: resource.context?.caption || null,
    producer: resource.context?.alt || null,
  };
}

type FavoriteGetter = () => { favoriteAssetIds: Set<string> };
type FavoriteSetter = (newState: { favoriteAssetIds: Set<string> }) => void;

export const handleOnLike = async (
  assetId: string,
  userId: string,
  get: FavoriteGetter,
  set: FavoriteSetter
): Promise<void> => {
  const { favoriteAssetIds } = get();
  const isCurrentlyFavorite = favoriteAssetIds.has(assetId);
  const newIsFavorite = !isCurrentlyFavorite;

  const originalFavorites = new Set(favoriteAssetIds);
  const newFavorites = new Set(originalFavorites);

  if (newIsFavorite) {
    newFavorites.add(assetId);
  } else {
    newFavorites.delete(assetId);
  }
  set({ favoriteAssetIds: newFavorites });

  try {
    const debouncedRequest = debounce(async () => {
      const response = await httpClient.request({
        url: "/api/supabase",
        method: "POST",
        payload: {
          assetId,
          userId,
          isFavorite: newIsFavorite,
        },
      });
      return response;
    }, 1000);

    await debouncedRequest();
  } catch (error) {
    set({ favoriteAssetIds: originalFavorites });
    toast.error("Something went wrong. Could you try again?");
    console.error("Error liking track:", error);
  }
};

export const handleSeek = (
  event: MouseEvent<HTMLDivElement>,
  seekBarContainerRef: RefObject<HTMLDivElement | null>,
  duration: number | undefined,
  seek: (time: number) => void
) => {
  if (!seekBarContainerRef.current || !duration) return;
  const seekBarRect = seekBarContainerRef.current.getBoundingClientRect();
  const seekRatio = (event.clientX - seekBarRect.left) / seekBarRect.width;
  const seekTime = duration * seekRatio;
  seek(seekTime);
};

export const handleSeekMouseMove = (
  event: MouseEvent<HTMLDivElement>,
  seekBarContainerRef: RefObject<HTMLDivElement | null>,
  duration: number | undefined,
  setSeekHoverTime: Dispatch<SetStateAction<number | null>>,
  setSeekHoverPosition: Dispatch<SetStateAction<number>>
) => {
  if (!seekBarContainerRef.current || !duration) return;
  const seekBarRect = seekBarContainerRef.current.getBoundingClientRect();
  const hoverRatio = Math.max(
    0,
    Math.min(1, (event.clientX - seekBarRect.left) / seekBarRect.width)
  );
  const hoverTime = duration * hoverRatio;
  const hoverPosition = hoverRatio * seekBarRect.width;
  setSeekHoverTime(hoverTime);
  setSeekHoverPosition(hoverPosition);
};

export const handleSeekMouseOut = (
  setSeekHoverTime: Dispatch<SetStateAction<number | null>>,
  setSeekHoverPosition: Dispatch<SetStateAction<number>>
) => {
  setSeekHoverTime(null);
  setSeekHoverPosition(0);
};

export const handleSeekInteraction = (
  event: MouseEvent<HTMLDivElement>,
  seekBarContainerRef: RefObject<HTMLDivElement | null>,
  duration: number | undefined,
  seek: (time: number) => void,
  setSeekHoverTime: Dispatch<SetStateAction<number | null>>,
  setSeekHoverPosition: Dispatch<SetStateAction<number>>
) => {
  if (!seekBarContainerRef.current || duration === 0) return;

  const rect = seekBarContainerRef.current.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const percentage = Math.min(Math.max(offsetX / rect.width, 0), 1);
  const time = percentage * (duration as number);

  const isClick = event.type === "click";
  const isMouseMove = event.type === "mousemove";

  if (isClick) {
    seek(time);
  } else {
    setSeekHoverTime(time);
    setSeekHoverPosition(offsetX);
  }
};

export const handleMouseMove = (
  e: React.MouseEvent<HTMLElement>,
  seekBarContainerRef: RefObject<HTMLDivElement | null>,
  seekTimeTooltipRef: RefObject<HTMLDivElement | null>,
  duration: number | undefined
) => {
  if (!seekBarContainerRef.current || !seekTimeTooltipRef.current || !duration)
    return console.warn(
      "seekBarContainerRef, seekTimeTooltipRef, duration is required"
    );

  const seekBar = seekBarContainerRef.current;
  const tooltip = seekTimeTooltipRef.current;
  tooltip.style.opacity = "1";

  const rect = seekBar.getBoundingClientRect();
  let hoverPosition = e.clientX - rect.left;
  hoverPosition = Math.max(0, Math.min(hoverPosition, rect.width));

  seekBar.style.setProperty("--seek-hover-width", `${hoverPosition}px`);
  tooltip.style.left = `${hoverPosition}px`;

  const hoverFraction = hoverPosition / rect.width;
  const hoverTime = hoverFraction * duration;
  tooltip.setAttribute("data-seek-time", formatTime(hoverTime));
};

export const handleMouseOut = (
  seekTimeTooltipRef: RefObject<HTMLDivElement | null>,
  seekBarContainerRef: RefObject<HTMLDivElement | null>
) => {
  if (seekTimeTooltipRef.current) {
    seekTimeTooltipRef.current.style.opacity = "0";
  }
  if (seekBarContainerRef.current) {
    seekBarContainerRef.current.style.setProperty("--seek-hover-width", "0px");
  }
};

// className
// 	영역, 위치
// 	폰트, 색
// 	박스
//  기타
export const albumArtClassName = (isPlaying: boolean, isBuffering: boolean) => {
  return clsx(
    "absolute w-[92px] h-[92px] top-[-22px] ml-[32px]",
    "bg-gray-300",
    "rounded-full overflow-hidden hover:scale-105 shadow-[0_0_0_10px_#fff]",
    "cursor-pointer transform rotate-0 transition-all duration-300 ease-[ease]",
    isPlaying && [
      "active top-[-32px]",
      "shadow-[0_0_0_4px_#fff7f7,_0_30px_50px_-15px_#afb7c1]",
    ],
    isBuffering && [
      "buffering",
      "[&>img]:opacity-25",
      "[&>img.active]:opacity-80",
      "[&>img.active]:blur-sm",
      "[&_#buffer-box]:opacity-100",
    ]
  );
};

export const CLAMP_VOLUME = (volume: number) =>
  Math.max(0, Math.min(1, volume));

export const mergeFunction = (
  persistedState: unknown | AudioPlayerState,
  currentState: AudioPlayerState
) => ({
  ...currentState,
  ...(persistedState as object),
  isPlaying: false,
  isBuffering: false,
  currentTime: 0,
});

export const listModalVariants: Variants = {
  open: {
    opacity: 1,
    scale: 1,
    visibility: "visible" as CSSProperties["visibility"],
    transition: { duration: 0.3, ease: "easeInOut" },
  },
  closed: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.3, ease: "easeInOut" },
    transitionEnd: {
      visibility: "hidden" as CSSProperties["visibility"],
    },
  },
};
