"use client";

import { type CSSProperties, useCallback } from "react";
import {
  clampChannel,
  drawSegmentedBars,
} from "@/features/audio/components/visualizers/segmentedBarRenderer";
import {
  type VisualizerRenderFrameParams,
  useCanvasAudioVisualizer,
} from "@/features/audio/components/visualizers/useCanvasAudioVisualizer";

export interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  trackTitle?: string;
  artistName?: string;
  isCurrentTrack?: boolean;
  showHeader?: boolean;
  blendMode?: CSSProperties["mixBlendMode"];
  activeOpacity?: number;
  pausedOpacity?: number;
  inactiveOpacity?: number;
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

export function AudioVisualizer({
  analyser,
  isActive,
  trackTitle,
  artistName,
  isCurrentTrack = false,
  showHeader = true,
  blendMode = "normal",
  activeOpacity = 1,
  pausedOpacity = 0.5,
  inactiveOpacity = 0.2,
}: AudioVisualizerProps) {
  const trackContext =
    trackTitle && artistName
      ? `${artistName} / ${trackTitle}`
      : trackTitle ?? artistName ?? "Frequency response";
  const statusLabel = isActive
    ? "Live audio visualizer"
    : isCurrentTrack
      ? "Paused on this track"
      : "Ready when playback starts";
  const visualizerOpacity = isActive
    ? activeOpacity
    : isCurrentTrack
      ? pausedOpacity
      : inactiveOpacity;
  const renderFrame = useCallback(
    (params: VisualizerRenderFrameParams) =>
      drawSegmentedBars(params, { getColor: getRoseSpectrumColor }),
    [],
  );
  const canvasRef = useCanvasAudioVisualizer({
    analyser,
    isActive,
    renderFrame,
  });

  const visualizerTitle = showHeader ? "track-visualizer-title" : undefined;

  return (
    <section
      className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-transparent p-4 transition-opacity duration-200 ease-out"
      aria-label="Audio visualizer"
      aria-labelledby={visualizerTitle}
      style={{ opacity: visualizerOpacity, mixBlendMode: blendMode }}
    >
      {showHeader ? (
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-[#ffb8c0]">
              Rose spectrum 
            </p>
            <h2
              id={visualizerTitle}
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
      ) : null}

      <canvas
        ref={canvasRef}
        className="h-full w-full bg-transparent"
        data-testid="audio-visualizer-canvas"
        data-visualizer-renderer="legacy-segmented-bars"
        data-visualizer-theme="edmm-rose"
        aria-hidden="true"
      />
    </section>
  );
}

export default AudioVisualizer;


