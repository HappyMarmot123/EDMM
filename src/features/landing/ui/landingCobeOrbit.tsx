"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import type { COBEOptions, Globe } from "cobe";

const INITIAL_PHI = 0.55;
const INITIAL_THETA = 0.28;
const AUTO_ROTATION_SPEED = 0.006;
const DRAG_ROTATION_SCALE = 0.0065;
const DRAG_TILT_SCALE = 0.0035;
const ROTATION_EASE = 0.1;
const MIN_THETA = -0.42;
const MAX_THETA = 0.58;

const ROSE_MARKERS = [
  { location: [37.5665, 126.978], size: 0.055 },
  { location: [35.6762, 139.6503], size: 0.045 },
  { location: [51.5072, -0.1276], size: 0.04 },
  { location: [40.7128, -74.006], size: 0.05 },
  { location: [-33.8688, 151.2093], size: 0.035 },
] satisfies COBEOptions["markers"];

const ROSE_ARCS = [
  { from: [37.5665, 126.978], to: [35.6762, 139.6503] },
  { from: [35.6762, 139.6503], to: [40.7128, -74.006] },
  { from: [40.7128, -74.006], to: [51.5072, -0.1276] },
  { from: [51.5072, -0.1276], to: [-33.8688, 151.2093] },
] satisfies COBEOptions["arcs"];

const getCanvasSize = (canvas: HTMLCanvasElement, pixelRatio: number) => {
  const rect = canvas.getBoundingClientRect();
  const displaySize = Math.max(320, Math.round(rect.width || canvas.clientWidth || 520));

  canvas.width = Math.round(displaySize * pixelRatio);
  canvas.height = Math.round(displaySize * pixelRatio);

  return displaySize;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function LandingCobeOrbit() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    let phi = INITIAL_PHI;
    let targetPhiOffset = 0;
    let currentPhiOffset = 0;
    let targetTheta = INITIAL_THETA;
    let currentTheta = INITIAL_THETA;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartPhiOffset = 0;
    let dragStartTheta = INITIAL_THETA;
    let globe: Globe | undefined;
    let frameId = 0;

    const initialSize = getCanvasSize(canvas, pixelRatio);
    const options: COBEOptions = {
      devicePixelRatio: pixelRatio,
      width: initialSize,
      height: initialSize,
      phi,
      theta: INITIAL_THETA,
      dark: 1,
      diffuse: 1.32,
      scale: 1.02,
      mapSamples: reducedMotion ? 9000 : 15000,
      mapBrightness: 5.6,
      mapBaseBrightness: 0.04,
      baseColor: [0.58, 0.34, 0.4],
      markerColor: [1, 0.6, 0.68],
      glowColor: [1, 0.5, 0.62],
      opacity: 0.94,
      offset: [0, 0],
      markers: ROSE_MARKERS,
      arcs: ROSE_ARCS,
      arcColor: [1, 0.44, 0.58],
      arcWidth: 0.45,
      arcHeight: 0.28,
      markerElevation: 0.035,
    };

    try {
      globe = createGlobe(canvas, options);
    } catch {
      return undefined;
    }

    const animate = () => {
      currentPhiOffset += (targetPhiOffset - currentPhiOffset) * ROTATION_EASE;
      currentTheta += (targetTheta - currentTheta) * ROTATION_EASE;

      globe?.update({
        phi: phi + currentPhiOffset,
        theta: currentTheta,
      });

      if (!reducedMotion) {
        phi += AUTO_ROTATION_SPEED;
      }

      frameId = window.requestAnimationFrame(animate);
    };

    const resize = () => {
      const size = getCanvasSize(canvas, pixelRatio);
      globe?.update({ width: size, height: size });
    };

    const setDragging = (dragging: boolean) => {
      canvas.dataset.dragging = String(dragging);
    };

    const capturePointer = (event: PointerEvent) => {
      try {
        canvas.setPointerCapture?.(event.pointerId);
      } catch {
        // Pointer capture is best-effort; rotation still works without it.
      }
    };

    const releasePointer = (event: PointerEvent) => {
      try {
        canvas.releasePointerCapture?.(event.pointerId);
      } catch {
        // The pointer may already be released by the browser.
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button > 0) {
        return;
      }

      isDragging = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragStartPhiOffset = targetPhiOffset;
      dragStartTheta = targetTheta;
      setDragging(true);
      capturePointer(event);
      event.preventDefault();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging) {
        return;
      }

      const deltaX = event.clientX - dragStartX;
      const deltaY = event.clientY - dragStartY;

      targetPhiOffset = dragStartPhiOffset + deltaX * DRAG_ROTATION_SCALE;
      targetTheta = clamp(
        dragStartTheta + deltaY * DRAG_TILT_SCALE,
        MIN_THETA,
        MAX_THETA
      );
      event.preventDefault();
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (!isDragging) {
        return;
      }

      isDragging = false;
      setDragging(false);
      releasePointer(event);
    };

    const observer =
      typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(resize);

    setDragging(false);
    frameId = window.requestAnimationFrame(animate);
    observer?.observe(canvas);
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerEnd);
    canvas.addEventListener("pointercancel", handlePointerEnd);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerEnd);
      canvas.removeEventListener("pointercancel", handlePointerEnd);
      window.removeEventListener("resize", resize);
      globe?.destroy();
    };
  }, []);

  return (
    <div className="rose-cobe-orbit" aria-hidden="true" data-testid="rose-cobe-orbit">
      <span className="rose-cobe-orbit__halo" />
      <canvas
        ref={canvasRef}
        className="rose-cobe-orbit__canvas"
        data-testid="rose-cobe-canvas"
        width={1040}
        height={1040}
      />
      <span className="rose-cobe-orbit__label">ROSE ORBIT</span>
    </div>
  );
}
