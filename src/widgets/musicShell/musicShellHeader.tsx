"use client";

import { Clock3, Heart, Library, Search } from "lucide-react";

export type MusicView = "all" | "favorites" | "recent";

type MusicShellHeaderProps = {
  query: string;
  view: MusicView;
  resultCount: number;
  favoriteCount: number;
  recentCount: number;
  onQueryChange: (query: string) => void;
  onViewChange: (view: MusicView) => void;
};

const VIEW_OPTIONS: Array<{
  value: MusicView;
  label: string;
  Icon: typeof Library;
}> = [
  { value: "all", label: "All", Icon: Library },
  { value: "favorites", label: "Favorites", Icon: Heart },
  { value: "recent", label: "Recent", Icon: Clock3 },
];

export function MusicShellHeader({
  query,
  view,
  resultCount,
  favoriteCount,
  recentCount,
  onQueryChange,
  onViewChange,
}: MusicShellHeaderProps) {
  const counts: Record<MusicView, number> = {
    all: resultCount,
    favorites: favoriteCount,
    recent: recentCount,
  };

  return (
    <header className="space-y-5">
      <div className="flex min-w-0 items-end justify-between gap-12">
        <div className="min-w-0 shrink-0">
          <p className="text-xs font-black uppercase tracking-normal text-[#ff98a2]">
            Lucas archive
          </p>
          <h1 className="mt-2 truncate text-3xl font-black tracking-normal text-white sm:text-4xl">
            EDMM
          </h1>
        </div>

        <form
          role="search"
          className="max-w-md min-h-12 flex min-w-0 flex-1 items-center gap-3 rounded-md border border-white/12 bg-white/[0.065] px-3 shadow-[0_0_32px_rgba(255,105,135,0.10)] focus-within:border-[#ff98a2]/70"
          onSubmit={(event) => event.preventDefault()}
        >
          <Search
            aria-hidden="true"
            className="shrink-0 text-[#ff98a2]"
            size={20}
            strokeWidth={2.2}
          />
          <input
            type="search"
            role="searchbox"
            aria-label="Search catalog"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search tracks, artists, albums"
            className="min-h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/38"
          />
        </form>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Music views">
        {VIEW_OPTIONS.map(({ value, label, Icon }) => {
          const isActive = view === value;

          return (
            <button
              key={value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onViewChange(value)}
              className={[
                "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb8c0]",
                isActive
                  ? "border-[#ff98a2] bg-[#ff98a2] text-black"
                  : "border-white/10 bg-white/[0.045] text-white/72 hover:border-[#ff98a2]/45 hover:text-white",
              ].join(" ")}
            >
              <Icon size={17} strokeWidth={2.2} aria-hidden="true" />
              <span>{label}</span>
              {value === "all" ? (
                <span
                  aria-hidden="true"
                  className={[
                    "rounded-full px-2 py-0.5 text-xs",
                    isActive ? "bg-black/18 text-black" : "bg-white/10 text-white/58",
                  ].join(" ")}
                >
                  {counts[value]}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

export default MusicShellHeader;
