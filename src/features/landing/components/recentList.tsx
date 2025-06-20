"use client";

import React, { useEffect } from "react";
import HorizontalSwiper from "@/shared/components/horizontalSwiper";
import SkeletonCardList from "@/shared/components/skeletonCardList";
import useCloudinaryStore from "@/app/store/cloudinaryStore";
import useRecentPlayStore from "@/app/store/recentPlayStore";
import { CloudinaryResource } from "@/shared/types/dataType";

export default function RecentList() {
  const cloudinaryData = useCloudinaryStore((state) => state.cloudinaryData);
  const error = useCloudinaryStore((state) => state.cloudinaryError);
  const loading = useCloudinaryStore((state) => state.isLoadingCloudinary);
  const recentAssetIds = useRecentPlayStore((state) => state.recentAssetIds);

  useEffect(() => {
    if (error) {
      console.error("Error fetching Cloudinary data for recent list:", error);
    }
  }, [error]);

  const recentTracks = Array.from(recentAssetIds)
    .map((assetId) => cloudinaryData.get(assetId))
    .filter((track): track is CloudinaryResource => track !== undefined);

  return (
    <>
      <section aria-label="Recently Played" className="w-full select-none z-10">
        <h2 className="text-3xl md:text-4xl font-bold grid grid-cols-10">
          <span className="col-start-2 w-max">Recently Played</span>
        </h2>
        {loading && <SkeletonCardList />}
        {!loading && recentTracks.length > 0 && (
          <HorizontalSwiper data={recentTracks} swiperId="recent-list" />
        )}
        {!loading && recentAssetIds.size === 0 && (
          <p className="col-start-2 mt-4">최근 재생한 음악이 없습니다.</p>
        )}
      </section>
    </>
  );
}
