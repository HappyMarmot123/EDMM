import type { Metadata } from "next";
import "@/shared/styles/global.css?v=2";
import Script from "next/script";
import { AuthProvider } from "@/app/providers/authProvider";
import { ToggleProvider } from "@/app/providers/toggleProvider";
import { AudioPlayerProvider } from "@/app/providers/audioPlayerProvider";
import { DataLoader } from "./api/dataLoader";
import TrackService from "@/features/track/services/TrackService";
import { TanstackProvider } from "./providers/tanstackProvider";

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
        url: "/logo.png",
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
    images: ["/logo.png"],
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
            <AudioPlayerProvider>
              <ToggleProvider>{children}</ToggleProvider>
            </AudioPlayerProvider>
          </TanstackProvider>
        </AuthProvider>
      </body>
    </html>
  );
};

export default RootLayout;
