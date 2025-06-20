"use client";

import React, { ReactNode } from "react";
import { Lenis, ReactLenis } from "lenis/react";
import type { LenisRef } from "lenis/react";
import { cancelFrame, frame } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useToggle } from "@/shared/providers/toggleProvider";
import { isEmpty } from "lodash";

interface LenisProviderProps {
  children: ReactNode;
}

/*
    lenis.stop() start() 작동하지 않음. 심지어 모션도 안됨. Trash Doc
    분기처리로 ReactLenis 반환 여부 해결
 */

const LenisProvider: React.FC<LenisProviderProps> = ({ children }) => {
  const lenisRef = useRef<LenisRef>(null);
  const { isOpen } = useToggle();
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(false);
    } else {
      setShouldRender(true);
    }
    return () => {
      lenisRef.current?.lenis?.destroy();
    };
  }, [isOpen]);

  if (!shouldRender) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        duration: 1,
        smoothWheel: true,
        lerp: 0.1,
      }}
    >
      {children}
    </ReactLenis>
  );
};

export default LenisProvider;
