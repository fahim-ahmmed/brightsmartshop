/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
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
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.brightsmartshop24.com',
        pathname: '/storage/**',
      },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;