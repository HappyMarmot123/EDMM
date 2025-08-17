import React, { useEffect } from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { interpolateColor } from "@/shared/lib/colorUtils";
import { useIntroStore } from "@/app/store/introStore";

const Intro = () => {
  const { isIntroVisible, hideIntro } = useIntroStore();

  const introVariants: Variants = {
    initial: {
      backgroundColor: "#000",
      opacity: 1,
    },
    exit: {
      opacity: 0,
      transition: {
        delay: 1.0,
        duration: 0.5,
      },
    },
  };

  const sentenceVariants: Variants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.3,
      },
    },
    exit: {
      transition: {
        staggerChildren: 0.03,
        staggerDirection: -1,
      },
    },
  };

  const letterVariants: Variants = {
    initial: {
      opacity: 0,
      y: "100%",
      rotate: 10,
    },
    animate: {
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: "-100%",
      rotate: -10,
      transition: {
        duration: 0.4,
        ease: "easeIn",
      },
    },
  };

  const textLines = [
    { text: "EDMM", startColor: "#e8e8e8", endColor: "#e3d5e2" },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      hideIntro();
    }, 4000);
    return () => clearTimeout(timer);
  }, [hideIntro]);

  return (
    <AnimatePresence>
      {isIntroVisible && (
        <motion.div
          className="intro fixed top-0 left-0 w-full h-full flex items-center justify-center z-[100]"
          variants={introVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <motion.div
            className="intro-text"
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {textLines.map((line, index) => (
              <motion.h1
                key={index}
                className="hide font-bold text-9xl overflow-hidden"
                variants={sentenceVariants}
              >
                <span className="flex">
                  {line.text.split("").map((char, charIndex) => {
                    const factor = charIndex / (line.text.length - 1);
                    const color = interpolateColor(
                      line.startColor,
                      line.endColor,
                      factor
                    );
                    return (
                      <motion.span
                        key={charIndex}
                        className="inline-block select-none"
                        variants={letterVariants}
                        style={{ color }}
                      >
                        {char === " " ? "\u00A0" : char}
                      </motion.span>
                    );
                  })}
                </span>
              </motion.h1>
            ))}
          </motion.div>
          <motion.div className="slider"></motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Intro;
