"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useCart } from "@/context/CartContext";

export default function SiteHeader() {
  const router = useRouter();

  // Cart Context values
  const cartContext = useCart();
  const cartItems = cartContext?.cartItems || [];
  const totalItemsCount = cartContext?.totalItemsCount || 0;
  const totalAmount = cartContext?.totalAmount || 0;
  const removeFromCart = cartContext?.removeFromCart || (() => {});

  // Side Drawer Open/Close State
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Safe Session Retrieval
  const sessionResult = authClient?.useSession ? authClient.useSession() : {};
  const session = sessionResult?.data;
  const isPending = sessionResult?.isPending;

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const isLoggedIn = !isPending && !!session?.user;

  return (
    <>
      <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 shadow-2xs font-sans h-16 sm:h-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-3 sm:gap-6">
          
          {/* 1. Logo & Brand Title */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#00875A] text-white shadow-md shadow-emerald-700/20 flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
              <span className="font-black tracking-tighter text-lg sm:text-xl">
                b<span className="text-[#F25C05]">s</span>s
              </span>
            </div>
            <span className="font-serif font-black text-lg sm:text-2xl text-[#00875A] tracking-tight">
              Bright Smart Shop
            </span>
          </Link>

          {/* 2. Desktop Search Bar */}
          <form 
            onSubmit={handleSearch}
            className="flex-1 max-w-lg mx-2 hidden md:flex items-center bg-gray-50/80 border border-gray-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#00875A]/20 focus-within:border-[#00875A] transition-all shadow-2xs"
          >
            <div className="pl-4 text-[#00875A]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2.5 bg-transparent text-xs sm:text-sm text-gray-700 focus:outline-none placeholder:text-gray-400 font-medium"
            />
            <button
              type="submit"
              className="bg-[#00875A] hover:bg-[#00704A] text-white font-black text-xs px-6 py-2.5 transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* 3. Right Actions Area (Wishlist, Cart, Login, Register) */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Wishlist Button */}
            <Link
              href="/wishlist"
              className="relative flex items-center gap-2 px-3 py-2 rounded-2xl bg-rose-50/70 hover:bg-rose-100/80 text-rose-600 border border-rose-100 transition-all group cursor-pointer"
            >
              <div className="relative flex items-center justify-center">
                <span className="text-lg group-hover:scale-110 transition-transform">❤️</span>
                <span className="absolute -top-2.5 -right-2 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
                  0
                </span>
              </div>
              <span className="hidden xl:inline text-xs font-black tracking-tight">
                Wishlist
              </span>
            </Link>

            {/* Cart Trigger Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2.5 bg-emerald-50/80 hover:bg-emerald-100 text-[#00875A] px-3.5 py-2 rounded-2xl border border-emerald-200/60 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="relative flex items-center justify-center">
                <span className="text-lg group-hover:scale-110 transition-transform">🛒</span>
                <span className="absolute -top-2.5 -right-2.5 bg-[#F25C05] text-white text-[9px] font-black min-w-[18px] h-4.5 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
                  {totalItemsCount}
                </span>
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <span className="block text-gray-500 font-semibold text-[9px] uppercase tracking-wider">
                  {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
                </span>
                <span className="text-xs font-black text-gray-900">
                  ৳{totalAmount.toFixed(2)}
                </span>
              </div>
            </button>

            {/* Auth Buttons */}
            <div className="flex items-center gap-2 ml-1">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-[#00875A] hover:bg-[#00704A] text-white text-xs font-black rounded-2xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📊</span> 
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 border-2 border-gray-200 hover:border-[#00875A] text-gray-700 hover:text-[#00875A] text-xs font-extrabold rounded-2xl transition-all cursor-pointer bg-white"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-[#F25C05] hover:bg-[#D95000] text-white text-xs font-black rounded-2xl shadow-xs transition-all cursor-pointer"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* 4. SIDE DRAWER CART SLIDE-OVER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
              
              {/* Drawer Header */}
              <div className="p-6 bg-[#00875A] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛒</span>
                  <h2 className="text-lg font-black tracking-tight">Your Shopping Cart</h2>
                  <span className="bg-white/20 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {totalItemsCount}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.length > 0 ? (
                  cartItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 border border-gray-100 p-4 rounded-2xl shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl border border-gray-100">
                          {item.image || "📦"}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-gray-900 line-clamp-1">
                            {item.title}
                          </h4>
                          <span className="text-xs font-bold text-[#00875A]">
                            ৳ {item.price}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-rose-500 font-bold text-sm p-1 transition-colors cursor-pointer"
                        title="Remove Item"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 space-y-3">
                    <div className="text-5xl">🛍️</div>
                    <h3 className="font-extrabold text-sm text-gray-800">Your cart is empty</h3>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                      Explore our catalog and add items to your shopping cart!
                    </p>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
                  <div className="flex items-center justify-between text-sm font-black text-gray-900">
                    <span>Subtotal</span>
                    <span className="text-[#00875A] text-lg">৳ {totalAmount.toFixed(2)}</span>
                  </div>

                  <Link
                    href="/checkout"
                    onClick={() => setIsCartOpen(false)}
                    className="w-full py-3.5 bg-[#F25C05] hover:bg-[#D95000] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Proceed to Checkout</span>
                    <span>→</span>
                  </Link>

                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 text-center cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}