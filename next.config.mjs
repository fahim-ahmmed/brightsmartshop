/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  output: 'standalone', // Docker/VPS ডিপ্লয়ের জন্য ছোট বান্ডিল
  serverExternalPackages: ['mongoose'],
  experimental: { serverActions: { bodySizeLimit: '5mb' } }, // অ্যাডমিন ছবি আপলোড
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // পুরোনো সাইটের ছবি (npm run migrate:images চালানোর পর এটা সরানো যাবে)
      { protocol: 'https', hostname: 'www.brightsmartshop24.com', pathname: '/storage/**' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
export default nextConfig;
