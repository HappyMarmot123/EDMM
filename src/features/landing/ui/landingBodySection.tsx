import MusicList from "@/features/landing/components/musicList";
import RecentList from "@/features/landing/components/recentList";
import Parallax from "@/features/landing/components/parallax";

export default function BodySection() {
  return (
    <>
      <section className="flex flex-col gap-16 !py-16">
        <MusicList />
        <RecentList />
        {/* <SpotifyList /> */}
      </section>
    </>
  );
}
