"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawCategory = searchParams.get("category") || "all";
  const cartContext = useCart();
  const addToCart = cartContext?.addToCart || (() => {});

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const filterCategories = [
    { title: "All Products", slug: "all", icon: "🛒" },
    { title: "Beauty & Cosmetics", slug: "cosmetics", icon: "🧴" },
    { title: "Grocery & Daily Essentials", slug: "grocery", icon: "🌾" },
    { title: "Home & Kitchen", slug: "kitchen", icon: "🍳" },
    { title: "Fashion & Accessories", slug: "fashion", icon: "👕" },
    { title: "Health & Personal Care", slug: "health", icon: "💊" },
    { title: "Baby Care", slug: "baby", icon: "🍼" },
    { title: "Electronics & Gadgets", slug: "electronics", icon: "📺" },
    { title: "Dietary Supplement", slug: "supplement", icon: "🌿" },
    { title: "Gifts & Package", slug: "gifts", icon: "🎁" },
  ];

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

  const filteredProducts = products.filter((p) => {
    if (!rawCategory || rawCategory.toLowerCase() === "all") return true;

    const prodCategory = (p.category || "").toLowerCase();
    const query = rawCategory.toLowerCase();

    if (query === "cosmetics") return prodCategory.includes("cosmetics") || prodCategory.includes("beauty");
    if (query === "grocery") return prodCategory.includes("grocery") || prodCategory.includes("food");
    if (query === "fashion") return prodCategory.includes("fashion") || prodCategory.includes("clothing");

    return prodCategory.includes(query);
  });

  // Pure Add to Cart Action (No Redirects to /cart)
  const handleAddToCartOnly = (product) => {
    addToCart({
      id: product._id || product.id,
      title: product.title,
      price: product.price,
      image: product.image,
    });
  };

  // Safe Direct Buy Now Action
  const handleBuyNow = (product) => {
    const params = new URLSearchParams({
      id: product._id || product.id || "",
      title: product.title || "",
      price: product.price || 0,
    });
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 space-y-8 font-sans text-gray-800">
      
      {/* Title Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <span className="text-xs font-black text-[#00875A] uppercase tracking-widest block">
            STORE CATALOG
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 capitalize">
            {rawCategory === "all" ? "All Store Products" : `${rawCategory} Items`}
          </h1>
        </div>
        <span className="text-xs font-extrabold text-[#00875A] bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full">
          Total Found: {filteredProducts.length} Items
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {filterCategories.map((cat, idx) => {
          const isActive = rawCategory.toLowerCase() === cat.slug.toLowerCase();
          return (
            <Link
              key={idx}
              href={cat.slug === "all" ? "/shop" : `/shop?category=${cat.slug}`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
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

      {/* Product Grid */}
      {loading ? (
        <div className="text-center py-20 text-xs font-extrabold text-[#00875A] animate-pulse">
          Fetching products...
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filteredProducts.map((p) => (
            <div
              key={p._id || p.id}
              className="bg-white rounded-3xl p-4 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              {p.originalPrice > p.price && (
                <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-xs z-10">
                  SAVE ৳{p.originalPrice - p.price}
                </span>
              )}

              {/* Image */}
              <div className="w-full h-44 sm:h-52 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center p-2 mb-3 relative group-hover:bg-gray-100 transition-colors">
                <img
                  src={p.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"}
                  alt={p.title}
                  className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Title & Category */}
              <div className="space-y-1 mb-3">
                <span className="text-[10px] font-black text-[#00875A] uppercase tracking-wider block">
                  {p.category || "General"}
                </span>
                <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 line-clamp-1 group-hover:text-[#00875A]">
                  {p.title}
                </h3>
              </div>

              {/* Price */}
              <div className="pt-2 border-t border-gray-100 mb-3 flex items-baseline gap-2">
                <span className="text-base font-black text-gray-900">৳{p.price}</span>
                {p.originalPrice > p.price && (
                  <span className="text-[11px] text-gray-400 line-through font-bold">৳{p.originalPrice}</span>
                )}
              </div>

              {/* Buy Now & Add to Cart Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddToCartOnly(p)}
                  className="py-2.5 bg-emerald-100 hover:bg-emerald-200 text-[#00875A] font-extrabold text-[11px] rounded-xl transition-all cursor-pointer text-center"
                >
                  🛒 Cart
                </button>

                <button
                  type="button"
                  onClick={() => handleBuyNow(p)}
                  className="py-2.5 bg-[#00875A] hover:bg-[#00704A] text-white font-black text-[11px] rounded-xl transition-all cursor-pointer shadow-xs text-center"
                >
                  ⚡ Buy Now
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 space-y-3">
          <div className="text-4xl">📦</div>
          <h3 className="text-sm font-bold text-gray-800">No products found</h3>
        </div>
      )}

    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-[#00875A]">Loading Store...</div>}>
      <ShopContent />
    </Suspense>
  );
}