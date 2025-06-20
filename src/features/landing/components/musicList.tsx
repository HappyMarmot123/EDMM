"use client";

import React, { useEffect } from "react";
import HorizontalSwiper from "@/shared/components/horizontalSwiper";
import SkeletonCardList from "@/shared/components/skeletonCardList";
import useStore from "@/app/store/cloudinaryStore";

export default function MusicList() {
  const data = useStore((state) => state.cloudinaryData);
  const error = useStore((state) => state.cloudinaryError);
  const loading = useStore((state) => state.isLoadingCloudinary);

  useEffect(() => {
    if (error) {
      console.error("Error fetching popular tracks:", error);
    }
  }, [error]);

  return (
    <>
      <section aria-label="Available Now" className="w-full select-none z-10">
        <h2 className="text-3xl md:text-4xl font-bold grid grid-cols-10">
          <span className="col-start-2 w-max">Available Now</span>
        </h2>
        {loading && <SkeletonCardList />}
        {data && (
          <HorizontalSwiper
            data={Array.from(data.values())}
            swiperId="music-list-swiper"
          />
        )}
      </section>
    </>
  );
}
