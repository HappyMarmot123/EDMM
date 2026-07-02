"use client";

import { useEffect, useState } from "react";

const AT_BOTTOM_THRESHOLD_PX = 4;

/*
  스크롤 컨테이너가 맨 아래에 도달했는지 추적한다.
  하단 페이드(스크롤 유도 그라디언트)를 콘텐츠가 더 남았을 때만
  보여주기 위한 용도. 요소가 없거나 콘텐츠가 넘치지 않으면 true.
*/
export function useScrollAtBottom(
  element: HTMLElement | null,
  thresholdPx = AT_BOTTOM_THRESHOLD_PX,
): boolean {
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    if (!element) {
      setIsAtBottom(true);
      return;
    }

    const update = () => {
      setIsAtBottom(
        element.scrollTop + element.clientHeight >=
          element.scrollHeight - thresholdPx,
      );
    };

    update();
    element.addEventListener("scroll", update, { passive: true });

    // 가상 리스트/이미지 로딩 등으로 콘텐츠 높이가 바뀌는 경우 재계산
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    resizeObserver?.observe(element);
    if (element.firstElementChild instanceof HTMLElement) {
      resizeObserver?.observe(element.firstElementChild);
    }

    return () => {
      element.removeEventListener("scroll", update);
      resizeObserver?.disconnect();
    };
  }, [element, thresholdPx]);

  return isAtBottom;
}

export default useScrollAtBottom;
