"use client";

import { useRef } from "react";
import { Clock3, Library, Search, Sparkles, X } from "lucide-react";

export type MusicView = "pop" | "edm" | "recent";

type MusicShellHeaderProps = {
  query: string;
  view: MusicView;
  catalogCounts: Record<"pop" | "edm", number>;
  showCatalogCounts?: boolean;
  onQueryChange: (query: string) => void;
  onViewChange: (view: MusicView) => void;
};

const VIEW_OPTIONS: Array<{
  value: MusicView;
  label: string;
  Icon: typeof Library;
}> = [
  { value: "pop", label: "Pop", Icon: Sparkles },
  { value: "edm", label: "EDM", Icon: Library },
  { value: "recent", label: "Recent", Icon: Clock3 },
];

export function MusicShellHeader({
  query,
  view,
  catalogCounts,
  showCatalogCounts = true,
  onQueryChange,
  onViewChange,
}: MusicShellHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasQuery = query.length > 0;

  const handleClearSearch = () => {
    onQueryChange("");
    inputRef.current?.focus();
  };

  return (
    <header className="space-y-5">
      <div className="flex min-w-0 items-end justify-between gap-12">
        <div className="min-w-0 shrink-0">
          <p className="hidden text-xs font-black uppercase tracking-normal text-[#ff98a2] md:block">
            Lucas archive
          </p>
          <h1 className="truncate text-3xl font-black tracking-normal text-white md:mt-2 sm:text-4xl">
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
            ref={inputRef}
            type="search"
            role="searchbox"
            aria-label="Search catalog"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search tracks, artists"
            className="min-h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/38 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {hasQuery ? (
            <button
              type="button"
              aria-label="Clear search"
              title="Clear search"
              onMouseDown={(event) => event.preventDefault()}
              onClick={handleClearSearch}
              className="-mr-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.075] text-white/68 transition-colors hover:border-[#ff98a2]/45 hover:bg-[#ff98a2]/16 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb8c0]"
            >
              <X size={17} strokeWidth={2.4} aria-hidden="true" />
            </button>
          ) : null}
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
              {showCatalogCounts && value !== "recent" ? (
                <span
                  aria-hidden="true"
                  className={[
                    "rounded-full px-2 py-0.5 text-xs",
                    isActive
                      ? "bg-black/18 text-black"
                      : "bg-white/10 text-white/58",
                  ].join(" ")}
                >
                  {catalogCounts[value]}
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
