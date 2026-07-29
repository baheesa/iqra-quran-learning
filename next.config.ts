import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Standalone helps Docker/VPS; Vercel ignores this and uses its own bundling.
  output: "standalone",
  // Ensure mushaf/curriculum JSON is included in serverless traces (Vercel).
  outputFileTracingIncludes: {
    "/api/**/*": ["./data/**/*", "./config/**/*"],
    "/*": ["./data/**/*", "./config/**/*"],
  },
  // Keep heavy SDKs out of the Next server bundle (smaller RSS on 1GB hosts).
  serverExternalPackages: ["openai", "@prisma/client", "prisma"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["@tanstack/react-query", "zod"],
  },
  // Production source maps inflate memory; keep off unless debugging.
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/downloads/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "application/vnd.android.package-archive",
          },
          {
            key: "Content-Disposition",
            value: 'attachment; filename="iqra-quran-learning.apk"',
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
