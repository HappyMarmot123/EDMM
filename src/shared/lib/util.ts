import { SetStateAction } from "react";
import { Dispatch, MouseEvent, RefObject } from "react";

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

export const CLAMP_VOLUME = (volume: number) =>
  Math.max(0, Math.min(1, volume));
