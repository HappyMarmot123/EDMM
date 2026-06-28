import { redirect } from "next/navigation";
import { decodeTrackId } from "./trackId";

interface TrackPageProps {
  params: Promise<{
    id: string;
  }>;
}

const Page = async ({ params }: TrackPageProps) => {
  const { id } = await params;
  const trackId = decodeTrackId(id);
  if (!trackId) {
    redirect("/search");
  }

  redirect(`/search?track=${encodeURIComponent(trackId)}`);
};

export default Page;
