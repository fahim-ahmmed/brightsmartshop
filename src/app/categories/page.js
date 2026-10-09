"use client";

import React from "react";
import Link from "next/link";
import Footer from "@/components/layout/Footer";

export const ALL_CATEGORIES_DATA = [
  { title: "Grocery & Food", slug: "grocery", icon: "🌾", bg: "bg-[#F3F8EC] border-[#E2EED3]", description: "Rice, Oil, Spices & Daily Cooking Essentials" },
  { title: "Clothing & Fashion", slug: "fashion", icon: "👕", bg: "bg-[#FFF5EC] border-[#FFE4D1]", description: "Men, Women & Kids Clothing" },
  { title: "Cosmetics", slug: "cosmetics", icon: "🧴", bg: "bg-[#FFF0F3] border-[#FFDBE2]", description: "Makeup, Skincare & Lipsticks" },
  { title: "Beauty Care", slug: "beauty", icon: "🪷", bg: "bg-[#F3EEFF] border-[#E4D7FF]", description: "Herbal & Personal Care Products" },
  { title: "Health & Medicine", slug: "health", icon: "💊", bg: "bg-[#EBF7F8] border-[#D0F0F3]", description: "Monitors, Supplements & First Aid" },
  { title: "Electronics", slug: "electronics", icon: "📺", bg: "bg-[#EBF3FF] border-[#D1E2FF]", description: "Gadgets, Earbuds & Smart Devices" },
  { title: "Home & Kitchen", slug: "kitchen", icon: "🍳", bg: "bg-[#FFF9EC] border-[#FFEEC8]", description: "Cookware, Pans & Home Utilities" },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-800 flex flex-col justify-between">
      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 w-full space-y-8">
        
        {/* Header */}
        <div className="border-b border-gray-200 pb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-[#00875A] uppercase tracking-widest block">
              EXPLORE STORE
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              All Categories
            </h1>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-[#00875A] hover:underline"
          >
            Show All Products →
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {ALL_CATEGORIES_DATA.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className={`${cat.bg} border rounded-3xl p-6 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between group cursor-pointer`}
            >
              <div className="space-y-3">
                <div className="text-5xl group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <h3 className="font-extrabold text-base text-gray-900 group-hover:text-[#00875A] transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-black/5 flex items-center justify-between text-xs font-bold text-[#00875A]">
                <span>Browse Category</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>

      </main>
      <Footer />
    </div>
  );
}