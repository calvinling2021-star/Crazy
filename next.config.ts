import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 'output: export' removed — the /dashboard API routes require a running
  // Node.js server. Re-add for Vercel static-only deployments of the marketing
  // site and exclude the dashboard route group at that point.
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  webpack: (config) => {
    // better-sqlite3 is a native Node module — keep it out of the webpack bundle
    config.externals.push({ "better-sqlite3": "commonjs better-sqlite3" });
    return config;
  },
};

export default nextConfig;
