"use client";

import { type CSSProperties, useEffect, useRef } from "react";

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

const BAR_WIDTH_RATIO = 2.5; // 막대 너비 비율: FFT 구간 하나당 칸의 실제 막대 폭 배율
const BAR_GAP = 3; // 막대 간 간격(px): 막대 결합도를 조절해 촘촘함/분산감 균형
const SEGMENT_VISIBLE_HEIGHT = 6; // 세그먼트별 실제 표시 높이(px): 격자형 라인 느낌 강도
const SEGMENT_GAP_HEIGHT = 1; // 세그먼트 사이 간격(px): 줄무늬를 구분하는 음영 간격
const BAR_HEIGHT_SAFE_RATIO = 1.7; // 비주얼라이저 막대기 최대 높이(캔버스 높이 비율 기준)
const SPECTRUM_GAMMA = 1.38; // 오디오 에너지-펌핑 매핑 곡선: 값 크기 반응의 완급 조절
const LOW_SIDE_ATTENUATION = 0.35; // 저역(좌측) 초반 과도한 펌핑을 줄이는 감쇠 비율
const HIGH_FREQUENCY_BOOST = 0.55; // 고역(우측) 상대 펌핑 보강값
const VISUALIZER_DRIVE = 1.22; // 전체 바 증폭량 배율: 글로벌 펌핑 강도
const VISUALIZER_BASE_RATIO = 0.01; // 무음/저신호일 때도 보이는 최소 높이 비율
const PEAK_COMPENSATION_POWER = 0.55; // 프레임 피크 기반 자동 게인 보정 민감도

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
  canvasHeight: number,
  frameGain: number
) {
  const normalizedIndex =
    bufferLength > 1 ? index / Math.max(1, bufferLength - 1) : 0;
  const rawValue = Math.max(0, Math.min(255, value)) / 255;
  const bassNormalized = Math.pow(normalizedIndex, 1.95);
  const bandBalance = LOW_SIDE_ATTENUATION + (1 - LOW_SIDE_ATTENUATION) * bassNormalized;
  const bowCurve = 0.94 + 0.12 * Math.sin(Math.PI * normalizedIndex);
  const bandWeight =
    bandBalance * bowCurve + HIGH_FREQUENCY_BOOST * normalizedIndex;
  const normalizedValue = VISUALIZER_BASE_RATIO
    + (1 - VISUALIZER_BASE_RATIO) * Math.pow(rawValue, SPECTRUM_GAMMA);
  const maxBarHeight = Math.max(1, canvasHeight * BAR_HEIGHT_SAFE_RATIO);
  const normalizedGain = Math.min(1.35, Math.max(0.72, frameGain));
  const rawHeight = normalizedValue * maxBarHeight * bandWeight * VISUALIZER_DRIVE * normalizedGain;

  return Math.min(maxBarHeight, Math.max(0, Math.round(rawHeight)));
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
  trackTitle,
  artistName,
  isCurrentTrack = false,
  showHeader = true,
  blendMode = "normal",
  activeOpacity = 1,
  pausedOpacity = 0.5,
  inactiveOpacity = 0.2,
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
  const visualizerOpacity = isActive
    ? activeOpacity
    : isCurrentTrack
      ? pausedOpacity
      : inactiveOpacity;

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

    analyser.smoothingTimeConstant = 0.72;
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

      let framePeak = 1;
      for (let index = 0; index < bufferLength; index += 1) {
        framePeak = Math.max(framePeak, dataArray[index]);
      }

      const frameGain = 0.72 + 0.28 * (1 - Math.pow(framePeak / 255, PEAK_COMPENSATION_POWER));

      for (let index = 0; index < bufferLength; index += 1) {
        const barHeight = getPumpedBarHeight(
          dataArray[index],
          index,
          bufferLength,
          canvas.height,
          frameGain
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

  const visualizerTitle = showHeader ? "track-visualizer-title" : undefined;

  return (
    <section
      className="pointer-events-none absolute inset-x-0 bottom-0 p-4 h-1/2 bg-transparent"
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


