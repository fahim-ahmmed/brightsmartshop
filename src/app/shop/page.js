"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";

function ShopContent() {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category") || "all";
  const cartContext = useCart();
  const addToCart = cartContext?.addToCart || (() => {});

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // All 10 Categories List for Filter Tabs
  const filterCategories = [
    { title: "All", slug: "all", icon: "🛒" },
    { title: "Grocery & Daily Essentials", slug: "grocery", icon: "🌾" },
    { title: "Beauty & Cosmetics", slug: "cosmetics", icon: "🧴" },
    { title: "Home & Kitchen", slug: "kitchen", icon: "🍳" },
    { title: "Fashion & Accessories", slug: "fashion", icon: "👕" },
    { title: "Health & Personal Care", slug: "health", icon: "💊" },
    { title: "Baby Care", slug: "baby", icon: "🍼" },
    { title: "Electronics & Gadgets", slug: "electronics", icon: "📺" },
    { title: "Dietary Supplement", slug: "supplement", icon: "🌿" },
    { title: "Gifts & Package", slug: "gifts", icon: "🎁" },
  ];

  // Fetch products from MongoDB
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Filter logic (Flexible text matching)
  const filteredProducts = products.filter((p) => {
    if (selectedCategory === "all") return true;
    const cat = p.category ? p.category.toLowerCase() : "";
    return cat.includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 space-y-8 font-sans">
      
      {/* Category Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <span className="text-xs font-black text-[#00875A] uppercase tracking-widest block">
            STORE CATALOG
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 capitalize">
            {selectedCategory === "all" ? "All Store Products" : `${selectedCategory} Products`}
          </h1>
        </div>
        <span className="text-xs font-extrabold text-gray-500 bg-gray-100 px-3.5 py-1.5 rounded-full">
          Showing {filteredProducts.length} Items
        </span>
      </div>

      {/* Category Horizontal Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filterCategories.map((cat, idx) => {
          const isActive = selectedCategory.toLowerCase() === cat.slug.toLowerCase();
          return (
            <Link
              key={idx}
              href={cat.slug === "all" ? "/shop" : `/shop?category=${cat.slug}`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all shadow-2xs ${
                isActive
                  ? "bg-[#00875A] text-white shadow-md shadow-emerald-700/20"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.title}</span>
            </Link>
          );
        })}
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="text-center py-20 text-xs font-extrabold text-[#00875A] animate-pulse">
          Loading catalog items from MongoDB...
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filteredProducts.map((p) => (
            <div
              key={p._id || p.id}
              className="bg-white rounded-3xl p-4 border border-gray-200/80 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Discount Badge */}
              {p.originalPrice > p.price && (
                <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-xs z-10">
                  SAVE ৳{p.originalPrice - p.price}
                </span>
              )}

              {/* Product Image Container */}
              <div className="w-full h-44 sm:h-52 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center p-2 mb-3 relative group-hover:bg-gray-100/80 transition-colors">
                <img
                  src={p.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"}
                  alt={p.title}
                  className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Product Info */}
              <div className="space-y-1.5 mb-3">
                <span className="text-[10px] font-black text-[#00875A] uppercase tracking-wider block">
                  {p.category}
                </span>
                <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 line-clamp-1 group-hover:text-[#00875A] transition-colors">
                  {p.title}
                </h3>
                {p.description && (
                  <p className="text-[11px] text-gray-400 line-clamp-1 leading-relaxed">
                    {p.description}
                  </p>
                )}
              </div>

              {/* Price & Add to Cart Button */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-base font-black text-gray-900 block">
                    ৳{p.price}
                  </span>
                  {p.originalPrice > p.price && (
                    <span className="text-[11px] text-gray-400 line-through font-bold block">
                      ৳{p.originalPrice}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    addToCart({
                      id: p._id || p.id,
                      title: p.title,
                      price: p.price,
                      image: p.image,
                    })
                  }
                  className="px-3.5 py-2 bg-[#00875A] hover:bg-[#00704A] active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>+</span>
                  <span>Add</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-2xs space-y-2">
          <div className="text-4xl">📦</div>
          <h3 className="text-sm font-bold text-gray-800">No products found in this category</h3>
          <p className="text-xs text-gray-400">Try selecting another category or check back later.</p>
        </div>
      )}

    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-xs font-bold text-[#00875A]">Loading Store...</div>}>
      <ShopContent />
    </Suspense>
  );
}