"use client";

import Cursor from "@/shared/components/cursor";
import DustySnow from "@/features/landing/components/dustySnow";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

interface LandingWrapperProps {
  children: React.ReactNode;
}

export default function LandingWrapper({ children }: LandingWrapperProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll();
  const { scrollYProgress: scrollYProgress2 } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const customColor = useTransform(
    scrollYProgress,
    [0, 1],
    ["#ff98a2", "#00f"]
  );

  return (
    <>
      <div ref={ref} className="h-full relative">
        <motion.div className="progress-bar" style={{ scaleX: scaleX }} />
        <figure className="progress">
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="30" pathLength="1" className="bg" />
            <motion.circle
              cx="50"
              cy="50"
              r="30"
              pathLength="1"
              className="indicator"
              style={{
                pathLength: scrollYProgress2,
                transition: "pathLength 0.3s ease",
                stroke: customColor,
              }}
            />
          </svg>
        </figure>
        <DustySnow />
        <Cursor />
        {/* <Intro /> */}
        <article className="my-gradient fixed w-screen pointer-events-none" />
        {children}
      </div>
    </>
  );
}
