"use client";

import React from "react";
import { PlayerTrackDetailsProps } from "@/shared/types/dataType";
import { formatTime } from "@/shared/lib/util";

const MPlayerTrackDetails: React.FC<
  Omit<PlayerTrackDetailsProps, "isMobile">
> = ({ currentTime, duration, currentTrackInfo }) => {
  return (
    <div className="mx-3 flex min-w-0 flex-1 flex-col justify-center">
      <div className="flex items-baseline">
        <span className="truncate text-sm font-semibold text-white">
          {currentTrackInfo?.name ?? "No track selected"}
        </span>
      </div>
      <div className="mt-0.5 flex text-xs tabular-nums text-white/50">
        <span>{formatTime(currentTime)}</span>
        <span className="mx-1">/</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default MPlayerTrackDetails;
