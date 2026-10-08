import Link from "next/link";
import { Suspense } from "react";
import HeroSlider from "@/features/shop/components/HeroSlider";
import ProductGrid from "@/features/shop/components/ProductGrid";
import AssistantWidget from "@/features/assistant/AssistantWidget";
import { getFeaturedProducts } from "@/features/shop/queries";

export const metadata = {
  title: "Bright Smart Shop | Home",
  description: "Welcome to Bright Smart Shop. Discover packages, grocery items, daily essentials and earn points with fast delivery.",
};

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts(8).catch(() => []);

  // স্ক্রিনশট অনুযায়ী ফিক্সড ১০টি ক্যাটাগরি
  const fixedCategories = [
    { name: "Grocery & Daily Essentials", slug: "grocery-daily-essentials" },
    { name: "Beauty & Cosmetics", slug: "beauty-cosmetics" },
    { name: "Home & Kitchen", slug: "home-kitchen" },
    { name: "Fashion & Accessories", slug: "fashion-accessories" },
    { name: "Health & Personal Care", slug: "health-personal-care" },
    { name: "Baby Care", slug: "baby-care" },
    { name: "Electronics & Gadgets", slug: "electronics-gadgets" },
    { name: "Dietary Suppliment", slug: "dietary-suppliment" },
    { name: "Gifts & Package", slug: "gifts-package" },
    { name: "Beauty Service", slug: "beauty-service" },
  ];

  return (
    <main className="min-h-screen bg-white text-gray-800 font-sans pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-10">
        
        {/* 1. Hero Section: Left Sidebar Categories + Right Main Banner */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Category Sidebar */}
          <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">≡</span>
                <h3 className="font-bold text-gray-900 text-base">Categories</h3>
              </div>
              <Link href="/categories" className="text-xs text-orange-500 hover:underline font-medium">
                View all
              </Link>
            </div>

            <div className="space-y-1 flex-1">
              {fixedCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-emerald-50/60 hover:text-emerald-700 transition-all group"
                >
                  <span className="truncate max-w-[200px]">{cat.name}</span>
                  <span className="text-gray-400 group-hover:text-emerald-600 text-xs">›</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Main Hero Banner / Slider */}
          <div className="lg:col-span-9 rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-emerald-50/20">
            <HeroSlider />
          </div>

        </section>

        {/* 2. Feature Cards Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl">🚚</div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Fast delivery</h4>
              <p className="text-xs text-gray-500 mt-0.5">Right at your doorstep</p>
            </div>
          </div>

          <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl">💰</div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Cash on delivery</h4>
              <p className="text-xs text-gray-500 mt-0.5">Pay safely when you receive</p>
            </div>
          </div>

          <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl">☑️</div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Genuine products</h4>
              <p className="text-xs text-gray-500 mt-0.5">Quality you can trust</p>
            </div>
          </div>

          <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl">🎁</div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Earn Point</h4>
              <p className="text-xs text-gray-500 mt-0.5">Get more value every time</p>
            </div>
          </div>
        </section>

        {/* 3. Our Packages Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-orange-600 tracking-wider uppercase">BRIGHT SMART SHOP</span>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-0.5">Our Packages</h2>
              <p className="text-sm text-gray-500 mt-1">Choose from our available product packages.</p>
            </div>
            <Link 
              href="/shop" 
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm transition-all"
            >
              View All
            </Link>
          </div>

          {/* Product / Package Grid */}
          <div className="pt-2">
            <Suspense fallback={<ProductSkeleton />}>
              <ProductGrid products={featuredProducts} />
            </Suspense>
          </div>
        </section>

      </div>

      {/* Floating Smart Assistant Button */}
      <AssistantWidget />
    </main>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse border border-gray-200" />
      ))}
    </div>
  );
}