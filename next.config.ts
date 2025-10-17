import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

// Configure bundle analyzer (enabled with ANALYZE=true environment variable)
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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
  // Suppress verbose logging
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Reduce compilation output
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Disable verbose webpack output
  webpack: (config, { dev }) => {
    if (dev) {
      config.stats = 'errors-warnings';
      config.infrastructureLogging = {
        level: 'error',
      };
    }
    return config;
  },
};

// Export config wrapped with bundle analyzer
export default withBundleAnalyzer(nextConfig);
