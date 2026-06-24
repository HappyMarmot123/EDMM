"use client";

import { LibraryView } from "@/views/library";
import AudioPlayerShell from "@/widgets/audioPlayer/audioPlayerShell";

const Page = () => {
  return (
    <AudioPlayerShell>{(onPlay) => <LibraryView onPlay={onPlay} />}</AudioPlayerShell>
  );
};

export default Page;
