"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product }) {
  const { addToCart, setIsCartOpen } = useCart() || {};

  const sellingPrice = product.price || product.sellingPrice || 0;
  const buyingPrice = product.buyingPrice || product.originalPrice || 0;
  
  // রিওয়ার্ড পয়েন্ট ক্যালকুলেশন লজিক: (sellingPrice - buyingPrice) / 2.25
  const calculatedPoints = buyingPrice > 0 
    ? Math.max(0, Math.round((sellingPrice - buyingPrice) / 2.25)) 
    : (product.rewardPoints || product.point || 0);

  const handleAddToCart = () => {
    if (addToCart) {
      addToCart({
        id: product._id || product.id,
        title: product.title,
        price: sellingPrice,
        image: product.image || product.images?.[0],
        points: calculatedPoints,
        quantity: 1,
      });
      if (setIsCartOpen) setIsCartOpen(true);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 border border-gray-200/80 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
      <div>
        <div className="flex items-center justify-between mb-2">
          {product.discount ? (
            <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-md">
              SAVE ৳{product.discount}
            </span>
          ) : (
            <span></span>
          )}
          {product.packageCount && (
            <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-200/60">
              {product.packageCount} Pcs
            </span>
          )}
        </div>

        <Link href={`/product/${product._id || product.id}`} className="block overflow-hidden rounded-2xl bg-gray-50 mb-3 aspect-square relative">
          <img
            src={product.image || product.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80"}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        <span className="text-[10px] font-extrabold text-[#00875A] uppercase tracking-wider block mb-1">
          {product.category || "General"}
        </span>
        <Link href={`/product/${product._id || product.id}`}>
          <h3 className="font-extrabold text-xs text-gray-900 line-clamp-1 hover:text-[#00875A] transition-colors mb-2">
            {product.title}
          </h3>
        </Link>
      </div>

      <div>
        {/* Price & Reward Points Row (প্রাইসের বামপাশে রিওয়ার্ড পয়েন্ট - শুধু সংখ্যা ও 'পয়েন্ট') */}
        <div className="pt-2 border-t border-gray-100 mb-3 flex items-center justify-between bg-gray-50/80 p-2 rounded-xl border border-gray-100">
          
          <div className="flex items-center gap-1 bg-amber-500/10 text-amber-700 px-2 py-1 rounded-lg border border-amber-500/20">
            <span className="text-xs font-black">+{calculatedPoints} পয়েন্ট</span>
          </div>

          <div className="text-right">
            <span className="text-xs font-black text-gray-900 block">
              ৳{sellingPrice}
            </span>
            {product.oldPrice && product.oldPrice > sellingPrice && (
              <span className="text-[10px] text-gray-400 line-through font-bold block">
                ৳{product.oldPrice}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={handleAddToCart}
            className="py-2.5 bg-emerald-100 hover:bg-emerald-200 text-[#00875A] font-extrabold text-[11px] rounded-xl transition-all cursor-pointer text-center"
          >
            🛒 Cart
          </button>
          <Link
            href="/checkout"
            onClick={handleAddToCart}
            className="py-2.5 bg-[#00875A] hover:bg-[#00704A] text-white font-black text-[11px] rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 text-center"
          >
            ⚡ Buy Now
          </Link>
        </div>
      </div>
    </div>
  );
}