"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import { useSpring } from "framer-motion";
import { EarthProps } from "@/shared/types/dataType"; // EarthProps를 가져옵니다.

type UseEarthProps = Omit<EarthProps, "className">;

export default function useEarth({
  width = 400,
  height = 400,
  baseColor = [1, 0.6, 0.64],
  markerColor = [1, 0.55, 0.6],
  glowColor = [1, 0.65, 0.68],
}: UseEarthProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const rotation = useSpring(0, {
    damping: 50,
    stiffness: 400,
  });

  useEffect(() => {
    let phi = 0;
    let globe: ReturnType<typeof createGlobe> | undefined;

    if (canvasRef.current) {
      globe = createGlobe(canvasRef.current, {
        devicePixelRatio: 2,
        width: width,
        height: height,
        phi: 2.5,
        theta: 0.3,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: baseColor,
        markerColor: markerColor,
        glowColor: glowColor,
        markers: [],
        scale: 2.0,
        offset: [250, -250],
        onRender: (state) => {
          phi += 0.005;
          state.phi = phi + rotation.get();
          state.width = width;
          state.height = height;
        },
      });
    }

    return () => {
      if (globe) {
        globe.destroy();
      }
    };
  }, [width, height, rotation, baseColor, markerColor, glowColor]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grabbing";
    }
  };

  const handlePointerUp = () => {
    pointerInteracting.current = null;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grab";
    }
  };

  const handlePointerOut = () => {
    pointerInteracting.current = null;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grab";
    }
  };

  const handleMouseMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerInteracting.current !== null) {
      const delta = e.clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      rotation.set(delta / 100);
    }
  };

  const rootStyle = {
    width: `${width}px`,
    height: `${height}px`,
    position: "relative",
    cursor: "grab",
  };

  const canvasStyle = {
    width: "100%",
    height: "100%",
    contain: "layout paint size",
    display: "block",
    touchAction: "none",
  };

  return {
    canvasRef,
    handlePointerDown,
    handlePointerUp,
    handlePointerOut,
    handleMouseMove,
    rootStyle,
    canvasStyle,
  };
}
