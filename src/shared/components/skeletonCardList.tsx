import React from "react";
import SkeletonCard from "./skeletonCard";
import { useViewport } from "@/shared/hooks/useViewport";

const SkeletonCardList = () => {
  const { isMobile } = useViewport();

  const skeletonCount = isMobile ? 1 : 3;
  const skeletonCards = Array.from({ length: skeletonCount }, (_, index) => (
    <SkeletonCard key={index} />
  ));

  return (
    <div className="flex gap-4 overflow-x-auto p-8 pr-4 md:pr-8">
      {skeletonCards}
    </div>
  );
};

export default SkeletonCardList;
