import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "singhimalaya.github.io",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: "all",
      minChunks: 2,
    };
    return config;
  },
  swcMinify: false, // 난독화 여부
};

module.exports = nextConfig;
