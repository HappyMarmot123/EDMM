import type { VisualizerRenderFrameParams } from "@/features/audio/components/visualizers/useCanvasAudioVisualizer";

type SegmentedBarColorResolver = (
  value: number,
  index: number,
  bufferLength: number,
) => string;

type SegmentedBarRenderOptions = {
  getColor: SegmentedBarColorResolver;
  baseColor?: string;
  markerColor?: string;
  maxHeightRatio?: number;
  drive?: number;
  lowFrequencyBoost?: number;
};

const BAR_WIDTH_RATIO = 2.5;
const BAR_GAP = 3;
const SEGMENT_VISIBLE_HEIGHT = 6;
const SEGMENT_GAP_HEIGHT = 1;
const DEFAULT_BAR_HEIGHT_SAFE_RATIO = 1.7;
const SPECTRUM_GAMMA = 1.38;
const LOW_SIDE_ATTENUATION = 0.35;
const HIGH_FREQUENCY_BOOST = 0.55;
const DEFAULT_VISUALIZER_DRIVE = 1.22;
const VISUALIZER_BASE_RATIO = 0.01;
const PEAK_COMPENSATION_POWER = 0.55;
const LOW_FREQUENCY_BOOST_BAND = 0.24;

export function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function getPumpedBarHeight(
  value: number,
  index: number,
  bufferLength: number,
  canvasHeight: number,
  frameGain: number,
  maxHeightRatio: number,
  drive: number,
  lowFrequencyBoost: number,
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
  const maxBarHeight = Math.max(1, canvasHeight * maxHeightRatio);
  const normalizedGain = Math.min(1.35, Math.max(0.72, frameGain));
  const lowBandMultiplier =
    normalizedIndex <= LOW_FREQUENCY_BOOST_BAND
      ? 1 + lowFrequencyBoost * (1 - normalizedIndex / LOW_FREQUENCY_BOOST_BAND)
      : 1;
  const rawHeight =
    normalizedValue *
    maxBarHeight *
    bandWeight *
    lowBandMultiplier *
    drive *
    normalizedGain;

  return Math.min(maxBarHeight, Math.max(0, Math.round(rawHeight)));
}

function drawVisualizerBase(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  pixelRatio: number,
  baseColor: string,
  markerColor: string,
) {
  const baselineHeight = Math.max(1, pixelRatio);
  const markerWidth = Math.max(1, pixelRatio);
  const markerHeight = Math.max(12 * pixelRatio, height * 0.07);
  const markerStep = Math.max(34 * pixelRatio, width / 10);

  context.fillStyle = baseColor;
  context.fillRect(0, height - baselineHeight, width, baselineHeight);
  context.fillStyle = markerColor;

  for (let markerX = 0; markerX <= width; markerX += markerStep) {
    context.fillRect(
      markerX,
      height - markerHeight,
      markerWidth,
      markerHeight,
    );
  }
}

export function drawSegmentedBars(
  {
    context,
    canvas,
    pixelRatio,
    dataArray,
  }: VisualizerRenderFrameParams,
  {
    getColor,
    baseColor = "rgba(255, 152, 162, 0.08)",
    markerColor = "rgba(255, 184, 192, 0.045)",
    maxHeightRatio = DEFAULT_BAR_HEIGHT_SAFE_RATIO,
    drive = DEFAULT_VISUALIZER_DRIVE,
    lowFrequencyBoost = 0,
  }: SegmentedBarRenderOptions,
) {
  const bufferLength = dataArray.length;
  const segmentVisibleHeight = SEGMENT_VISIBLE_HEIGHT * pixelRatio;
  const segmentGapHeight = SEGMENT_GAP_HEIGHT * pixelRatio;
  const totalSegmentStep = segmentVisibleHeight + segmentGapHeight;
  const barWidth = (canvas.width / bufferLength) * BAR_WIDTH_RATIO;
  let x = 0;

  drawVisualizerBase(
    context,
    canvas.width,
    canvas.height,
    pixelRatio,
    baseColor,
    markerColor,
  );

  let framePeak = 1;
  for (let index = 0; index < bufferLength; index += 1) {
    framePeak = Math.max(framePeak, dataArray[index]);
  }

  const frameGain =
    0.72 + 0.28 * (1 - Math.pow(framePeak / 255, PEAK_COMPENSATION_POWER));

  for (let index = 0; index < bufferLength; index += 1) {
    const safeLowFrequencyBoost = Math.max(0, Math.min(1, lowFrequencyBoost));
    const barHeight = getPumpedBarHeight(
      dataArray[index],
      index,
      bufferLength,
      canvas.height,
      frameGain,
      maxHeightRatio,
      drive,
      safeLowFrequencyBoost,
    );
    context.fillStyle = getColor(dataArray[index], index, bufferLength);

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
        barPixelTop,
      );
      const drawableSegmentHeight =
        yCurrentSegmentBottom - drawableSegmentTop;

      if (drawableSegmentHeight > 0) {
        context.fillRect(
          x,
          drawableSegmentTop,
          barWidth,
          drawableSegmentHeight,
        );
      }
    }

    x += barWidth + BAR_GAP * pixelRatio;
  }
}
