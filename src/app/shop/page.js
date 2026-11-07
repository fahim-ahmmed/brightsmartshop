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

  const handleAddToCartOnly = (product) => {
    addToCart({
      id: product._id || product.id,
      title: product.title,
      price: product.price,
      points: product.points || product.point || 0,
      unit: product.unit || product.weight || "1 Pcs",
      image: product.image,
    });
  };

  const handleBuyNow = (product) => {
    const params = new URLSearchParams({
      id: product._id || product.id || "",
      title: product.title || "",
      price: product.price || 0,
      point: product.points || product.point || 0,
    });
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 font-sans text-gray-800">
      
      {/* Title Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
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
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filterCategories.map((cat, idx) => {
          const isActive = rawCategory.toLowerCase() === cat.slug.toLowerCase();
          return (
            <Link
              key={idx}
              href={cat.slug === "all" ? "/shop" : `/shop?category=${cat.slug}`}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl sm:rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-5">
          {filteredProducts.map((p) => {
            const prodId = p._id || p.id;
            const oldPrice = Number(p.discountPrice || p.originalPrice || 0);
            const sellPrice = Number(p.price || 0);
            const saveAmount = oldPrice > sellPrice ? oldPrice - sellPrice : 0;
            const pointsVal = Math.floor(Number(p.points || p.point || 0));

            return (
              <div
                key={prodId}
                className="bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 border border-gray-200 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* 🔴 SAVE Badge */}
                {saveAmount > 0 && (
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-rose-500 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs z-10 uppercase tracking-wider whitespace-nowrap">
                    SAVE ৳{saveAmount}
                  </span>
                )}

                <div>
                  {/* 🟢 Clickable Image */}
                  <Link
                    href={`/shop/${prodId}`}
                    className="w-full h-32 sm:h-48 bg-gray-50 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center p-2 mb-2 sm:mb-3 relative group-hover:bg-gray-100 transition-colors block"
                  >
                    <img
                      src={p.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"}
                      alt={p.title}
                      className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Title, Category & Unit */}
                  <div className="space-y-1 mb-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] sm:text-[10px] font-black text-[#00875A] uppercase tracking-wider truncate">
                        {p.category || "General"}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200 whitespace-nowrap shrink-0">
                        📦 {p.unit || p.weight || "1 Pcs"}
                      </span>
                    </div>

                    <Link href={`/shop/${prodId}`}>
                      <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate group-hover:text-[#00875A] hover:underline">
                        {p.title}
                      </h3>
                    </Link>
                  </div>
                </div>

                <div>
                  {/* Price (Left) & Points (Right) Row */}
                  <div className="pt-2 border-t border-gray-100 mb-2 flex items-center justify-between gap-1">
                    <div className="flex items-baseline gap-1 min-w-0">
                      <span className="text-sm sm:text-base font-black text-gray-900 whitespace-nowrap">
                        ৳{sellPrice}
                      </span>
                      {saveAmount > 0 && (
                        <span className="text-[10px] sm:text-[11px] text-gray-400 line-through font-bold whitespace-nowrap truncate">
                          ৳{oldPrice}
                        </span>
                      )}
                    </div>

                    <span className="text-[9px] sm:text-[11px] font-extrabold text-[#00875A] bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
                      +{pointsVal} Pts
                    </span>
                  </div>

                  {/* Single-Line Cart & Buy Now Buttons */}
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddToCartOnly(p)}
                      className="h-8 sm:h-10 px-1.5 bg-emerald-100 hover:bg-emerald-200 text-[#00875A] font-extrabold text-[10px] sm:text-xs rounded-lg sm:rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <span>🛒</span>
                      <span>Cart</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBuyNow(p)}
                      className="h-8 sm:h-10 px-1.5 bg-[#00875A] hover:bg-[#00704A] text-white font-black text-[10px] sm:text-xs rounded-lg sm:rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <span>⚡</span>
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
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