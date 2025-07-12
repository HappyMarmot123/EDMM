import { Suspense, lazy } from "react";
import ModalWrapper from "@/features/listModal/ui/modalWrapper";
import ModalPlayerSkeleton from "@/shared/components/modalPlayerSkeleton";
import ModalTrackListSkeleton from "@/shared/components/modalTrackListSkeleton";

const ModalPlayer = lazy(() => import("@/features/listModal/ui/modalPlayer"));
const ModalTrackList = lazy(
  () => import("@/features/listModal/ui/modalTrackList")
);

/*
  TODO:
  tippy.js 툴팁 괜찮은데, react19 에러가 뜨네...
  https://www.npmjs.com/package/tippy.js
*/

export default function ListModal() {
  return (
    <ModalWrapper>
      <Suspense fallback={<ModalPlayerSkeleton />}>
        <ModalPlayer />
      </Suspense>
      <Suspense fallback={<ModalTrackListSkeleton />}>
        <ModalTrackList />
      </Suspense>
    </ModalWrapper>
  );
}
