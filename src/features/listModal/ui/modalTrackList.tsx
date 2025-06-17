import { Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { useListModal } from "@/features/listModal/hook/useListModal";
import TabButtonFactory from "@/features/listModal/components/tabButtonFactory";
import ModalMusicList from "@/features/listModal/components/modalMusicList";
import { useToggle } from "@/app/providers/toggleProvider";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import { useCallback } from "react";

export default function ModalTrackList() {
  const {
    user,
    searchTerm,
    setSearchTerm,
    listTitleText,
    activeButton,
    setActiveButton,
    isLoading,
    trackList,
    favoriteAssetIds,
    toggleFavorite,
    handleSelectTrack,
  } = useListModal();

  const { closeToggle } = useToggle();

  const handleLoadMore = useCallback(() => {
    // TODO: 데이터 로딩 로직 구현
    console.log("Load more tracks...");
  }, []);

  const { targetRef } = useInfiniteScroll({
    onIntersect: handleLoadMore,
    enabled: !isLoading,
    rootMargin: "100px",
  });

  return (
    // [auto_1fr]: 첫번쨰 요소 auto, 남온 공간 차지
    <div className="p-4 sm:p-8 grid grid-rows-[auto_1fr] md:grid-rows-5 md:overflow-hidden md:col-span-2">
      <section
        aria-label="재생 목록 컨트롤"
        className="mb-3 border-b border-white/10 md:row-span-1"
      >
        <div className="flex items-center justify-between">
          <div className="relative flex-grow mr-2">
            <input
              type="text"
              placeholder="Search for Songs or Artists"
              className="w-full px-4 py-2 pr-10 bg-white/10 border border-white/20 rounded-full focus:outline-none focus:border-white/40 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search size={18} />
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
            onClick={closeToggle}
            className="p-2 rounded-full hover:bg-white/20 transition"
            aria-label="닫기"
          >
            <X size={24} />
          </motion.button>
        </div>
        <div className="flex items-center justify-between mt-6 mb-2">
          <h2 className="text-2xl font-bold">{listTitleText}</h2>
          <div className="flex flex-row space-x-4">
            <TabButtonFactory
              type="heart"
              props={{ user, activeButton, setActiveButton }}
            />
            <TabButtonFactory
              type="available"
              props={{ user, activeButton, setActiveButton }}
            />
          </div>
        </div>
      </section>

      <section
        aria-label="음악 리스트"
        className="md:overflow-auto md:custom-scrollbar h-full row-span-4 space-y-3"
      >
        <ModalMusicList
          isLoading={isLoading}
          trackList={trackList}
          favoriteAssetIds={favoriteAssetIds}
          toggleFavorite={toggleFavorite}
          handleSelectTrack={handleSelectTrack}
        />
        <div ref={targetRef} className="h-4 w-full" />
      </section>
    </div>
  );
}
