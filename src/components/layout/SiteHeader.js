"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/features/cart/use-cart";
import { authClient } from "@/lib/auth-client";

export default function SiteHeader() {
  const { cartItems = [], cartTotal = 0, openCart } = useCart() || {};
  const { data: session, isPending } = authClient.useSession();
  const status = isPending ? "loading" : session ? "authenticated" : "unauthenticated";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const totalQuantity = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const isLoggedIn = status === "authenticated" || !!session?.user;

  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 shadow-xs">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Navbar Row */}
        <div className="h-16 sm:h-20 flex items-center justify-between gap-3">
          
          {/* 1. Logo & Brand Title (Visible in ALL Screen Sizes) */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-emerald-100 shadow-xs flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-emerald-600 tracking-tighter text-lg sm:text-xl">
                b<span className="text-orange-500">s</span>s
              </span>
            </div>
            <span className="font-serif font-bold text-base sm:text-2xl text-emerald-800 tracking-tight">
              Bright Smart Shop
            </span>
          </Link>

          {/* 2. Desktop Search Bar */}
          <form 
            onSubmit={handleSearch}
            className="flex-1 max-w-md mx-4 hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-600 transition-all"
          >
            <div className="pl-4 text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-transparent text-sm text-gray-700 focus:outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 transition-colors"
            >
              Search
            </button>
          </form>

          {/* 3. Right Actions Area */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Mobile Search Toggle Icon */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-emerald-600 rounded-lg"
              aria-label="Toggle Search"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-gray-800">
              <Link href="/shop" className="hover:text-emerald-600 transition-colors">
                Shop
              </Link>
              <Link href="/categories" className="hover:text-emerald-600 transition-colors">
                Categories
              </Link>
              <Link href="/wishlist" className="hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>Wishlist</span>
              </Link>
            </nav>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-100 rounded-xl px-3 py-2 hover:bg-emerald-100/60 transition-all"
            >
              <div className="relative text-emerald-700">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </div>
              <div className="text-left text-xs leading-tight">
                <div className="font-bold text-gray-900 text-[11px] sm:text-xs">
                  {totalQuantity} items
                </div>
                <div className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold hidden sm:block">
                  ৳{cartTotal.toFixed(2)}
                </div>
              </div>
            </button>

            {/* Auth Buttons (Desktop) */}
            <div className="hidden lg:flex items-center gap-2">
              {isLoggedIn ? (
                /* Dashboard Button when Logged In */
                <Link
                  href="/admin/dashboard"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>📊</span> Dashboard
                </Link>
              ) : (
                /* Register & Log In Buttons when NOT Logged In */
                <>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all"
                  >
                    Register
                  </Link>
                  <Link
                    href="/login"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all"
                  >
                    Log In
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Toggle Mobile Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

          </div>

        </div>

        {/* 4. Expandable Mobile Search Bar */}
        {isMobileSearchOpen && (
          <div className="md:hidden pb-4 pt-1">
            <form onSubmit={handleSearch} className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-transparent text-gray-700 focus:outline-none"
                autoFocus
              />
              <button type="submit" className="bg-emerald-600 text-white text-xs font-bold px-4 py-2">
                Search
              </button>
            </form>
          </div>
        )}

        {/* 5. Mobile Dropdown Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4 space-y-3 animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col space-y-2 font-semibold text-sm text-gray-700">
              <Link 
                href="/shop" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 hover:bg-emerald-50 rounded-lg hover:text-emerald-600"
              >
                Shop
              </Link>
              <Link 
                href="/categories" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 hover:bg-emerald-50 rounded-lg hover:text-emerald-600"
              >
                Categories
              </Link>
              <Link 
                href="/wishlist" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 hover:bg-emerald-50 rounded-lg hover:text-emerald-600 flex items-center justify-between"
              >
                <span>Wishlist</span>
                <span className="text-emerald-600">❤️</span>
              </Link>
            </nav>

            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              {isLoggedIn ? (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center bg-emerald-700 text-white font-bold text-sm rounded-xl"
                >
                  📊 Go to Dashboard
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2.5 text-center bg-emerald-600 text-white font-bold text-xs rounded-xl"
                  >
                    Register
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2.5 text-center bg-orange-500 text-white font-bold text-xs rounded-xl"
                  >
                    Log In
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </header>
  );
}