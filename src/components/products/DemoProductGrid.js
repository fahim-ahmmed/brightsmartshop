"use client";

import React from "react";
import { DEMO_PRODUCTS } from "@/data/demoProducts";
import { useCart } from "@/features/cart/use-cart";

export default function DemoProductGrid({ title = "Category Featured Products", showHeader = true }) {
  const { addToCart } = useCart();

  return (
    <section className="w-full space-y-6">
      {showHeader && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">
              CATEGORY WISE DEMO SHOWCASE
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {title}
            </h2>
          </div>
          <span className="text-xs font-bold text-gray-500 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-200">
            Showing 1 Demo Product Per Category
          </span>
        </div>
      )}

      {/* Responsive Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {DEMO_PRODUCTS.map((p) => (
          <div
            key={p.id}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
          >
            {/* Top Badges */}
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${p.color}`}>
                {p.badge}
              </span>

              {/* DEMO Tag */}
              <span className="bg-rose-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                DEMO
              </span>
            </div>

            {/* Icon / Image Display */}
            <div className="my-6 w-full h-44 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300">
              {p.icon}
            </div>

            {/* Title & Category Info */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                {p.category}
              </span>
              <h3 className="font-black text-sm text-gray-900 leading-snug line-clamp-2">
                {p.title}
              </h3>
            </div>

            {/* Bottom Price & Add to Cart Button */}
            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between gap-2">
              <div>
                <div className="text-lg font-black text-gray-900">
                  ৳ {p.price}
                </div>
                <div className="text-[10px] text-amber-600 font-extrabold flex items-center gap-1">
                  <span>✨</span>
                  <span>+{p.points} Cashback Pts</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  addToCart({
                    id: p.id,
                    title: p.title,
                    price: p.price,
                    points: p.points,
                  })
                }
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>+ Add</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}