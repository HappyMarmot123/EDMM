import SearchPageClient from "./searchPageClient";
import {
  parseMusicView,
  pickFirstValue,
} from "@/widgets/musicShell/musicView";

type SearchParams = {
  view?: string | string[];
  track?: string | string[];
};

interface PageProps {
  searchParams?: Promise<SearchParams>;
}

const parseTrackId = (
  value: string | string[] | undefined,
): string | undefined => {
  const trackId = pickFirstValue(value)?.trim();
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
