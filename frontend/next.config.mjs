import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: ['./styles'],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Only ignore type errors during build, not during development
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.alias['@eduforger/shared'] = path.join(__dirname, '../shared/types');
    return config;
  },
};

export default nextConfig;
