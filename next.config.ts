import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily disabled static export to support API routes
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Optimize for production build
  distDir: '.next'
};

export default nextConfig;
