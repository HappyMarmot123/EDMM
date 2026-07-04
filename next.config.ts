import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "singhimalaya.github.io" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
});
