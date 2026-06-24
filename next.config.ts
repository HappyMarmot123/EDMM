import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "singhimalaya.github.io" },
      { protocol: "https", hostname: "audius-content-*.cdn.uservice.io" },
      { protocol: "https", hostname: "cdns-images.dzcdn.net" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  webpack: (config) => {
    config.optimization.splitChunks = { chunks: "all", minChunks: 2 };
    return config;
  },
};

export default nextConfig;
