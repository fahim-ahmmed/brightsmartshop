"use client";

import React from "react";
import Link from "next/link";

export default function CategorySidebarMenu() {
  // Matching Categories with Round Icons from Screenshot 49
  const categories = [
    { name: "Grocery & Daily Essen...", slug: "grocery-daily-essentials", icon: "🧺", bg: "bg-amber-100/70 text-amber-800" },
    { name: "Beauty & Cosmetics", slug: "beauty-cosmetics", icon: "💄", bg: "bg-pink-100/70 text-pink-800" },
    { name: "Home & Kitchen", slug: "home-kitchen", icon: "🍳", bg: "bg-emerald-100/70 text-emerald-800" },
    { name: "Fashion & Accessories", slug: "fashion-accessories", icon: "👗", bg: "bg-rose-100/70 text-rose-800" },
    { name: "Health & Personal Care", slug: "health-personal-care", icon: "🩺", bg: "bg-purple-100/70 text-purple-800" },
    { name: "Baby Care", slug: "baby-care", icon: "🍼", bg: "bg-sky-100/70 text-sky-800" },
    { name: "Electronics & Gadgets", slug: "electronics-gadgets", icon: "🎧", bg: "bg-blue-100/70 text-blue-800" },
    { name: "Dietary Supplement", slug: "dietary-supplement", icon: "💊", bg: "bg-teal-100/70 text-teal-800" },
    { name: "All products", slug: "all-products", icon: "🛍️", bg: "bg-slate-100 text-slate-800" },
  ];

  return (
    <div className="w-64 bg-white/90 backdrop-blur-md rounded-3xl p-4 border border-rose-100/60 shadow-lg space-y-3 font-sans">
      
      {/* Category Header */}
      <div className="flex items-center justify-between pb-2 border-b border-rose-100/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
            ≡
          </div>
          <span className="font-extrabold text-sm text-gray-900">Categories</span>
        </div>
        <Link
          href="/categories"
          className="text-[11px] font-bold text-amber-600 hover:underline"
        >
          View all
        </Link>
      </div>

      {/* Category List Items */}
      <div className="space-y-1">
        {categories.map((cat, idx) => (
          <Link
            key={idx}
            href={`/shop?category=${cat.slug}`}
            className="flex items-center justify-between p-2 rounded-2xl hover:bg-rose-50/60 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Round Icon with Custom Gradient / Soft Color Pill */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-2xs flex-shrink-0 transition-transform group-hover:scale-110 ${cat.bg}`}
              >
                {cat.icon}
              </div>

              {/* Category Name */}
              <span className="text-xs font-bold text-gray-700 truncate group-hover:text-emerald-700 transition-colors">
                {cat.name}
              </span>
            </div>

            {/* Right Small Arrow */}
            <span className="text-xs text-gray-300 font-bold group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all">
              ›
            </span>
          </Link>
        ))}
      </div>

    </div>
  );
}