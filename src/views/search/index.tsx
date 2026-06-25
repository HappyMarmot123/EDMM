"use client";

import Link from "next/link";
import {
  Disc3,
  ExternalLink,
  Mic2,
  Music2,
  PlayCircle,
  Radio,
  Search as SearchIcon,
  Sparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { Track } from "@/entities/track/model";
import { useTrackSearch } from "@/features/search/hooks/useTrackSearch";

export interface SearchViewProps {
  onPlay?: (track: Track, queue?: Track[]) => void;
}

type BrowseCard = {
  title: string;
  query: string;
  note: string;
  Icon: LucideIcon;
  accentClassName: string;
};

const noop: NonNullable<SearchViewProps["onPlay"]> = () => {};

const QUICK_SEARCHES = [
  "melodic techno",
  "lo fi house",
  "future bass",
  "deep groove",
  "night drive",
];

const BROWSE_CARDS: BrowseCard[] = [
  {
    title: "Rose Room",
    query: "melodic techno",
    note: "Polished late-night electronic cuts",
    Icon: Disc3,
    accentClassName: "border-[#ff98a2]/45 bg-[#ff98a2]/12 text-[#ffb8c0]",
  },
  {
    title: "Floor Signal",
    query: "deep house",
    note: "Steady grooves for long sessions",
    Icon: Radio,
    accentClassName: "border-[#ffd6a5]/40 bg-[#ffd6a5]/12 text-[#ffd6a5]",
  },
  {
    title: "Vocal Drift",
    query: "electronic vocal",
    note: "Hooks, air, and clean synth movement",
    Icon: Mic2,
    accentClassName: "border-[#c8f7ff]/35 bg-[#c8f7ff]/10 text-[#c8f7ff]",
  },
  {
    title: "Bass Afterglow",
    query: "future bass",
    note: "Bright drops without losing the mood",
    Icon: Music2,
    accentClassName: "border-[#d7c7ff]/35 bg-[#d7c7ff]/10 text-[#d7c7ff]",
  },
];

const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
};

const SOURCE_LABEL = "Audius";

function SearchSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-3 text-sm text-white/70"
    >
      <span>Searching Audius...</span>
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-[72px] animate-pulse rounded-lg border border-white/10 bg-white/[0.04]"
        />
      ))}
    </div>
  );
}

function SearchResults({
  tracks,
  query,
  onPlay,
}: {
  tracks: Track[];
  query: string;
  onPlay: NonNullable<SearchViewProps["onPlay"]>;
}) {
  return (
    <section aria-labelledby="search-results-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-[#ffb8c0]">
            Results for
          </p>
          <h2 id="search-results-title" className="text-2xl font-black text-white">
            {query}
          </h2>
        </div>
        <p className="text-sm text-white/56">{tracks.length} tracks</p>
      </div>

      <ul className="space-y-2">
        {tracks.map((track, index) => (
          <li
            key={track.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.045] p-2 transition-colors hover:border-[#ff98a2]/40 hover:bg-[#ff98a2]/10"
          >
            <button
              type="button"
              onClick={() => onPlay(track, tracks)}
              className="grid min-w-0 grid-cols-[32px_52px_minmax(0,1fr)] items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-white/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb8c0]"
              aria-label={`Play ${track.title}`}
            >
              <span className="text-sm font-bold text-white/45">
                {index + 1}
              </span>
              <span
                aria-hidden="true"
                className="grid aspect-square place-items-center overflow-hidden rounded-md border border-white/10 bg-[#16080f] bg-cover bg-center text-[#ffb8c0]"
                style={
                  track.artworkUrl
                    ? { backgroundImage: `url(${track.artworkUrl})` }
                    : undefined
                }
              >
                {track.artworkUrl ? (
                  <span className="h-full w-full bg-black/10" />
                ) : (
                  <Disc3 size={22} strokeWidth={1.8} />
                )}
              </span>
              <span className="min-w-0">
                <span
                  className="block truncate font-semibold text-white"
                  data-testid={`search-result-title-${track.id}`}
                >
                  {track.title}
                </span>
                <span className="block truncate text-sm text-white/58">
                  {track.artistName}
                  {track.albumName ? ` / ${track.albumName}` : ""} /{" "}
                  {SOURCE_LABEL}
                </span>
              </span>
            </button>

            <div className="flex items-center gap-2 pr-1">
              <span className="hidden min-w-10 text-right text-sm font-semibold text-white/45 sm:inline">
                {formatDuration(track.durationMs)}
              </span>
              <button
                type="button"
                onClick={() => onPlay(track, tracks)}
                className="grid h-10 w-10 place-items-center rounded-full bg-[#ff98a2] text-black transition-transform hover:scale-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb8c0]"
                aria-label={`Play ${track.title}`}
              >
                <PlayCircle size={20} strokeWidth={2.2} />
              </button>
              <Link
                href={`/track/${encodeURIComponent(track.id)}`}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/68 transition-colors hover:border-white/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb8c0]"
                aria-label={`View details for ${track.title}`}
              >
                <ExternalLink size={17} strokeWidth={2} />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SearchView({ onPlay = noop }: SearchViewProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isError, refetch } = useTrackSearch(debouncedQuery);
  const tracks = useMemo(() => data ?? [], [data]);
  const hasSearch = debouncedQuery.length > 0;

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const runSearch = (value: string) => {
    const nextQuery = value.trim();
    setQuery(nextQuery);
    setDebouncedQuery(nextQuery);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch(query);
  };

  const handleClear = () => {
    runSearch("");
  };

  return (
    <main className="min-h-screen bg-[#050306] px-4 pb-28 pt-6 text-white sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase text-[#ffb8c0]">
                <Sparkles size={16} strokeWidth={2.1} />
                Rose search
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-normal text-white sm:text-5xl">
                Search
              </h1>
            </div>
            <p className="max-w-sm text-sm leading-6 text-white/60">
              Find tracks fast, start a queue, then keep the session moving.
            </p>
          </div>

          <form
            role="search"
            onSubmit={handleSearchSubmit}
            className="flex min-h-14 items-center gap-3 rounded-lg border border-white/12 bg-white/[0.07] px-4 shadow-[0_0_42px_rgba(255,152,162,0.10)] focus-within:border-[#ff98a2]/70"
          >
            <SearchIcon
              aria-hidden="true"
              className="shrink-0 text-[#ffb8c0]"
              size={22}
              strokeWidth={2.2}
            />
            <input
              type="search"
              role="searchbox"
              value={query}
              onChange={handleQueryChange}
              aria-label="Search tracks, artists, or moods"
              placeholder="What do you want to hear?"
              className="min-h-12 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/38"
            />
            {query ? (
              <button
                type="button"
                onClick={handleClear}
                className="grid h-10 w-10 place-items-center rounded-full text-white/62 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb8c0]"
                aria-label="Clear search"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            ) : null}
          </form>

          <div className="flex flex-wrap gap-2" aria-label="Quick searches">
            {QUICK_SEARCHES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => runSearch(item)}
                className="min-h-10 rounded-full border border-white/10 bg-white/[0.045] px-4 text-sm font-bold text-white/78 transition-colors hover:border-[#ff98a2]/50 hover:bg-[#ff98a2]/12 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb8c0]"
              >
                {item}
              </button>
            ))}
          </div>
        </header>

        {!hasSearch ? (
          <section aria-labelledby="browse-title" className="space-y-4">
            <div>
              <p className="text-xs font-black uppercase text-[#ffb8c0]">
                Start from a room
              </p>
              <h2 id="browse-title" className="mt-1 text-2xl font-black text-white">
                Browse by vibe
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {BROWSE_CARDS.map(({ title, query: cardQuery, note, Icon, accentClassName }) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => runSearch(cardQuery)}
                  className={`min-h-40 rounded-lg border p-5 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb8c0] ${accentClassName}`}
                >
                  <Icon size={28} strokeWidth={1.9} />
                  <span className="mt-7 block text-xl font-black text-white">
                    {title}
                  </span>
                  <span className="mt-2 block text-sm leading-5 text-white/62">
                    {note}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {hasSearch ? (
          <section className="rounded-lg border border-white/10 bg-black/24 p-4 sm:p-5">
            {isLoading ? <SearchSkeleton /> : null}

            {!isLoading && isError ? (
              <div className="space-y-3 rounded-lg border border-[#ff98a2]/30 bg-[#ff98a2]/10 p-5">
                <h2 className="text-xl font-black text-white">Search failed</h2>
                <p className="text-sm leading-6 text-white/64">
                  The music source did not respond. Try the same search again.
                </p>
                <button
                  type="button"
                  onClick={() => void refetch?.()}
                  className="min-h-10 rounded-md bg-[#ff98a2] px-4 text-sm font-black text-black transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb8c0]"
                >
                  Retry search
                </button>
              </div>
            ) : null}

            {!isLoading && !isError && tracks.length > 0 ? (
              <SearchResults
                tracks={tracks}
                query={debouncedQuery}
                onPlay={onPlay}
              />
            ) : null}

            {!isLoading && !isError && tracks.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-xl font-black text-white">
                  No tracks found for "{debouncedQuery}"
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Try a genre, artist, mood, or one of the quick searches above.
                </p>
              </div>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}

export default SearchView;
