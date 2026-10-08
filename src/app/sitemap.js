import { connectDB } from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';

const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export default async function sitemap() {
  const pages = ['', '/shop', '/categories', '/levels', '/about', '/privacy-policy', '/terms-conditions'].map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly' }));
  try {
    await connectDB();
    const [cats, products] = await Promise.all([
      Category.find({ isActive: true }, 'slug updatedAt').lean(),
      Product.find({ isActive: true }, 'slug updatedAt').lean(),
    ]);
    return [
      ...pages,
      ...cats.map((c) => ({ url: `${base}/category/${c.slug}`, lastModified: c.updatedAt })),
      ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt })),
    ];
  } catch {
    return pages; // ডেটাবেস না পেলেও সাইটম্যাপ ভাঙবে না
  }
}
