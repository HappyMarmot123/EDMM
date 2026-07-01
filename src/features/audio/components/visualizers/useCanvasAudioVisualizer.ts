import { type RefObject, useEffect, useRef, useState } from "react";

export type VisualizerRenderFrameParams = {
  context: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  pixelRatio: number;
  dataArray: Uint8Array;
};

export type VisualizerRenderIdleParams = {
  context: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  pixelRatio: number;
};

type UseCanvasAudioVisualizerOptions = {
  analyser: AnalyserNode | null;
  isActive: boolean;
  inactiveDecayMs?: number;
  smoothingTimeConstant?: number;
  renderFrame: (params: VisualizerRenderFrameParams) => void;
  renderIdle?: (params: VisualizerRenderIdleParams) => void;
};

const DEFAULT_INACTIVE_DECAY_MS = 280;

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

export function useCanvasAudioVisualizer({
  analyser,
  isActive,
  inactiveDecayMs = DEFAULT_INACTIVE_DECAY_MS,
  smoothingTimeConstant = 0.72,
  renderFrame,
  renderIdle,
}: UseCanvasAudioVisualizerOptions): RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const [shouldRenderLive, setShouldRenderLive] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      setShouldRenderLive(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShouldRenderLive(false);
    }, Math.max(0, inactiveDecayMs));

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [inactiveDecayMs, isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = getCanvasContext(canvas);
    if (!context) return;

    const pixelRatioRef = { current: syncCanvasSize(canvas) };
    const syncSize = () => {
      pixelRatioRef.current = syncCanvasSize(canvas);
    };
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(syncSize)
        : null;

    if (resizeObserver) {
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener("resize", syncSize);
    }

    const cleanupResize = () => {
      resizeObserver?.disconnect();
      if (!resizeObserver) {
        window.removeEventListener("resize", syncSize);
      }
    };

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!analyser || !shouldRenderLive) {
      renderIdle?.({
        context,
        canvas,
        pixelRatio: pixelRatioRef.current,
      });

      return () => {
        cleanupResize();
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
      };
    }

    analyser.smoothingTimeConstant = smoothingTimeConstant;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      animationFrameIdRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      renderFrame({
        context,
        canvas,
        pixelRatio: pixelRatioRef.current,
        dataArray,
      });
    };

    draw();

    return () => {
      cleanupResize();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [analyser, shouldRenderLive, renderFrame, renderIdle, smoothingTimeConstant]);

  return canvasRef;
}
