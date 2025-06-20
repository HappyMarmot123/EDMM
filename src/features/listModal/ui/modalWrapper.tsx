import { motion } from "framer-motion";
import clsx from "clsx";
import { useEffect } from "react";
import { listModalVariants } from "@/shared/lib/util";
import { useToggle } from "@/shared/providers/toggleProvider";

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
    >
      {children}
    </motion.div>
  );
}
