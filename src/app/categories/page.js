import Link from "next/link";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import CategoryFilter from "@/features/shop/components/CategoryFilter";

export const metadata = {
  title: "Categories | Bright Smart Shop",
  description: "Browse all product categories and packages at Bright Smart Shop.",
};

export default async function CategoriesPage() {
  await dbConnect();

  const defaultCategories = [
    { name: "Grocery & Daily Essentials", slug: "grocery-daily-essentials", icon: "🛒" },
    { name: "Beauty & Cosmetics", slug: "beauty-cosmetics", icon: "💄" },
    { name: "Home & Kitchen", slug: "home-kitchen", icon: "🍳" },
    { name: "Fashion & Accessories", slug: "fashion-accessories", icon: "👕" },
    { name: "Health & Personal Care", slug: "health-personal-care", icon: "🩺" },
    { name: "Baby Care", slug: "baby-care", icon: "🍼" },
    { name: "Electronics & Gadgets", slug: "electronics-gadgets", icon: "🎧" },
    { name: "Dietary Suppliment", slug: "dietary-suppliment", icon: "💊" },
    { name: "Gifts & Package", slug: "gifts-package", icon: "🎁" },
    { name: "Beauty Service", slug: "beauty-service", icon: "✨" },
  ];

  let dbCategories = [];
  try {
    dbCategories = await Category.find({ isActive: { $ne: false } }).lean();
  } catch (err) {
    console.error("Error loading categories:", err);
  }

  const categoryList = dbCategories.length > 0 ? dbCategories : defaultCategories;

  const categoryWithCounts = await Promise.all(
    categoryList.map(async (cat) => {
      const count = await Product.countDocuments({
        $or: [{ category: cat.slug }, { category: cat._id }],
        isActive: { $ne: false },
      }).catch(() => 0);

      return {
        ...cat,
        productCount: count,
      };
    })
  );

  return (
    <main className="min-h-screen bg-gray-50/50 text-gray-800 font-sans pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-10">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <Link href="/" className="hover:text-emerald-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Categories</span>
        </nav>

        {/* Hero Section Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-8 sm:p-12 shadow-lg">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-emerald-100">
              Explore Our Store
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              All Categories & Packages
            </h1>
            <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
              Find everything from daily groceries, family ration packages, cosmetics to electronics in one place.
            </p>
          </div>
        </div>

        {/* Category Filter & Interactive Grid */}
        <CategoryFilter categories={JSON.parse(JSON.stringify(categoryWithCounts))} />

      </div>

    </main>
  );
}