"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y } from "swiper/modules";
import { CardContainer } from "../../features/landing/components/cardContainer";
import { HorizontalSwiperProps } from "@/shared/types/dataType";
import "swiper/css";
import { ChevronRight, ChevronLeft } from "lucide-react";

/* 
  TODO:
  spaceBetween={16}  마진값으로 들어가는데 가끔 공백 스크롤 슬라이드가 잘 안됨됨
  prev/next 버튼 클래스명을 고유의 값으로 설정정
*/

export default function HorizontalSwiper({
  data,
  swiperId,
}: HorizontalSwiperProps) {
  const nextButtonClass = `swiper-button-next-${swiperId} `;
  const prevButtonClass = `swiper-button-prev-${swiperId} `;
  const defaultNextButtonClass =
    "absolute p-2 right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 bg-black/30 backdrop-blur-md text-white rounded-full hover:bg-black/50 hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 hover:outline-none hover:ring-2 hover:ring-white/50 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center cursor-pointer shadow-lg";
  const defaultPrevButtonClass =
    "absolute p-2 left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 bg-black/30 backdrop-blur-md text-white rounded-full hover:bg-black/50 hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 hover:outline-none hover:ring-2 hover:ring-white/50 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center cursor-pointer shadow-lg";

  return (
    <div className="relative">
      <Swiper
        modules={[Navigation, A11y]}
        slidesPerView="auto"
        navigation={{
          nextEl: `.${nextButtonClass}`,
          prevEl: `.${prevButtonClass}`,
        }}
        className="!p-8"
      >
        {Array.from(data.values()).map((item) => (
          <SwiperSlide
            key={item.asset_id}
            className="!select-none !w-auto !pr-4 md:!pr-8"
          >
            <CardContainer card={item} />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className={`${defaultPrevButtonClass} ${prevButtonClass}`}>
        <ChevronLeft className="w-8 h-8 text-white/90" />
      </div>
      <div className={`${defaultNextButtonClass} ${nextButtonClass}`}>
        <ChevronRight className="w-8 h-8 text-white/90" />
      </div>
    </div>
  );
}
