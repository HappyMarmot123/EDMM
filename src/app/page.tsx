"use client";

import HomeView from "@/views/home";
import AudioPlayerShell from "@/widgets/audioPlayer/audioPlayerShell";
import Landing from "@/widgets/landing";

const Page: React.FC = () => {
  return (
    <AudioPlayerShell>
      {(onPlay) => (
        <>
          <Landing />
          <HomeView onPlay={onPlay} />
        </>
      )}
    </AudioPlayerShell>
  );
};

export default Page;
