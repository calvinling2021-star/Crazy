import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: "/investments", destination: "/", permanent: true },
      { source: "/investments/:path*", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
