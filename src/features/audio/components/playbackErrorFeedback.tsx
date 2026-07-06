import { AlertTriangle, RotateCcw } from "lucide-react";
import {
  PLAYBACK_ERROR_CODES,
  type PlaybackErrorCode,
} from "@/shared/providers/audioPlaybackErrors";
import type { PlaybackError } from "@/shared/providers/audioPlayerTypes";

type PlaybackErrorFeedbackProps = {
  canRetry: boolean;
  className?: string;
  error: PlaybackError;
  onRetry: () => void | Promise<void>;
};

const PLAYBACK_ERROR_COPY = {
  [PLAYBACK_ERROR_CODES.autoplayBlocked]: {
    message:
      "브라우저가 자동 재생을 막았습니다. 재생 버튼을 한 번 더 눌러 주세요.",
    retryLabel: "다시 재생",
    retryable: true,
  },
  [PLAYBACK_ERROR_CODES.sourceLoadFailed]: {
    message:
      "지금은 이 트랙을 재생할 수 없습니다. 다른 트랙을 선택해 주세요.",
    retryLabel: null,
    retryable: false,
  },
  [PLAYBACK_ERROR_CODES.unsupportedAudioContext]: {
    message:
      "오디오 장치를 준비하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.",
    retryLabel: "다시 재생",
    retryable: true,
  },
} satisfies Record<
  PlaybackErrorCode,
  {
    message: string;
    retryLabel: string | null;
    retryable: boolean;
  }
>;

export default function PlaybackErrorFeedback({
  canRetry,
  className = "",
  error,
  onRetry,
}: PlaybackErrorFeedbackProps) {
  if (!error) {
    return null;
  }

  const copy = PLAYBACK_ERROR_COPY[error];
  const showRetry = canRetry && copy.retryable && copy.retryLabel;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Playback error feedback"
      className={`pointer-events-none absolute inset-x-0 bottom-[calc(100%+10px)] z-[5] flex justify-center px-3 ${className}`}
    >
      <div className="pointer-events-auto flex w-[min(100%,520px)] items-center gap-2 rounded-md border border-[#fd6d94]/35 bg-[#170b10]/95 px-3 py-2 text-sm text-white shadow-[0_14px_40px_rgba(0,0,0,0.42)] backdrop-blur-md">
        <AlertTriangle
          className="h-4 w-4 flex-none text-[#fd6d94]"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 leading-snug text-white/88">
          {copy.message}
        </span>
        {showRetry ? (
          <button
            type="button"
            className="inline-flex h-8 flex-none items-center gap-1 rounded-md bg-white px-2.5 text-xs font-semibold text-black transition-transform duration-150 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd6d94] focus-visible:ring-offset-2 focus-visible:ring-offset-[#170b10]"
            onClick={(event) => {
              event.stopPropagation();
              void onRetry();
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.retryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
