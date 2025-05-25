import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  basePath: '/v3',
  assetPrefix: '/v3/',
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export',
};

export default nextConfig;
