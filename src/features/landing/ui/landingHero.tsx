import { motion } from "framer-motion";
import Github from "@/features/landing/components/github";
import Earth from "@/features/landing/components/earth";
import Parallax from "../components/parallax";

export default function Hero() {
  return (
    <section className="pt-36 md:py-36 px-8 md:min-h-screen flex flex-col justify-center gap-16 overflow-x-hidden ">
      <div className="flex justify-between items-center gap-8 flex-shrink-0 w-full">
        <div className="flex flex-col justify-between items-center gap-4 w-full md:pl-8">
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold leading-none text-center md:text-left">
            EDMM
          </h1>
          <div className="flex flex-col text-center mt-0 max-w-[17rem] md:max-w-none">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="font-black uppercase text-2xl sm:text-3xl lg:text-4xl tracking-widest"
            >
              <p>Small steps every day</p>
              <p>lead to big changes.</p>
            </motion.span>
          </div>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-gray-400 text-xl sm:text-2xl lg:text-3xl font-semibold uppercase"
          >
            © 2025 Marmot33
          </motion.p>
        </div>

        <div className="w-[600px] h-[600px] hidden scale-[0.8] xl:scale-[1.0] transition-transform duration-300 md:flex items-center justify-center z-10">
          <Earth width={600} height={600} />
        </div>
      </div>

      <section className="relative h-fit flex flex-col justify-center p-4 overflow-hidden">
        <Parallax baseVelocity={-2}>Electronic</Parallax>
        <div className="py-2"></div>
        <Parallax baseVelocity={2}>Dance Music</Parallax>
      </section>

      {/* <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 w-full max-w-screen-xl mx-auto pb-8 md:pb-4">
        <div className="text-center md:text-left my-4 md:my-0">
          <p className="font-semibold tracking-tighter uppercase text-base sm:text-lg lg:text-xl">
            Portfolio Production
          </p>
          <p className="font-semibold tracking-tighter uppercase text-base sm:text-lg lg:text-xl">
            Designed by HappyMarmot123
          </p>
          <p className="font-semibold tracking-tighter uppercase text-base sm:text-lg lg:text-xl">
            Have Fun Enjoy It
          </p>
        </div>
        <div className="flex justify-center md:justify-end">
          <Github />
        </div>
      </div> */}
    </section>
  );
}
