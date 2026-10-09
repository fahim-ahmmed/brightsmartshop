"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";

// Fallback Demo Dataset
const FALLBACK_PRODUCTS = [
  { _id: "p1", title: "ACI Pure Rice 5kg", category: "Grocery", price: 195, originalPrice: 220, image: "🍚" },
  { _id: "p2", title: "Fresh Soybean Oil 1 Litre", category: "Grocery", price: 175, originalPrice: 190, image: "🍾" },
  { _id: "p3", title: "Men's Casual Cotton Shirt", category: "Fashion", price: 799, originalPrice: 999, image: "👔" },
  { _id: "p4", title: "Pond's Face Cream 50g", category: "Cosmetics", price: 255, originalPrice: 300, image: "🧴" },
  { _id: "p5", title: "Natural Herbal Face Wash", category: "Beauty Care", price: 280, originalPrice: 320, image: "🪷" },
  { _id: "p6", title: "Digital BP Monitor Machine", category: "Health & Medicine", price: 1850, originalPrice: 2100, image: "🩺" },
  { _id: "p7", title: "Wireless Bluetooth ANC Earbuds", category: "Electronics", price: 1650, originalPrice: 2000, image: "🎧" },
  { _id: "p8", title: "Non-Stick Cookware Granite Pan", category: "Home & Kitchen", price: 1250, originalPrice: 1500, image: "🍳" },
];

function ShopContent() {
  const searchParams = useSearchParams();
  const rawCat = searchParams ? searchParams.get("category") : null;
  
  // Safe Context Destructuring (Fixes TypeError)
  const cartContext = useCart();
  const addToCart = cartContext?.addToCart || (() => {});

  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);

  // Fetch from DB
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/admin/products");
        if (res.ok) {
          const json = await res.json();
          if (json?.products && Array.isArray(json.products) && json.products.length > 0) {
            setProducts(json.products);
          }
        }
      } catch (err) {
        console.warn("Using fallback product catalog:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const selectedCat = rawCat ? rawCat.toLowerCase().trim() : "all";

  const isMatch = (itemCat, targetCat) => {
    if (!itemCat) return false;
    const c = itemCat.toLowerCase();
    if (targetCat === "all") return true;
    if (targetCat === "grocery") return c.includes("grocery");
    if (targetCat === "fashion") return c.includes("fashion");
    if (targetCat === "cosmetics") return c.includes("cosmetics");
    if (targetCat === "beauty") return c.includes("beauty");
    if (targetCat === "health") return c.includes("health") || c.includes("medicine");
    if (targetCat === "electronics") return c.includes("electronics");
    if (targetCat === "kitchen") return c.includes("kitchen") || c.includes("home");
    if (targetCat === "offers") return true;
    return c === targetCat;
  };

  const filteredProducts = products.filter((p) => isMatch(p.category, selectedCat));

  const getTitle = () => {
    if (selectedCat === "grocery") return "Grocery & Food";
    if (selectedCat === "fashion") return "Clothing & Fashion";
    if (selectedCat === "cosmetics") return "Cosmetics";
    if (selectedCat === "beauty") return "Beauty Care";
    if (selectedCat === "health") return "Health & Medicine";
    if (selectedCat === "electronics") return "Electronics";
    if (selectedCat === "kitchen") return "Home & Kitchen";
    if (selectedCat === "offers") return "Special Offers";
    return "All Products";
  };

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 w-full space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <span className="text-[10px] font-black text-[#00875A] uppercase tracking-widest block">
            STORE CATALOG
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {getTitle()}
          </h1>
        </div>

        {/* Category Switcher Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none text-xs font-bold">
          <Link
            href="/shop"
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedCat === "all" ? "bg-[#00875A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </Link>
          <Link
            href="/shop?category=grocery"
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedCat === "grocery" ? "bg-[#00875A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🌾 Grocery
          </Link>

          <Link
            href="/shop?category=fashion"
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedCat === "fashion" ? "bg-[#00875A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            👕 Fashion
          </Link>

          <Link
            href="/shop?category=cosmetics"
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedCat === "cosmetics" ? "bg-[#00875A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🧴 Cosmetics
          </Link>

          <Link
            href="/shop?category=beauty"
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedCat === "beauty" ? "bg-[#00875A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🪷 Beauty Care
          </Link>

          <Link
            href="/shop?category=health"
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedCat === "health" ? "bg-[#00875A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            💊 Health
          </Link>

          <Link
            href="/shop?category=electronics"
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedCat === "electronics" ? "bg-[#00875A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📺 Electronics
          </Link>

          <Link
            href="/shop?category=kitchen"
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedCat === "kitchen" ? "bg-[#00875A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🍳 Kitchen
          </Link>
        </div>
      </div>

      {/* Product Display Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-gray-500">
          Loading catalog products...
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <div
              key={p._id || p.title}
              className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative group"
            >
              <span className="absolute top-4 right-4 bg-[#00875A] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                {p.category}
              </span>

              <div className="w-full h-40 bg-gray-50 rounded-2xl flex items-center justify-center text-6xl my-2 group-hover:scale-105 transition-transform">
                {p.image || "📦"}
              </div>

              <div className="space-y-1 my-2">
                <h3 className="font-black text-sm text-gray-900 leading-snug line-clamp-1">
                  {p.title}
                </h3>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-2">
                <div>
                  <div className="text-lg font-black text-gray-900">৳ {p.price}</div>
                  {p.originalPrice > 0 && (
                    <div className="text-xs text-gray-400 line-through">৳ {p.originalPrice}</div>
                  )}
                </div>

                <button
                  onClick={() =>
                    addToCart({
                      id: p._id || p.title,
                      title: p.title,
                      price: p.price,
                      points: 5,
                    })
                  }
                  className="px-4 py-2.5 bg-[#00875A] hover:bg-[#00704A] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  + Add
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-3">
          <div className="text-5xl">📦</div>
          <h3 className="font-extrabold text-base text-gray-900">
            এই ক্যাটাগরিতে বর্তমানে কোনো প্রোডাক্ট নেই।
          </h3>
          <Link href="/shop" className="text-xs font-bold text-[#00875A] hover:underline inline-block">
            সব প্রোডাক্ট দেখুন →
          </Link>
        </div>
      )}

    </main>
  );
}

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-800 flex flex-col justify-between">
      <Suspense fallback={<div className="p-8 text-xs font-bold">Loading shop...</div>}>
        <ShopContent />
      </Suspense>
      <Footer />
    </div>
  );
}