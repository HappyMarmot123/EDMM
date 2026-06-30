import { useEffect, useRef, useCallback } from "react";
import { UseInfiniteScrollProps } from "@/shared/types/dataType";

export const useInfiniteScroll = ({
  onIntersect,
  enabled = true,
  rootMargin = "0px",
  threshold = 0,
}: UseInfiniteScrollProps) => {
  const targetRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && enabled) {
        onIntersect();
      }
    },
    [enabled, onIntersect]
  );

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") return;

    let observer: IntersectionObserver;

    try {
      observer = new IntersectionObserver(handleObserver, {
        rootMargin,
        threshold,
      });
    } catch {
      return;
    }

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [handleObserver, rootMargin, threshold]);

  return { targetRef };
};
