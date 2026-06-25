"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";

export interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  className?: string;
}

const IDLE_BAR_HEIGHTS = [36, 54, 42, 68, 50, 82, 58, 74, 46, 62, 40, 56];

function getCanvasContext(canvas: HTMLCanvasElement) {
  try {
    return canvas.getContext("2d");
  } catch {
    return null;
  }
}

export function AudioVisualizer({
  analyser,
  isActive,
  className,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = getCanvasContext(canvas);
    if (!context) return;

    let frameId = 0;
    const frequencyData = analyser
      ? new Uint8Array(analyser.frequencyBinCount)
      : null;
    const startedAt = performance.now();

    const draw = () => {
      const pixelRatio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round((rect.width || 640) * pixelRatio));
      const height = Math.max(1, Math.round((rect.height || 180) * pixelRatio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(255, 255, 255, 0.08)";
      context.fillRect(0, height - 1 * pixelRatio, width, 1 * pixelRatio);

      if (frequencyData && analyser && isActive) {
        analyser.getByteFrequencyData(frequencyData);
      }

      const barCount = 48;
      const gap = 3 * pixelRatio;
      const barWidth = Math.max(2 * pixelRatio, (width - gap * (barCount - 1)) / barCount);
      const elapsed = (performance.now() - startedAt) / 1000;

      for (let index = 0; index < barCount; index += 1) {
        const frequencyIndex =
          frequencyData && frequencyData.length > 0
            ? Math.floor((index / barCount) * frequencyData.length)
            : 0;
        const liveValue =
          frequencyData && isActive ? frequencyData[frequencyIndex] / 255 : 0;
        const idleValue =
          0.28 +
          Math.sin(elapsed * 1.6 + index * 0.55) * 0.12 +
          IDLE_BAR_HEIGHTS[index % IDLE_BAR_HEIGHTS.length] / 220;
        const normalized = Math.max(0.12, Math.min(1, liveValue || idleValue));
        const barHeight = Math.max(8 * pixelRatio, normalized * height * 0.82);
        const x = index * (barWidth + gap);
        const y = height - barHeight;

        context.fillStyle =
          index % 4 === 0
            ? "rgba(255, 184, 192, 0.95)"
            : index % 4 === 1
              ? "rgba(253, 109, 148, 0.88)"
              : "rgba(255, 255, 255, 0.62)";
        context.fillRect(x, y, barWidth, barHeight);
      }

      frameId = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.cancelAnimationFrame(frameId);
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
        className="block h-44 w-full rounded-md bg-black/28"
        data-testid="audio-visualizer-canvas"
        aria-hidden="true"
      />
    </section>
  );
}

export default AudioVisualizer;
