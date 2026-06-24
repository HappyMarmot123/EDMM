"use client";

import Cursor from "@/shared/components/cursor";
import { useScroll } from "framer-motion";
import { useRef } from "react";
import { useInView } from "@/shared/hooks/useInView";
import dynamic from "next/dynamic";

const DustySnow = dynamic(() => import("@/features/landing/components/dustySnow"), {
  ssr: false,
});
const Intro = dynamic(() => import("@/features/landing/components/intro"), {
  ssr: false,
});

interface LandingWrapperProps {
  children: React.ReactNode;
}

export default function LandingWrapper({ children }: LandingWrapperProps) {
  const ref = useRef(null);
  const { ref: snowRef, inView: showSnow } = useInView<HTMLDivElement>({
    rootMargin: "300px",
  });
  useScroll();
  useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });

  // TODO: 프로그래스 바 삭제하지 말 것
  // const scaleX = useSpring(scrollYProgress, {
  //   stiffness: 100,
  //   damping: 30,
  //   restDelta: 0.001,
  // });

  return (
    <>
      <div ref={ref} className="h-full relative">
        <div ref={snowRef} className="absolute inset-0 pointer-events-none" />
        {showSnow ? <DustySnow /> : null}
        <Cursor />
        <Intro />
        <article className="my-gradient fixed w-screen pointer-events-none" />
        <main>{children}</main>
      </div>
    </>
  );
}
