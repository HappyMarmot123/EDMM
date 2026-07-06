"use client";

import dynamic from "next/dynamic";
import type { PropsWithChildren } from "react";
import { Suspense, useEffect, useState } from "react";
import { AudioPlayerProvider } from "@/shared/providers/audioPlayerProvider";
import { TanstackProvider } from "@/shared/providers/tanstackProvider";
import { ToggleProvider } from "@/shared/providers/toggleProvider";

const AudioPlayerWidget = dynamic(() => import("@/widgets/audioPlayer"), {
  ssr: false,
  loading: () => null,
});
const AUDIO_PLAYER_WIDGET_IDLE_TIMEOUT_MS = 1800;

function useAudioPlayerWidgetReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isReady) {
      return undefined;
    }

    const markReady = () => setIsReady(true);

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(markReady, {
        timeout: AUDIO_PLAYER_WIDGET_IDLE_TIMEOUT_MS,
      });

      return () => window.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(
      markReady,
      AUDIO_PLAYER_WIDGET_IDLE_TIMEOUT_MS,
    );

    return () => window.clearTimeout(timeoutId);
  }, [isReady]);

  return isReady;
}

export function AppProviders({ children }: PropsWithChildren) {
  const isAudioPlayerWidgetReady = useAudioPlayerWidgetReady();

  return (
    <TanstackProvider>
      <AudioPlayerProvider>
        <ToggleProvider>
          {children}
          {isAudioPlayerWidgetReady ? (
            <Suspense fallback={null}>
              <AudioPlayerWidget />
            </Suspense>
          ) : null}
        </ToggleProvider>
      </AudioPlayerProvider>
    </TanstackProvider>
  );
}
