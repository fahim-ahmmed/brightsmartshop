"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/features/cart/use-cart";

export default function CartDrawer() {
  const { cartItems = [], cartTotal = 0, isCartOpen, closeCart, removeFromCart, updateQuantity } = useCart() || {};

  if (!isCartOpen) return null;

  // Calculate total reward points
  const totalPoints = cartItems.reduce((acc, item) => {
    const pointsPerItem = item.points || (item.price ? item.price * 0.05 : 0);
    return acc + pointsPerItem * (item.quantity || 1);
  }, 0);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Background Dark Overlay */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        {/* Slide-over Side Drawer Container */}
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
          
          {/* 1. Drawer Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest block">
                YOUR CART
              </span>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Shopping Cart ({cartItems.length})
              </h2>
            </div>
            
            <button
              onClick={closeCart}
              className="w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-all shadow-xs"
              aria-label="Close cart"
            >
              ✕
            </button>
          </div>

          {/* 2. Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-gray-100">
            {cartItems.length > 0 ? (
              cartItems.map((item) => {
                const itemPoints = item.points || (item.price ? item.price * 0.05 : 0);

                return (
                  <div key={item._id || item.slug} className="pt-4 first:pt-0 flex gap-4 items-center group">
                    {/* Item Image */}
                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src={item.image || "/hero1.jpg"}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                        {item.name}
                      </h4>
                      <div className="text-xs text-gray-500 font-medium">
                        ৳{item.price} each
                      </div>
                      <div className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md w-fit">
                        Point: {(itemPoints * item.quantity).toFixed(2)}
                      </div>

                      {/* Quantity Controls & Delete */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden text-xs">
                          <button
                            onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
                            className="px-2 py-1 hover:bg-gray-100 text-gray-600 font-bold"
                          >
                            -
                          </button>
                          <span className="px-3 font-bold text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="px-2 py-1 hover:bg-gray-100 text-gray-600 font-bold"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
                <div className="text-5xl">🛒</div>
                <h3 className="text-base font-bold text-gray-800">Your cart is empty</h3>
                <p className="text-xs text-gray-500 max-w-xs">
                  Looks like you haven't added any products to your shopping cart yet.
                </p>
                <button
                  onClick={closeCart}
                  className="mt-2 px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-700 transition-all"
                >
                  Start Shopping
                </button>
              </div>
            )}
          </div>

          {/* 3. Sticky Bottom Footer Summary & Checkout Button */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-gray-100 bg-white space-y-4 shadow-lg">
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Total Amount</span>
                  <span className="font-extrabold text-gray-900 text-base">
                    ৳{cartTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-purple-800 font-semibold">
                  <span>Total Points Earned</span>
                  <span>{totalPoints.toFixed(2)} Points</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-center font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <span>Checkout Now</span>
                  <span>→</span>
                </Link>
                
                <button
                  onClick={closeCart}
                  className="w-full py-2.5 text-center text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}