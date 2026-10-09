"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function ShopPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPermanentProducts() {
      try {
        const res = await fetch("/api/admin/products");
        if (res.ok) {
          const json = await res.json();
          if (json.products && json.products.length > 0) {
            setProducts(json.products);
          }
        }
      } catch (err) {
        console.error("Failed to load products from database:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPermanentProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-600">
        Loading Permanent Products Catalog...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans p-6 sm:p-10 max-w-[1400px] mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">
            STORE CATALOG
          </span>
          <h1 className="text-2xl font-black text-gray-900">
            All Permanent Products ({products.length})
          </h1>
        </div>
        <Link href="/" className="text-xs font-bold text-emerald-600 hover:underline">
          ← Back to Home
        </Link>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <div
            key={p._id || p.slug}
            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-full h-40 bg-gray-50 rounded-2xl flex items-center justify-center text-5xl">
                {p.image || "📦"}
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">
                {p.category}
              </span>
              <h3 className="font-extrabold text-sm text-gray-900 leading-snug">
                {p.title}
              </h3>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-4">
              <div>
                <div className="text-lg font-black text-gray-900">৳ {p.price}</div>
                <div className="text-[10px] text-amber-600 font-bold">
                  +{p.points || 0} Points
                </div>
              </div>
              <button
                onClick={() =>
                  addToCart({
                    id: p._id || p.slug,
                    title: p.title,
                    price: p.price,
                    points: p.points,
                  })
                }
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}