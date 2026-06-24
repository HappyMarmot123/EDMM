import { notFound } from "next/navigation";
import { decodeTrackId } from "./trackId";
import TrackDetailPageClient from "./trackDetailPageClient";

interface TrackPageProps {
  params: Promise<{
    id: string;
  }>;
}

const Page = async ({ params }: TrackPageProps) => {
  const { id } = await params;
  const trackId = decodeTrackId(id);
  if (!trackId) {
    notFound();
  }

  return <TrackDetailPageClient trackId={trackId} />;
};

export default Page;
