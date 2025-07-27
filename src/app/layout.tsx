import type { Metadata } from "next";
import "@/shared/styles/global.css?v=2";
import Script from "next/script";
import { AuthProvider } from "@/shared/providers/authProvider";
import { AudioPlayerProvider } from "@/shared/providers/audioPlayerProvider";
import { DataLoader } from "./api/dataLoader";
import TrackService from "@/shared/lib/TrackService";
import { TanstackProvider } from "../shared/providers/tanstackProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://edmm.vercel.app"),
  title: "EDMM",
  description: "음악 스트리밍 서비스",
  keywords: ["음악", "스트리밍", "노래", "EDMM", "music"],
  openGraph: {
    title: "EDMM",
    description: "음악 스트리밍 서비스",
    type: "website",
    siteName: "EDMM",
    images: [
      {
        url: "/favicon.ico",
        width: 800,
        height: 600,
        alt: "EDMM 로고",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EDMM",
    description: "음악 스트리밍 서비스",
    images: ["/favicon.ico"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const tracks = await DataLoader();

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <Script
        src="https://developers.kakao.com/sdk/js/kakao.js"
        strategy="afterInteractive"
      />
      <body>
        <TrackService tracks={tracks} />
        <AuthProvider>
          <TanstackProvider>
            <AudioPlayerProvider>{children}</AudioPlayerProvider>
          </TanstackProvider>
        </AuthProvider>
      </body>
    </html>
  );
};

export default RootLayout;
