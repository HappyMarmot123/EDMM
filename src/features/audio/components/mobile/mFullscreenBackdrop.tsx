/* eslint-disable @next/next/no-img-element -- Fullscreen artwork receives dynamic CDN hosts. */
import type { AlbumColorPalette } from "@/features/audio/components/visualizers/albumColorPalette";

type MFullscreenBackdropProps = {
  artworkSrc: string;
  hasArtwork: boolean;
  palette: AlbumColorPalette;
};

/**
 * 모바일 전용 경량 백드롭 — 데스크톱(FullscreenBackdrop)의 대형 blur 2장 대신
 * 단일 blur 레이어 + 팔레트 그라데이션으로 저사양 GPU 부담을 낮춘다.
 */
export default function MFullscreenBackdrop({
  artworkSrc,
  hasArtwork,
  palette,
}: MFullscreenBackdropProps) {
  return (
    <>
      {hasArtwork ? (
        <img
          src={artworkSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-[-12%] h-[124%] w-[124%] object-cover opacity-40 blur-[48px] saturate-[1.3]"
          draggable={false}
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[36%] h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]"
          style={{ background: `rgba(${palette.primary}, 0.22)` }}
        />
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, rgba(${palette.accent}, 0.14), rgba(${palette.primary}, 0.10) 30%, rgba(5, 3, 5, 0.92) 72%, rgba(0, 0, 0, 0.98) 100%)`,
        }}
      />
    </>
  );
}
