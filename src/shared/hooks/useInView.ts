"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export function useInView<T extends Element>(
  options?: IntersectionObserverInit
): { ref: RefObject<T | null>; inView: boolean } {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    let observer: IntersectionObserver;

    try {
      observer = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      }, options);
    } catch {
      setInView(true);
      return;
    }

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return { ref, inView };
}
