import { motion } from "framer-motion";
import clsx from "clsx";
import { useEffect } from "react";
import { listModalVariants } from "@/shared/lib/util";
import { useToggle } from "@/shared/providers/toggleProvider";
import { InfiniteScrollProvider } from "@/shared/providers/infiniteScrollProvider";
import { useCallback } from "react";

/*
  TODO:
  tippy.js 툴팁 괜찮은데, react19 에러가 뜨네...
  https://www.npmjs.com/package/tippy.js
*/

interface ListModalProps {
  children: React.ReactNode;
}

export default function ListModal({ children }: ListModalProps) {
  const { isOpen } = useToggle();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLoadMore = useCallback(() => {
    // TODO: 클라디나리 기능으로는 무한스크롤 기능 구현이 안된다.
    // 조인 기능이나 세밀한 리미티드 조회가 안되므로 설계 실패...
    // 추후 batch 시스템으로 데이터베이스에 트랙정보 옮겨 놓은 후 실제 API 요청을 구현하도록 하자
    // 현재로선 이미 조회된 데이터를 10개씩 추가하도록 비즈니스 로직만 구현이 최선이다
    console.log("Loading more tracks...");
  }, []);

  return (
    <motion.div
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      exit="closed"
      variants={listModalVariants}
      className={clsx(
        "grid grid-cols-1 md:grid-cols-4 fixed inset-0 m-auto w-[95%] md:w-[90%] h-[90%]",
        "bg-[#483544aa] text-white backdrop-blur-lg",
        "border border-white/50 rounded-2xl shadow-[0_0.5px_0_1px_rgba(255,255,255,0.2)_inset,0_1px_0_0_rgba(255,255,255,0.6)_inset,0_4px_16px_rgba(0,0,0,0.1)]",
        "overflow-y-auto md:overflow-hidden custom-scrollbar",
        "z-40"
      )}
      style={{ willChange: "transform, opacity" }}
    >
      <InfiniteScrollProvider onLoadMore={handleLoadMore}>
        {children}
      </InfiniteScrollProvider>
    </motion.div>
  );
}
