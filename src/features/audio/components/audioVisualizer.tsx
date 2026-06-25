"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";

export interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  className?: string;
  trackTitle?: string;
  artistName?: string;
  isCurrentTrack?: boolean;
}

const BASE_CANVAS_HEIGHT = 224;
const BAR_WIDTH_RATIO = 2.5;
const BAR_GAP = 3;
const SEGMENT_VISIBLE_HEIGHT = 6;
const SEGMENT_GAP_HEIGHT = 1;
const LOW_FREQUENCY_PUMPING = 0.6;

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function getCanvasContext(canvas: HTMLCanvasElement) {
  try {
    return canvas.getContext("2d");
  } catch {
    return null;
  }
}

function syncCanvasSize(canvas: HTMLCanvasElement) {
  const pixelRatio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round((rect.width || 224) * pixelRatio));
  const height = Math.max(1, Math.round((rect.height || 224) * pixelRatio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  return pixelRatio;
}

function getPumpedBarHeight(
  value: number,
  index: number,
  bufferLength: number,
  canvasHeight: number
) {
  const lowFreqBoost = 1 + LOW_FREQUENCY_PUMPING * (1 - index / bufferLength);
  const responsiveScale = canvasHeight / BASE_CANVAS_HEIGHT;

  return (value / 1.5) * lowFreqBoost * responsiveScale;
}

function getRoseSpectrumColor(
  value: number,
  index: number,
  bufferLength: number
) {
  const position = bufferLength > 1 ? index / (bufferLength - 1) : 0;
  const energy = Math.min(1, value / 255);
  const red = 255 - position * 34 + energy * 10;
  const green = 118 + position * 48 + energy * 80;
  const blue = 144 + position * 62 + energy * 58;
  const alpha = 0.64 + energy * 0.32;

  return `rgba(${clampChannel(red)}, ${clampChannel(green)}, ${clampChannel(
    blue
  )}, ${alpha.toFixed(2)})`;
}

function drawVisualizerBase(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  pixelRatio: number
) {
  const baselineHeight = Math.max(1, pixelRatio);
  const markerWidth = Math.max(1, pixelRatio);
  const markerHeight = Math.max(12 * pixelRatio, height * 0.07);
  const markerStep = Math.max(34 * pixelRatio, width / 10);

  context.fillStyle = "rgba(255, 152, 162, 0.08)";
  context.fillRect(0, height - baselineHeight, width, baselineHeight);
  context.fillStyle = "rgba(255, 184, 192, 0.045)";

  for (let markerX = 0; markerX <= width; markerX += markerStep) {
    context.fillRect(
      markerX,
      height - markerHeight,
      markerWidth,
      markerHeight
    );
  }
}

export function AudioVisualizer({
  analyser,
  isActive,
  className,
  trackTitle,
  artistName,
  isCurrentTrack = false,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const trackContext =
    trackTitle && artistName
      ? `${artistName} / ${trackTitle}`
      : trackTitle ?? artistName ?? "Frequency response";
  const statusLabel = isActive
    ? "Live audio visualizer"
    : isCurrentTrack
      ? "Paused on this track"
      : "Ready when playback starts";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = getCanvasContext(canvas);
    if (!context) return;

    const pixelRatioRef = { current: syncCanvasSize(canvas) };
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            pixelRatioRef.current = syncCanvasSize(canvas);
          })
        : null;

    resizeObserver?.observe(canvas);
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!analyser || !isActive) {
      return () => {
        resizeObserver?.disconnect();
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
      };
    }

    analyser.smoothingTimeConstant = 0.78;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      animationFrameIdRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const pixelRatio = pixelRatioRef.current;
      const segmentVisibleHeight = SEGMENT_VISIBLE_HEIGHT * pixelRatio;
      const segmentGapHeight = SEGMENT_GAP_HEIGHT * pixelRatio;
      const totalSegmentStep = segmentVisibleHeight + segmentGapHeight;
      const barWidth = (canvas.width / bufferLength) * BAR_WIDTH_RATIO;
      let x = 0;

      drawVisualizerBase(context, canvas.width, canvas.height, pixelRatio);

      for (let index = 0; index < bufferLength; index += 1) {
        const barHeight = getPumpedBarHeight(
          dataArray[index],
          index,
          bufferLength,
          canvas.height
        );
        context.fillStyle = getRoseSpectrumColor(
          dataArray[index],
          index,
          bufferLength
        );

        const barPixelTop = canvas.height - barHeight;

        for (
          let yCurrentSegmentBottom = canvas.height;
          yCurrentSegmentBottom > barPixelTop;
          yCurrentSegmentBottom -= totalSegmentStep
        ) {
          const yCurrentSegmentTopPotential =
            yCurrentSegmentBottom - segmentVisibleHeight;
          const drawableSegmentTop = Math.max(
            yCurrentSegmentTopPotential,
            barPixelTop
          );
          const drawableSegmentHeight =
            yCurrentSegmentBottom - drawableSegmentTop;

          if (drawableSegmentHeight > 0) {
            context.fillRect(
              x,
              drawableSegmentTop,
              barWidth,
              drawableSegmentHeight
            );
          }
        }

        x += barWidth + BAR_GAP * pixelRatio;
      }
    };

    draw();

    return () => {
      resizeObserver?.disconnect();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [analyser, isActive]);

  return (
    <section
      className={clsx(
        "relative overflow-hidden rounded-lg border border-[#ff98a2]/20 bg-[#080407] p-4 shadow-[0_22px_70px_rgba(255,152,162,0.09)]",
        className
      )}
      aria-labelledby="track-visualizer-title"
    >
      <div
        className="pointer-events-none absolute inset-0 border-t border-[#ffb8c0]/10"
        aria-hidden="true"
      />
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-[#ffb8c0]">
            Rose spectrum
          </p>
          <h2
            id="track-visualizer-title"
            className="text-xl font-black text-white"
          >
            Audio visualizer
          </h2>
          <p className="mt-1 max-w-sm truncate text-xs font-semibold text-white/48">
            {trackContext}
          </p>
        </div>
        <p
          className="rounded-full border border-[#ff98a2]/18 bg-[#ff98a2]/8 px-3 py-1 text-xs font-bold text-white/68"
          aria-live="polite"
        >
          {statusLabel}
        </p>
      </div>

      <canvas
        ref={canvasRef}
        className="block h-64 w-full rounded-md border border-white/[0.06] bg-[#030206] md:h-72"
        data-testid="audio-visualizer-canvas"
        data-visualizer-renderer="legacy-segmented-bars"
        data-visualizer-theme="edmm-rose"
        aria-hidden="true"
      />
    </section>
  );
}

export default AudioVisualizer;
