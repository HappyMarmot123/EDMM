"use client";

import { Download } from "lucide-react";
import { APK_DOWNLOAD_URL } from "@/features/appPromo/config";

export default function AppDownloadButton() {
  return (
    <a
      href={APK_DOWNLOAD_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-10 shrink-0 items-center gap-1.5 self-center rounded-full border border-[#ff98a2]/55 bg-[#ff98a2]/12 px-3 text-xs font-black text-[#ff98a2] transition-colors hover:border-[#ff98a2] hover:bg-[#ff98a2]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb8c0]"
    >
      <Download size={16} strokeWidth={2.4} aria-hidden="true" />
      <span>App Download</span>
    </a>
  );
}
