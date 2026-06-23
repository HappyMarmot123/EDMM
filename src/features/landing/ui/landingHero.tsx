import { motion } from "framer-motion";
import Github from "@/features/landing/components/github";
import Earth from "@/features/landing/components/earth";

export default function Hero() {
  return (
    <section className="py-36 min-h-screen flex flex-col justify-between p-4 md:p-8 overflow-x-hidden gap-4 md:gap-0">
      <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-screen-xl mx-auto">
        <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold leading-none text-center md:text-left">
          EDMM
        </h1>
        <div className="flex flex-col text-center md:text-right mt-4 md:mt-0">
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="font-black uppercase text-2xl sm:text-3xl lg:text-4xl tracking-widest"
          >
            EDM Marmot
          </motion.p>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-gray-400 text-xl sm:text-2xl lg:text-3xl font-semibold uppercase"
          >
            © 2025 HappyMarmot
          </motion.p>
        </div>
      </div>

      <div className="hidden w-full md:flex justify-center items-center flex-shrink-0">
        <div className="w-[500px] h-[500px] scale-[0.6] sm:scale-[0.8] md:scale-100 transition-transform duration-300 flex items-center justify-center z-10">
          <Earth width={500} height={500} />
        </div>
      </div>

    </section>
  );
}
