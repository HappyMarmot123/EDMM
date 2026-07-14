"use client";

import { useEffect } from "react";
import type { MouseEvent } from "react";
import { useAndroidAppPromo } from "@/shared/hooks/useAndroidAppPromo";
import { APK_DOWNLOAD_URL } from "@/features/appPromo/config";

const stopPropagation = (event: MouseEvent) => event.stopPropagation();

export default function AndroidAppInstallModal() {
  const { shouldShow, dismiss } = useAndroidAppPromo();

  useEffect(() => {
    if (!shouldShow) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shouldShow, dismiss]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000]">
      {/* Backdrop overlay — hidden from assistive tech, click dismisses */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60"
        onClick={dismiss}
        data-testid="app-install-overlay"
      />

      {/* Dialog sits as a sibling of the backdrop so aria-hidden does not affect it */}
      <div className="flex h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="앱 설치 안내"
          className="w-full max-w-sm rounded-2xl bg-[#141018] p-6 text-center text-white shadow-xl"
          onClick={stopPropagation}
        >
          <h2 className="text-lg font-semibold">EDMM 앱으로 더 편하게</h2>
          <p className="mt-2 text-sm text-white/70">
            안드로이드 앱을 설치하고 더 나은 경험을 만나보세요.
          </p>
          <a
            href={APK_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="mt-5 block w-full rounded-xl bg-[#fd6d94] px-4 py-3 text-sm font-semibold text-white"
          >
            앱 다운로드
          </a>
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 w-full px-4 py-2 text-sm text-white/60"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
