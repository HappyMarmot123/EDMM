"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";

export interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  className?: string;
}

const BASE_CANVAS_HEIGHT = 224;
const BAR_WIDTH_RATIO = 2.5;
const BAR_GAP = 3;
const SEGMENT_VISIBLE_HEIGHT = 6;
const SEGMENT_GAP_HEIGHT = 1;
const LOW_FREQUENCY_PUMPING = 0.6;

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

export function AudioVisualizer({
  analyser,
  isActive,
  className,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = getCanvasContext(canvas);
    if (!context) return;

    let pixelRatio = syncCanvasSize(canvas);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            pixelRatio = syncCanvasSize(canvas);
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
    const segmentVisibleHeight = SEGMENT_VISIBLE_HEIGHT * pixelRatio;
    const segmentGapHeight = SEGMENT_GAP_HEIGHT * pixelRatio;
    const totalSegmentStep = segmentVisibleHeight + segmentGapHeight;

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      animationFrameIdRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const barWidth = (canvas.width / bufferLength) * BAR_WIDTH_RATIO;
      let x = 0;

      for (let index = 0; index < bufferLength; index += 1) {
        const barHeight = getPumpedBarHeight(
          dataArray[index],
          index,
          bufferLength,
          canvas.height
        );
        const red = barHeight + 25 * (index / bufferLength);
        const green = 200 * (index / bufferLength) + 50;
        const blue = 100 + barHeight / 3;

        context.fillStyle = `rgb(${Math.min(255, red)},${Math.min(
          255,
          green
        )},${Math.min(255, blue)})`;

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
        "relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] p-4",
        className
      )}
      aria-labelledby="track-visualizer-title"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase text-[#ffb8c0]">
            Visualizer
          </p>
          <h2 id="track-visualizer-title" className="text-xl font-black text-white">
            Audio visualizer
          </h2>
        </div>
        <p
          className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-white/62"
          aria-live="polite"
        >
          {isActive ? "Live audio visualizer" : "Ready when playback starts"}
        </p>
      </div>

      <canvas
        ref={canvasRef}
        className="block h-56 w-full rounded-md bg-black/28"
        data-testid="audio-visualizer-canvas"
        data-visualizer-renderer="legacy-segmented-bars"
        aria-hidden="true"
      />
    </section>
  );
}

export default AudioVisualizer;
