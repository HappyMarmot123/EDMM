import type { Metadata } from "next";
import "@/shared/styles/global.css";
import { AudioPlayerProvider } from "@/shared/providers/audioPlayerProvider";
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

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <TanstackProvider>
          <AudioPlayerProvider>{children}</AudioPlayerProvider>
        </TanstackProvider>
      </body>
    </html>
  );
};

export default RootLayout;
