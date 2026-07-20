import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Keyboard } from "lucide-react";
import FullscreenArtworkStage from "@/features/audio/components/fullscreenArtworkStage";
import FullscreenAudioVisualizer from "@/features/audio/components/fullscreenAudioVisualizer";
import FullscreenBackdrop from "@/features/audio/components/fullscreenBackdrop";
import { useAlbumColorPalette } from "@/features/audio/components/visualizers/albumColorPalette";
import { useArtworkCrossfade } from "@/features/audio/hooks/useArtworkCrossfade";
import FullscreenLyricsExperience from "@/features/lyrics/components/fullscreenLyricsExperience";
import type { Track } from "@/entities/track";
import MyTooltip from "@/shared/components/myTooltip";

export type DesktopFullscreenPlayerProps = {
  currentTrackInfo: Track | null;
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  currentTime: number;
  lyricsEligible: boolean;
  onClose: () => void;
};

// 아트워크는 겹침 없이 스냅 아웃 후 빠르게 페이드 인, backdrop(저주파 그라데이션)은
// 느린 크로스페이드 유지 — 이미지 두 장이 블렌딩되며 생기는 시각 피로를 제거한다.
const ARTWORK_FADE_MS = 280;
const BACKDROP_FADE_MS = 450;
const SHORTCUT_KEY_CLASS_NAME =
  "rounded border border-white/12 bg-black/34 px-2 py-0.5 text-white";

export default function DesktopFullscreenPlayer({
  currentTrackInfo,
  analyser,
  isPlaying,
  currentTime,
  lyricsEligible,
  onClose,
}: DesktopFullscreenPlayerProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const [showShortcutHint, setShowShortcutHint] = useState(false);
  const artworkSrc = currentTrackInfo?.artworkUrl?.trim() ?? "";
  const trackTitle = currentTrackInfo?.title ?? "No track selected";
  const { palette, resolvedSrc } = useAlbumColorPalette(artworkSrc);
  const { layers, topPalette, completeLayer } = useArtworkCrossfade({
    artworkSrc,
    palette,
    resolvedSrc,
    fadeDurationMs: BACKDROP_FADE_MS,
  });
  const topArtworkLayer = layers.length ? layers[layers.length - 1] : null;
  const shouldShowLyrics =
    lyricsEligible &&
    currentTrackInfo?.albumName?.trim().toLowerCase() === "pop";

  const albumPaletteStyle = {
    "--album-primary-rgb": topPalette.primary,
    "--album-secondary-rgb": topPalette.secondary,
    "--album-accent-rgb": topPalette.accent,
  } as CSSProperties;

  const focusDialog = useCallback(() => {
    dialogRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    // 힌트가 열려 있을 때 다이얼로그로 포커스를 가져가면 Radix 툴팁이
    // 트리거 blur로 즉시 닫혀 버린다 — 닫힘 상태에서만 재포커스한다.
    if (!showShortcutHint) {
      focusDialog();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        focusDialog();
        return;
      }

      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      if (showShortcutHint) {
        setShowShortcutHint(false);
        focusDialog();
        return;
      }

      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusDialog, onClose, showShortcutHint]);

  const fadeStyle = (opacity: number, durationMs: number): CSSProperties => ({
    opacity,
    transition: `opacity ${durationMs}ms ease-out`,
  });

  return (
    <section
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen player"
      tabIndex={-1}
      className="fixed inset-0 z-[60] min-h-screen min-h-dvh overflow-hidden bg-[#050306] text-white"
      style={albumPaletteStyle}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-[#050306]" />

      {layers.map((layer) => (
        <div
          key={layer.key}
          aria-hidden="true"
          className="absolute inset-0"
          style={fadeStyle(layer.opacity, BACKDROP_FADE_MS)}
          onTransitionEnd={(event) => {
            // 전환 완료 판정은 가장 느린 backdrop 기준 — 아트워크(280ms)에 걸면
            // backdrop 크로스페이드가 중도 절단된다.
            if (
              event.propertyName === "opacity" &&
              event.target === event.currentTarget
            ) {
              completeLayer(layer.key);
            }
          }}
        >
          <FullscreenBackdrop
            artworkSrc={layer.artworkSrc}
            hasArtwork={layer.hasArtwork}
            palette={layer.palette}
          />
        </div>
      ))}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.20),rgba(0,0,0,0.50)_54%,rgba(0,0,0,0.82))]"
      />

      <div
        aria-hidden="true"
        aria-label="liquid-glass-panel"
        className="liquid-glass-panel absolute inset-x-10 top-8 h-[calc(100%-150px)] overflow-hidden rounded-[42px] border border-white/[0.055] bg-white/[0.018] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_60px_160px_rgba(0,0,0,0.24)]"
      >
        <div className="absolute inset-x-[-2.5rem] bottom-0 top-[10%] overflow-hidden">
          <FullscreenAudioVisualizer
            analyser={analyser}
            isActive={isPlaying}
            isCurrentTrack={Boolean(currentTrackInfo)}
            palette={topPalette}
          />
        </div>
      </div>

      <MyTooltip
        open={showShortcutHint}
        onOpenChange={setShowShortcutHint}
        side="bottom"
        align="end"
        sideOffset={8}
        tooltipText={
          <>
          <p className="text-xs font-black uppercase text-[#ff98a2]">
            Keyboard controls
          </p>
          <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs font-bold text-white/82">
            <kbd className={SHORTCUT_KEY_CLASS_NAME}>
              Space
            </kbd>
            <span>Play / pause</span>
            <kbd className={SHORTCUT_KEY_CLASS_NAME}>
              Left / Right
            </kbd>
            <span>Seek 10 seconds</span>
            <kbd className={SHORTCUT_KEY_CLASS_NAME}>
              Up / Down
            </kbd>
            <span>Volume</span>
            <kbd className={SHORTCUT_KEY_CLASS_NAME}>
              P
            </kbd>
            <span>Previous track</span>
            <kbd className={SHORTCUT_KEY_CLASS_NAME}>
              N
            </kbd>
            <span>Next track</span>
            <kbd className={SHORTCUT_KEY_CLASS_NAME}>
              Esc
            </kbd>
            <span>Close shortcuts / exit fullscreen</span>
          </div>
          <p className="mt-2 text-xs font-semibold text-white/62">
            Tab is locked while fullscreen is open.
          </p>
          </>
        }
      >
        <button
          type="button"
          aria-label="Show fullscreen shortcuts"
          className="absolute right-8 top-8 z-[2] grid h-9 w-9 place-items-center rounded-full border border-[#ff98a2]/45 bg-black/38 text-white/78 backdrop-blur-md transition-colors hover:border-[#ff98a2]/75 hover:bg-white/12 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Keyboard size={18} strokeWidth={2.25} aria-hidden="true" />
        </button>
      </MyTooltip>

      <div className="relative z-[1] flex min-h-screen min-h-dvh flex-col items-center justify-center px-12 pb-[calc(130px+max(env(safe-area-inset-bottom),12px))] pt-20">
        <div
          data-testid="desktop-fullscreen-content"
          className={
            shouldShowLyrics
              ? "grid w-full max-w-[1180px] grid-cols-[minmax(0,0.9fr)_minmax(18rem,1.1fr)] items-center gap-[clamp(2rem,5vw,5rem)]"
              : "grid w-full max-w-[560px] justify-items-center"
          }
        >
          <div
            className={
              shouldShowLyrics
                ? "relative justify-self-center origin-center scale-[0.74] lg:scale-[0.8] xl:scale-100"
                : "relative"
            }
          >
            {/* 스냅 아웃: top 레이어만 렌더한다. key가 바뀌면 이전 아트워크는
                즉시 unmount되고, 새 레이어는 훅의 활성화 타이머로 페이드 인한다. */}
            {topArtworkLayer ? (
              <div
                key={topArtworkLayer.key}
                className="relative z-[1]"
                style={fadeStyle(topArtworkLayer.opacity, ARTWORK_FADE_MS)}
              >
                <FullscreenArtworkStage
                  artworkSrc={topArtworkLayer.artworkSrc}
                  trackTitle={trackTitle}
                  hasArtwork={topArtworkLayer.hasArtwork}
                  isPlaying={isPlaying}
                  palette={topArtworkLayer.palette}
                />
              </div>
            ) : null}
          </div>
          {shouldShowLyrics && currentTrackInfo ? (
            <FullscreenLyricsExperience
              track={currentTrackInfo}
              currentTimeSeconds={currentTime}
              className="justify-self-end"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
