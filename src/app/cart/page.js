"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { cartItems, totalAmount, totalPoints, updateQuantity, removeFromCart, clearCart } = useCart();

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 font-sans text-gray-800">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <span className="text-xs font-black text-[#00875A] uppercase tracking-widest block">
            CHECKOUT READY
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Shopping Cart
          </h1>
        </div>
        {cartItems.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs font-extrabold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-all"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.length > 0 ? (
            cartItems.map((item) => {
              const itemPrice = Number(item.price || 0);
              const itemPoints = Number(item.points || item.point || item.rewardPoints || 0);
              const totalItemPoints = itemPoints * item.quantity;
              const totalItemPrice = itemPrice * item.quantity;

              return (
                <div
                  key={item.id || item._id}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Image & Title */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 p-2 flex items-center justify-center shrink-0">
                      <img
                        src={item.image || "/hero1.jpg"}
                        alt={item.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-sm text-gray-900 line-clamp-2">
                        {item.title}
                      </h3>
                      
                      {/* Price & Individual Points Row */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-black text-gray-900">
                          ৳{itemPrice}
                        </span>
                        
                        {itemPoints > 0 && (
                          <span className="text-[11px] font-bold text-gray-600">
                            (+{totalItemPoints} Points)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Delete Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    
                    {/* Quantity Selector */}
                    <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id || item._id, -1)}
                        className="w-7 h-7 flex items-center justify-center font-black text-gray-700 hover:bg-white rounded-lg transition-all"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id || item._id, 1)}
                        className="w-7 h-7 flex items-center justify-center font-black text-gray-700 hover:bg-white rounded-lg transition-all"
                      >
                        +
                      </button>
                    </div>

                    {/* Total Price for this item */}
                    <div className="text-right min-w-[70px]">
                      <span className="text-sm font-black text-[#00875A] block">
                        ৳{totalItemPrice}
                      </span>
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id || item._id)}
                      className="text-gray-400 hover:text-rose-600 p-1.5 transition-colors"
                      title="Remove Item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4">
              <div className="text-5xl">🛒</div>
              <h2 className="text-base font-extrabold text-gray-800">Your cart is empty</h2>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Looks like you haven't added any products to your cart yet.
              </p>
              <Link
                href="/shop"
                className="inline-block px-6 py-2.5 bg-[#00875A] hover:bg-[#00704A] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs"
              >
                Continue Shopping →
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary Card */}
        {cartItems.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-5 sticky top-24">
            <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs">
              
              {/* Total Amount Row */}
              <div className="flex justify-between items-center text-gray-700">
                <span className="font-bold">Total Amount</span>
                <span className="text-base font-black text-gray-900">
                  ৳{totalAmount}
                </span>
              </div>

              {/* Total Points Row */}
              <div className="flex justify-between items-center text-gray-700 pt-2 border-t border-gray-100">
                <span className="font-bold">Total Points Earned</span>
                <span className="text-xs font-bold text-gray-700">
                  +{totalPoints} Points
                </span>
              </div>

            </div>

            {/* Checkout Action Button */}
            <Link
              href="/checkout"
              className="block w-full py-3 bg-[#00875A] hover:bg-[#00704A] text-white font-black text-xs text-center rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98"
            >
              Continue to checkout →
            </Link>

            <p className="text-[10px] text-gray-400 text-center font-medium">
              🔒 Safe & Secure Checkout Guaranteed
            </p>
          </div>
        )}

      </div>
    </main>
  );
}