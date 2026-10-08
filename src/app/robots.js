const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/dashboard', '/checkout', '/orders', '/profile', '/api/'] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
