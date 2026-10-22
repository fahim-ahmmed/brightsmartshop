"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/layout/Footer";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // ডাটাবেস থেকে ক্যাটাগরি ফেচ করা (অ্যাডমিন প্যানেল থেকে তৈরি করা ক্যাটাগরিগুলো এখানে দেখাবে)
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          // শুধু মূল ক্যাটাগরিগুলো ফিল্টার করে নেওয়া (যাদের প্যারেন্ট নাই)
          const allCats = data.categories || data || [];
          const mainCats = allCats.filter((c) => !c.parentCategory && !c.parentSlug);
          setCategories(mainCats);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

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
        {loading ? (
          <div className="text-center py-20 text-xs font-bold text-[#00875A] animate-pulse">
            Loading categories...
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((cat) => {
              const catSlug = cat.slug || cat._id;
              return (
                <Link
                  key={cat._id}
                  href={`/category/${catSlug}`}
                  className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl overflow-hidden flex items-center justify-center p-1.5 border border-emerald-100 group-hover:scale-105 transition-transform">
                      <img
                        src={cat.image || "/hero1.jpg"}
                        alt={cat.name}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                    <h3 className="font-extrabold text-base text-gray-900 group-hover:text-[#00875A] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Explore top quality items under {cat.name} category.
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#00875A]">
                    <span>Browse Category</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-2xs">
            <p className="text-xs font-bold text-gray-500">
              No categories found. Please add categories from Admin Panel.
            </p>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}