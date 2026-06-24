"use client";

import dynamic from "next/dynamic";
import type { EarthProps } from "@/shared/types/dataType";
import { useInView } from "@/shared/hooks/useInView";

const Earth = dynamic(() => import("./earth"), {
  ssr: false,
  loading: () => null,
});

export default function EarthLazy(props: EarthProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "200px" });

  return (
    <div ref={ref} data-testid="earth-slot">
      {inView ? <Earth {...props} /> : null}
    </div>
  );
}
