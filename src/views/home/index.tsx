"use client";

import type { Track } from "@/entities/track";
import { useCloudinaryTracks } from "@/features/cloudinary/hooks/useCloudinaryTracks";
import { TrackList } from "@/widgets/trackList";

export interface HomeViewProps {
  onPlay?: (t: Track) => void;
}

const noop = () => {};

export function HomeView({ onPlay = noop }: HomeViewProps) {
  const { data, isLoading } = useCloudinaryTracks("", { resourceType: "all" });

  return (
    <main className="bg-black min-h-screen px-4 py-8 text-white">
      <section className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">Cloudinary Catalog</h1>
        <TrackList tracks={data ?? []} onPlay={onPlay} isLoading={isLoading} />
      </section>
    </main>
  );
}

export default HomeView;
