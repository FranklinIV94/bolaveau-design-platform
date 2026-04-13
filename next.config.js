/** @type {import('next').NextConfig} */
module.exports = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['three', '@pascal-app/viewer', '@pascal-app/core'],
  images: {
    unoptimized: true,
  },
}
