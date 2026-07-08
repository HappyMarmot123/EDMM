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
  maxPixelRatio?: number;
  smoothingTimeConstant?: number;
  renderFrame: (params: VisualizerRenderFrameParams) => void;
  renderIdle?: (params: VisualizerRenderIdleParams) => void;
};

const DEFAULT_INACTIVE_DECAY_MS = 280;
const DEFAULT_MAX_PIXEL_RATIO = 2;
const LIVE_FRAME_BUDGET_MS = 32;

function getCanvasContext(canvas: HTMLCanvasElement) {
  try {
    return canvas.getContext("2d");
  } catch {
    return null;
  }
}

function getIsDocumentVisible() {
  if (typeof document === "undefined") {
    return true;
  }

  return document.visibilityState !== "hidden";
}

function syncCanvasSize(canvas: HTMLCanvasElement, maxPixelRatio: number) {
  const safeMaxPixelRatio = Number.isFinite(maxPixelRatio)
    ? Math.max(1, maxPixelRatio)
    : DEFAULT_MAX_PIXEL_RATIO;
  const pixelRatio = Math.min(
    Math.max(1, window.devicePixelRatio || 1),
    safeMaxPixelRatio,
  );
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
  maxPixelRatio = DEFAULT_MAX_PIXEL_RATIO,
  smoothingTimeConstant = 0.72,
  renderFrame,
  renderIdle,
}: UseCanvasAudioVisualizerOptions): RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const [shouldRenderLive, setShouldRenderLive] = useState(isActive);
  const [isDocumentVisible, setIsDocumentVisible] =
    useState(getIsDocumentVisible);

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
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      setIsDocumentVisible(getIsDocumentVisible());
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = getCanvasContext(canvas);
    if (!context) return;

    const pixelRatioRef = { current: syncCanvasSize(canvas, maxPixelRatio) };
    const syncSize = () => {
      pixelRatioRef.current = syncCanvasSize(canvas, maxPixelRatio);
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

    if (!analyser || !shouldRenderLive || !isDocumentVisible) {
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

    const renderCurrentFrame = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      analyser.getByteFrequencyData(dataArray);
      renderFrame({
        context,
        canvas,
        pixelRatio: pixelRatioRef.current,
        dataArray,
      });
    };

    let lastLiveFrameAt = 0;
    const draw = (timestamp: number) => {
      if (timestamp - lastLiveFrameAt >= LIVE_FRAME_BUDGET_MS) {
        renderCurrentFrame();
        lastLiveFrameAt = timestamp;
      }

      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    renderCurrentFrame();
    animationFrameIdRef.current = requestAnimationFrame(draw);

    return () => {
      cleanupResize();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [
    analyser,
    isDocumentVisible,
    maxPixelRatio,
    renderFrame,
    renderIdle,
    shouldRenderLive,
    smoothingTimeConstant,
  ]);

  return canvasRef;
}
