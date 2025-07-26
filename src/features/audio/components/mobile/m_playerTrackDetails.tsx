"use client";

import React from "react";
import { PlayerTrackDetailsProps } from "@/shared/types/dataType";
import { formatTime } from "@/shared/lib/util";

const MPlayerTrackDetails: React.FC<
  Omit<PlayerTrackDetailsProps, "isMobile">
> = ({ currentTime, duration, currentTrackInfo }) => {
  return (
    <div className="flex-1 flex flex-col justify-center min-w-0 mx-3">
      <div className="flex items-baseline">
        <span className="text-sm font-bold text-slate-800 truncate">
          {currentTrackInfo?.name}
        </span>
      </div>
      <div className="flex text-xs text-slate-400 mt-0.5">
        <span>{formatTime(currentTime)}</span>
        <span className="mx-1">/</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default MPlayerTrackDetails;
