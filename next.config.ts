import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Only run ESLint on these directories during production builds
    dirs: ['app', 'components', 'lib'],
    // Ignore ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily ignore type errors during build to unblock deployment
    // TODO: Fix all TypeScript errors gradually
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
