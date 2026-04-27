/** @type {import('next').NextConfig} */
module.exports = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', '@pascal-app/core', '@pascal-app/viewer', '@pascal-app/editor'],
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/api/models/file/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://fqaxmlqfskmwjqmhuzmq.supabase.co; connect-src 'self' https://fqaxmlqfskmwjqmhuzmq.supabase.co wss://fqaxmlqfskmwjqmhuzmq.supabase.co https://api.iconify.design; worker-src 'self' blob:; frame-src 'none';"
          },
        ],
      },
    ]
  },
}