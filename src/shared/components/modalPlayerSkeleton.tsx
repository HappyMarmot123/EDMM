export default function ModalPlayerSkeleton() {
  return (
    <div className="h-full p-4 sm:p-8 flex flex-col items-center border-r border-white/10 md:col-span-2">
      <div className="flex flex-col items-center flex-grow w-full">
        <section aria-label="현재 재생트랙" className="w-full mb-8 sm:mb-16">
          <div className="relative flex flex-col items-center justify-center pt-8 overflow-hidden">
            <div className="w-56 h-56 bg-white/10 animate-pulse rounded-xl"></div>
          </div>
        </section>

        <div className="w-full max-w-md flex flex-col gap-2">
          <div className="h-9 bg-white/10 animate-pulse rounded-md w-3/4"></div>
          <div className="h-7 bg-white/10 animate-pulse rounded-md w-1/2"></div>

          <div className="mt-4 mb-4">
            <div className="h-2 bg-white/10 animate-pulse rounded-full w-full"></div>
            <div className="flex justify-between mt-2">
              <div className="h-4 bg-white/10 animate-pulse rounded w-12"></div>
              <div className="h-4 bg-white/10 animate-pulse rounded w-12"></div>
            </div>
          </div>

          <section aria-label="재생 컨트롤">
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 bg-white/10 animate-pulse rounded-full"></div>

              <div className="flex items-center justify-center space-x-4">
                <div className="w-10 h-10 bg-white/10 animate-pulse rounded-full"></div>
                <div className="w-12 h-12 bg-white/20 animate-pulse rounded-full"></div>
                <div className="w-10 h-10 bg-white/10 animate-pulse rounded-full"></div>
              </div>

              <div className="w-10 h-10 bg-white/10 animate-pulse rounded-full"></div>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-8 w-full max-w-md">
        <div className="h-12 bg-white/10 animate-pulse rounded-lg w-full"></div>
      </div>
    </div>
  );
}
