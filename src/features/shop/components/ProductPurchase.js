"use client";

import React, { useState } from "react";
import { useCart } from "@/features/cart/use-cart";

export default function ProductPurchase({ product }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart() || {};

  const handleAddToCart = () => {
    if (addToCart) {
      addToCart({ ...product, quantity });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      
      {/* Product Image Section */}
      <div className="lg:col-span-6 space-y-4">
        <div className="relative w-full h-[320px] sm:h-[420px] bg-gray-50/80 border border-gray-100 rounded-2xl overflow-hidden flex items-center justify-center p-4 group">
          <img
            src={product.image || "/hero1.jpg"}
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
          {discountPercentage > 0 && (
            <span className="absolute top-4 left-4 bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-md">
              {discountPercentage}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Product Information & Purchase Area */}
      <div className="lg:col-span-6 space-y-6">
        
        {/* Category & Status */}
        <div className="flex items-center justify-between gap-4">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs uppercase tracking-wider rounded-lg border border-emerald-100">
            {product.category?.replace(/-/g, " ")}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50/80 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            In Stock
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
          {product.name}
        </h1>

        {/* Price Box */}
        <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex items-baseline gap-3">
          <span className="text-3xl sm:text-4xl font-black text-emerald-700">
            ৳{product.price}
          </span>
          {product.originalPrice && (
            <span className="text-lg text-gray-400 line-through font-medium">
              ৳{product.originalPrice}
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-100 ml-auto">
              Save ৳{product.originalPrice - product.price}
            </span>
          )}
        </div>

        {/* Short Summary */}
        <p className="text-sm text-gray-600 leading-relaxed">
          {product.description || "Enjoy fresh, organic, and quality guaranteed products delivered directly from Bright Smart Shop to your doorstep."}
        </p>

        {/* Quantity Controls & Add to Cart */}
        <div className="space-y-4 pt-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            Quantity
          </label>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center border border-gray-200 rounded-2xl bg-white w-fit shadow-sm">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="px-4 py-3 text-gray-600 hover:text-emerald-600 font-bold text-lg hover:bg-gray-50 rounded-l-2xl transition-colors"
              >
                -
              </button>
              <span className="px-5 font-bold text-gray-800 text-base">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((prev) => prev + 1)}
                className="px-4 py-3 text-gray-600 hover:text-emerald-600 font-bold text-lg hover:bg-gray-50 rounded-r-2xl transition-colors"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className={`flex-1 py-3.5 px-8 text-white font-bold text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 ${
                added
                  ? "bg-emerald-800 scale-98"
                  : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:scale-[1.01]"
              }`}
            >
              <span>🛒</span>
              <span>{added ? "Added to Cart!" : "Add to Cart"}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}