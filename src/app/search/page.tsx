import SearchPageClient from "./searchPageClient";
import type { MusicView } from "@/widgets/musicShell/musicShellHeader";

type SearchParams = {
  view?: string | string[];
  track?: string | string[];
};

interface PageProps {
  searchParams?: Promise<SearchParams>;
}

const pickFirst = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const parseMusicView = (
  value: string | string[] | undefined,
): MusicView | undefined => {
  const view = pickFirst(value);
  return view === "all" || view === "favorites" || view === "recent"
    ? view
    : undefined;
};

const parseTrackId = (
  value: string | string[] | undefined,
): string | undefined => {
  const trackId = pickFirst(value)?.trim();
  return trackId?.length ? trackId : undefined;
};
export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const initialView = parseMusicView(params.view);
  const initialTrackId = parseTrackId(params.track);

  return (
    <SearchPageClient
      initialView={initialView}
      initialTrackId={initialTrackId}
    />
  );
}
