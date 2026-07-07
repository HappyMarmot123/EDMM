"use client";

import React, { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/shared/lib/logger";
import { RouteFeedbackShell } from "@/shared/components/routeFeedbackShell";

interface ErrorProps {
  error: Error;
  reset: () => void;
}

/* TODO:
  에러 페이지 커스터마이징React의 에러 바운더리(Error Boundary) 기반으로로
  컴포넌트가 렌더링되는 도중에 발생하는 에러를 잡아내며, 이벤트 기반은 처리 못합니다.
*/

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
    logger.error(error);
  }, [error]);

  return (
    <RouteFeedbackShell
      rootClassName="bg-neutral-900 min-h-screen"
      contentClassName="px-4 text-center"
    >
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">문제가 발생했습니다.</h1>
        <p className="text-neutral-400 mb-8">
          예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors"
        >
          다시 시도하기
        </button>
      </div>
    </RouteFeedbackShell>
  );
}
