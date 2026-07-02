import React from "react";
import type { Track } from "@/entities/track";
import { formatTime } from "@/shared/lib/util";
import SeekBar from "@/features/audio/components/seekBar";

interface PlayerTrackDetailsProps {
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  currentTrackInfo?: Track | null;
}

export const PlayerTrackSummary: React.FC<{
  currentTrackInfo: Track | null;
}> = ({ currentTrackInfo }) => {
  return (
    <section className="min-w-0 overflow-hidden" aria-label="Track Information">
      <div
        id="track-name"
        className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-white"
        title={currentTrackInfo?.title}
      >
        {currentTrackInfo?.title ?? "No track selected"}
      </div>
      <div
        id="producer-name"
        className="mt-0.5 w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-white/55"
        title={currentTrackInfo?.artistName}
      >
        {currentTrackInfo?.artistName ?? "Choose a song to start playback"}
      </div>
    </section>
  );
};

const PlayerTrackDetails: React.FC<PlayerTrackDetailsProps> = ({
  currentTime,
  duration,
  seek,
  currentTrackInfo,
}) => {
  return (
    <div
      id="player-track"
      aria-label={`${currentTrackInfo?.title ?? "Current track"} progress`}
      className="w-full space-y-1.5"
    >
      <div className="flex items-center justify-between px-1 text-[11px] font-black uppercase tracking-[0.12em] text-white/46">
        <span className="min-w-[2.5rem] text-right text-white/54">
          {formatTime(currentTime)}
        </span>
        <span aria-label="Track duration">{formatTime(duration)}</span>
      </div>

      <section
        id="track-time"
        className="flex w-full items-center gap-2"
        aria-label="Track progress"
      >
        <SeekBar currentTime={currentTime} duration={duration} seek={seek} />
      </section>
    </div>
  );
};

export default PlayerTrackDetails;
