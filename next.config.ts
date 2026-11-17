import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Aumentamos el límite a 10 Megabytes
    },
  },
};

export default nextConfig;