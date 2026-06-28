import { type RefObject, useEffect, useRef } from "react";

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
  smoothingTimeConstant?: number;
  renderFrame: (params: VisualizerRenderFrameParams) => void;
  renderIdle?: (params: VisualizerRenderIdleParams) => void;
};

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
  smoothingTimeConstant = 0.72,
  renderFrame,
  renderIdle,
}: UseCanvasAudioVisualizerOptions): RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);

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
      renderIdle?.({
        context,
        canvas,
        pixelRatio: pixelRatioRef.current,
      });

      return () => {
        resizeObserver?.disconnect();
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
      resizeObserver?.disconnect();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [analyser, isActive, renderFrame, renderIdle, smoothingTimeConstant]);

  return canvasRef;
}
