import { useState, useEffect } from "react";
import { ViewportSize } from "@/shared/types/dataType";

/*
  TODO:
  isMobile으로 tailwind 기준 md 사이즈 미만이면 boolean true 값을 반환합니다.
  SSR일 경우 우선순위로 인해 비즈니스 로직이 비예측 상태가 될 수 있으므로
  isClient 상태를 함께 반환해 주고 있는 커스텀 훅입니다.
*/

export const useViewport = () => {
  const [viewport, setViewport] = useState<ViewportSize>({
    width: 1024,
    height: 768,
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setViewport({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const actualWidth = isClient ? viewport.width : 1024;

  const isMobile = actualWidth < 768;
  const isTablet = actualWidth >= 768 && actualWidth < 1024;
  const isDesktop = actualWidth >= 1024;

  return {
    viewport,
    isMobile,
    isTablet,
    isDesktop,
    isClient,
  };
};
