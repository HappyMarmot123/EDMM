import type { Metadata } from "next";
import Script from "next/script";
import "@/shared/styles/global.css";
import { HYDRATION_EXTENSION_ATTRIBUTE_GUARD_SCRIPT } from "@/shared/lib/hydrationExtensionAttributeGuard";
import { AppProviders } from "./appProviders";

export const metadata: Metadata = {
  metadataBase: new URL("https://edmm.vercel.app"),
  title: "EDMM",
  description: "음악 스트리밍 서비스",
  manifest: "/manifest.webmanifest",
  keywords: ["음악", "스트리밍", "트랙", "EDMM", "music"],
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
    <html lang="ko" suppressHydrationWarning={true}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#111827" />
        <meta name="msapplication-TileColor" content="#111827" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning={true}>
        <Script
          id="hydration-extension-attribute-guard"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: HYDRATION_EXTENSION_ATTRIBUTE_GUARD_SCRIPT,
          }}
        />
        <Script
          id="pwa-service-worker-registration"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", () => {
                  navigator.serviceWorker
                    .register("/sw.js")
                    .catch(() => {});
                });
              }
            `,
          }}
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
};

export default RootLayout;
