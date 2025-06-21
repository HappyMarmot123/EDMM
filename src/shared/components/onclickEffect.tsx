import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import groovyWalkAnimation from "@/../public/popLottie.json";
import { OnclickEffectProps } from "@/shared/types/dataType";
const DynamicLottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function OnclickEffect({
  play,
  onComplete,
}: OnclickEffectProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (play && lottieRef.current) {
      lottieRef.current.play();
    }
  }, [play]);

  return (
    <DynamicLottie
      lottieRef={lottieRef}
      animationData={groovyWalkAnimation}
      loop={false}
      autoplay={false}
      onComplete={() => {
        if (lottieRef.current) {
          lottieRef.current.stop();
        }
        onComplete();
      }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-18 h-18 pointer-events-none z-50"
    />
  );
}
