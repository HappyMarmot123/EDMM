export default function ModalTrackListSkeleton() {
  return (
    <div className="p-4 sm:p-8 grid grid-rows-[auto_1fr] md:grid-rows-5 md:overflow-hidden md:col-span-2">
      <section
        aria-label="재생 목록 컨트롤"
        className="mb-3 border-b border-white/10 md:row-span-1"
      >
        <div className="flex items-center justify-between">
          <div className="relative flex-grow mr-2">
            <div className="w-full h-10 bg-white/10 animate-pulse rounded-full"></div>
          </div>
          <div className="w-10 h-10 bg-white/10 animate-pulse rounded-full"></div>
        </div>
        <div className="flex items-center justify-between mt-6 mb-2">
          <div className="h-8 bg-white/10 animate-pulse rounded w-48"></div>
          <div className="flex flex-row space-x-4">
            <div className="w-10 h-10 bg-white/10 animate-pulse rounded-full"></div>
            <div className="w-10 h-10 bg-white/10 animate-pulse rounded-full"></div>
          </div>
        </div>
      </section>

      <section
        aria-label="음악 리스트"
        className="md:overflow-auto md:custom-scrollbar h-full row-span-4 space-y-3"
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center p-3 rounded-lg bg-white/5"
          >
            <div className="w-12 h-12 bg-white/10 animate-pulse rounded-md mr-4"></div>

            <div className="flex-1">
              <div className="h-5 bg-white/10 animate-pulse rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-white/10 animate-pulse rounded w-1/2"></div>
            </div>

            <div className="relative flex items-center space-x-2">
              <div className="w-6 h-6 bg-white/10 animate-pulse rounded-full"></div>
              <div className="h-4 bg-white/10 animate-pulse rounded w-8"></div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
