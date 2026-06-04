import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 'output: export' removed — the /dashboard API routes require a running
  // Node.js server. Re-add for Vercel static-only deployments of the marketing
  // site and exclude the dashboard route group at that point.
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // better-sqlite3 is a native Node module — keep it external to the server bundle.
  // serverExternalPackages handles this under Turbopack (the Next 16 default).
  serverExternalPackages: ["better-sqlite3"],
  // Empty turbopack config silences the "webpack config + no turbopack config" build error;
  // the webpack fallback below still applies for `next build --webpack`.
  turbopack: {},
  webpack: (config) => {
    config.externals.push({ "better-sqlite3": "commonjs better-sqlite3" });
    return config;
  },
};

export default nextConfig;
