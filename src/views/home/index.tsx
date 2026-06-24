"use client";

import type { Track } from "@/entities/track/model";
import { useTrending } from "@/features/discover/hooks/useTrending";
import { TrackList } from "@/widgets/trackList";

export interface HomeViewProps {
  onPlay?: (t: Track) => void;
}

const noop = () => {};

export function HomeView({ onPlay = noop }: HomeViewProps) {
  const { data, isLoading } = useTrending();

  return (
    <main className="bg-black min-h-screen px-4 py-8 text-white">
      <section className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">Trending Tracks</h1>
        <TrackList tracks={data ?? []} onPlay={onPlay} isLoading={isLoading} />
      </section>
    </main>
  );
}

export default HomeView;
