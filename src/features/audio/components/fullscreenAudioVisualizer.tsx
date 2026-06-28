"use client";

import { type CSSProperties, useCallback } from "react";
import type { AlbumColorPalette } from "@/features/audio/components/visualizers/albumColorPalette";
import { drawSegmentedBars } from "@/features/audio/components/visualizers/segmentedBarRenderer";
import {
  type VisualizerRenderFrameParams,
  type VisualizerRenderIdleParams,
  useCanvasAudioVisualizer,
} from "@/features/audio/components/visualizers/useCanvasAudioVisualizer";

type FullscreenAudioVisualizerProps = {
  analyser: AnalyserNode | null;
  isActive: boolean;
  isCurrentTrack?: boolean;
  palette: AlbumColorPalette;
};

function getFrequencyValue(dataArray: Uint8Array, index: number, total: number) {
  if (dataArray.length === 0) return 0;

  const sourceIndex = Math.min(
    dataArray.length - 1,
    Math.floor((index / Math.max(1, total - 1)) * (dataArray.length - 1)),
  );

  return dataArray[sourceIndex] ?? 0;
}

function getAlbumSpectrumColor(
  palette: AlbumColorPalette,
  value: number,
  index: number,
  bufferLength: number,
) {
  const position = bufferLength > 1 ? index / (bufferLength - 1) : 0;
  const energy = Math.min(1, value / 255);
  const color = position < 0.48
    ? palette.secondary
    : position < 0.78
      ? palette.primary
      : palette.accent;
  const alpha = 0.58 + energy * 0.36;

  return `rgba(${color}, ${alpha.toFixed(2)})`;
}

export default function FullscreenAudioVisualizer({
  analyser,
  isActive,
  isCurrentTrack = false,
  palette,
}: FullscreenAudioVisualizerProps) {
  const renderFrame = useCallback(
    (params: VisualizerRenderFrameParams) =>
      drawSegmentedBars(params, {
          getColor: (value, index, bufferLength) =>
            getAlbumSpectrumColor(palette, value, index, bufferLength),
        baseColor: `rgba(${palette.primary}, 0.10)`,
        markerColor: `rgba(${palette.secondary}, 0.07)`,
        maxHeightRatio: 1.6,
        drive: 1.18,
      }),
    [palette.accent, palette.primary, palette.secondary],
  );
  const renderIdle = useCallback(
    ({ context, canvas, pixelRatio }: VisualizerRenderIdleParams) => {
      const idleData = new Uint8Array(96);
      idleData.fill(18);
      drawSegmentedBars(
        {
          context,
          canvas,
          pixelRatio,
          dataArray: idleData,
        },
        {
          getColor: (_value, index, bufferLength) =>
            getAlbumSpectrumColor(
              palette,
              getFrequencyValue(idleData, index, bufferLength),
              index,
              bufferLength,
            ),
          baseColor: `rgba(${palette.primary}, 0.08)`,
          markerColor: `rgba(${palette.secondary}, 0.05)`,
          maxHeightRatio: 1.2,
          drive: 0.82,
        },
      );
    },
    [palette.accent, palette.primary, palette.secondary],
  );
  const canvasRef = useCanvasAudioVisualizer({
    analyser,
    isActive,
    renderFrame,
    renderIdle,
  });
  const visualizerOpacity = isActive ? 0.44 : isCurrentTrack ? 0.2 : 0.1;
  const style = {
    opacity: visualizerOpacity,
    mixBlendMode: "screen",
  } satisfies CSSProperties;

  return (
    <section
      className="pointer-events-none absolute inset-0 bg-transparent"
      aria-hidden="true"
      style={style}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full bg-transparent"
        data-testid="fullscreen-audio-visualizer-canvas"
        data-visualizer-renderer="fullscreen-segmented-bars"
        data-visualizer-theme="album-palette"
        aria-hidden="true"
      />
    </section>
  );
}
