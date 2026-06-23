import MusicList from "@/features/landing/components/musicList";
import RecentList from "@/features/landing/components/recentList";
import Parallax from "@/features/landing/components/parallax";

export default function BodySection() {
  return (
    <>
      <section className="relative md:min-h-[50vh] h-fit flex flex-col justify-center px-4 pb-12 md:py-24 overflow-hidden">
        <Parallax baseVelocity={-2}>Electronic</Parallax>
        <div className="md:py-4"></div>
        <Parallax baseVelocity={2}>Dance Music</Parallax>
      </section>
      <section className="flex flex-col gap-16 !py-16">
        <MusicList />
        <RecentList />
        {/* <SpotifyList /> */}
      </section>
    </>
  );
}
