/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['mongoose'],
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
      allowedOrigins: [
        'localhost:3000',
        'localhost:3001',
        'localhost:3002',
        '127.0.0.1:3000',
        '127.0.0.1:3001',
        '127.0.0.1:3002',
        '*.vercel.app',
        'brightsmartshop24.com',
        'www.brightsmartshop24.com',
        'www.bss24.shop',
        'bss24.shop',
      ],
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      {
        protocol: 'https',
        hostname: 'www.brightsmartshop24.com',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'www.bss24.shop',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'bss24.shop',
        pathname: '/storage/**',
      },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // সিক্রেট অ্যাডমিন রুট রিরাইটস (Domain/219192026 -> /admin)
  async rewrites() {
    return [
      { source: '/219192026/:path*', destination: '/admin/:path*' },
      { source: '/219192026', destination: '/admin' },
    ];
  },
};

export default nextConfig;