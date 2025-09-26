/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://api.assetworks.ai/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;