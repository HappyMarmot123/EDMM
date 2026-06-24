 "use client";

import { useEffect, useState, type ChangeEvent } from "react";
import type { Track } from "@/entities/track/model";
import { useTrackSearch } from "@/features/search/hooks/useTrackSearch";
import { TrackList } from "@/widgets/trackList";

export interface SearchViewProps {
  onPlay?: (track: Track) => void;
}

const noop = () => {};

export function SearchView({ onPlay = noop }: SearchViewProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useTrackSearch(debouncedQuery);

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  return (
    <main className="bg-black min-h-screen px-4 py-8 text-white">
      <section className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">Search Tracks</h1>
        <input
          type="search"
          role="searchbox"
          value={query}
          onChange={handleQueryChange}
          aria-label="Query input"
          placeholder="Search tracks"
          className="w-full rounded border border-neutral-700 bg-black p-3"
        />
        <TrackList
          tracks={data ?? []}
          onPlay={onPlay}
          isLoading={isLoading && !!debouncedQuery}
        />
      </section>
    </main>
  );
}

export default SearchView;
