"use client";

import { SearchView } from "@/views/search";
import AudioPlayerShell from "@/widgets/audioPlayer/audioPlayerShell";

const Page = () => {
  return (
    <AudioPlayerShell>{(onPlay) => <SearchView onPlay={onPlay} />}</AudioPlayerShell>
  );
};

export default Page;
