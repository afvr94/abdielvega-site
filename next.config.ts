import type { NextConfig } from 'next';
import path from 'node:path';

const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'abdielvegabucket.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
};

export default config;
