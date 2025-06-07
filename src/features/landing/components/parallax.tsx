"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useVelocity,
  useAnimationFrame,
  useScroll,
  wrap,
} from "framer-motion";
import { useRef } from "react";

interface ParallaxProps {
  children: React.ReactNode;
  baseVelocity?: number;
}

export default function Parallax({
  children,
  baseVelocity = 100,
}: ParallaxProps) {
  const baseX = useMotionValue(0);
  const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`);
  const directionFactor = useRef<number>(1);
  // Scroll to Swap
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
    // Scroll to Swap
    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }
    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    // Scroll to Swap
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="parallax relative">
      <motion.div className="scroller" style={{ x }}>
        {Array.from({ length: 8 }).map((_, index) => (
          <span
            key={index}
            className="text-[white] text-[clamp(1rem,5vw,6rem)]"
          >
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
