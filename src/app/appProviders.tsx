"use client";

import type { PropsWithChildren } from "react";
import { Suspense } from "react";
import { AudioPlayerProvider } from "@/shared/providers/audioPlayerProvider";
import { TanstackProvider } from "@/shared/providers/tanstackProvider";
import { ToggleProvider } from "@/shared/providers/toggleProvider";
import AudioPlayerWidget from "@/widgets/audioPlayer";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <TanstackProvider>
      <AudioPlayerProvider>
        <ToggleProvider>
          {children}
          <Suspense fallback={null}>
            <AudioPlayerWidget />
          </Suspense>
        </ToggleProvider>
      </AudioPlayerProvider>
    </TanstackProvider>
  );
}
