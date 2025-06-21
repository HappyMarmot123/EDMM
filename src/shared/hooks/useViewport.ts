import { useState, useEffect } from "react";
import { ViewportSize } from "@/shared/types/dataType";

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
