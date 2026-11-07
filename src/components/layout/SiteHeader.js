"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useCart } from "@/context/CartContext";

const ensureBssId = (val) => {
  if (!val) return "";
  const s = String(val).trim();
  if (!s) return "";
  return s.toUpperCase().startsWith("BSS-") ? s.toUpperCase() : `BSS-${s}`;
};

export default function SiteHeader() {
  const router = useRouter();

  // Better Auth Live Session Hook
  const { data: session, isPending } = authClient?.useSession
    ? authClient.useSession()
    : { data: null, isPending: false };

  // Fallback LocalStorage State
  const [localUser, setLocalUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [displayUserId, setDisplayUserId] = useState("");
  const [displayUserName, setDisplayUserName] = useState("");
  const dropdownRef = useRef(null);

  // Sync with LocalStorage if available
  useEffect(() => {
    const updateUserFromStorage = () => {
      const savedUser = localStorage.getItem("bright_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setLocalUser(parsed);
          if (parsed?.referralCode || parsed?.id) {
            setDisplayUserId(ensureBssId(parsed.referralCode || parsed.id));
          }
          if (parsed?.name) {
            setDisplayUserName(parsed.name);
          }
        } catch (e) {
          console.error("User parse error", e);
        }
      } else {
        setLocalUser(null);
      }
    };

    updateUserFromStorage();
    window.addEventListener("storage", updateUserFromStorage);
    window.addEventListener("userUpdated", updateUserFromStorage);
    return () => {
      window.removeEventListener("storage", updateUserFromStorage);
      window.removeEventListener("userUpdated", updateUserFromStorage);
    };
  }, []);

  const currentUser = localUser || session?.user;

  useEffect(() => {
    async function loadUserId() {
      try {
        const uid = currentUser?._id || currentUser?.id || currentUser?.referralCode || "";
        const phone = currentUser?.mobile || currentUser?.phone || "";

        if (!uid && !phone) return;

        const params = new URLSearchParams();
        if (uid) params.set("userId", uid);
        if (phone) params.set("phone", phone);

        const res = await fetch(`/api/client/dashboard-stats?${params.toString()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.user?.id || data?.user?.referralCode) {
            const bssId = ensureBssId(data.user.referralCode || data.user.id);
            setDisplayUserId(bssId);
            if (data.user.name) setDisplayUserName(data.user.name);

            const savedRaw = localStorage.getItem("bright_user");
            const prevLocal = savedRaw ? JSON.parse(savedRaw) : {};
            const updatedLocal = {
              ...prevLocal,
              id: bssId,
              customerId: bssId,
              referralCode: bssId,
              name: data.user.name || prevLocal.name,
              profileImage: data.user.profileImage || prevLocal.profileImage,
            };
            localStorage.setItem("bright_user", JSON.stringify(updatedLocal));
          }
        }
      } catch (e) {
        console.error("Failed to fetch user ID:", e);
      }
    }

    if (currentUser) {
      loadUserId();
    }
  }, [currentUser?.id, currentUser?.mobile]);

  // 🟢 সব জায়গায় একই নাম এবং একই BSS- আইডি নিশ্চিত করা
  const finalUserId =
    ensureBssId(
      displayUserId ||
        currentUser?.referralCode ||
        localUser?.referralCode ||
        localUser?.id
    ) || "BSS-20260001";

  const finalUserName = displayUserName || currentUser?.name || "Customer";

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const {
    cartItems = [],
    totalItemsCount = 0,
    totalAmount = 0,
    removeFromCart = () => {},
    updateQuantity = () => {},
    isCartOpen = false,
    setIsCartOpen = () => {},
  } = useCart() || {};

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    try {
      if (authClient?.signOut) {
        await authClient.signOut();
      }
    } catch (e) {
      console.error("Better Auth logout error:", e);
    }
    localStorage.removeItem("bright_user");
    setLocalUser(null);
    window.location.href = "/";
  };

  const defaultHumanAvatar =
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80";

  const totalPoints = cartItems.reduce((acc, item) => {
    const pts = Number(item.points || item.point || item.rewardPoints || 0);
    return acc + pts * (item.quantity || 1);
  }, 0);

  return (
    <>
      <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 shadow-2xs font-sans h-16 sm:h-20">
        <div className="max-w-[1400px] mx-auto px-2 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-2 sm:gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 group">
            <img
              src="/logo.jpg"
              alt="Bright Smart Shop Logo"
              className="h-8 sm:h-12 w-auto object-contain rounded-xl group-hover:scale-105 transition-transform"
            />
            <span className="font-serif font-black text-sm sm:text-2xl text-[#00875A] tracking-tight truncate max-w-[110px] sm:max-w-none">
              Bright Smart Shop
            </span>
          </Link>

          {/* Search Bar */}
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

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-2xl bg-rose-50/70 hover:bg-rose-100/80 text-rose-600 border border-rose-100 transition-all group cursor-pointer"
            >
              <div className="relative flex items-center justify-center">
                <span className="text-base sm:text-lg group-hover:scale-110 transition-transform">❤️</span>
                <span className="absolute -top-2 -right-1.5 sm:-top-2.5 sm:-right-2 bg-rose-600 text-white text-[8px] sm:text-[9px] font-black w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
                  0
                </span>
              </div>
              <span className="hidden xl:inline text-xs font-black tracking-tight">
                Wishlist
              </span>
            </Link>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-1.5 sm:gap-2.5 bg-emerald-50/80 hover:bg-emerald-100 text-[#00875A] px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl border border-emerald-200/60 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="relative flex items-center justify-center">
                <span className="text-base sm:text-lg group-hover:scale-110 transition-transform">🛒</span>
                <span className="absolute -top-2 -right-1.5 sm:-top-2.5 sm:-right-2.5 bg-[#F25C05] text-white text-[8px] sm:text-[9px] font-black min-w-[16px] sm:min-w-[18px] h-3.5 sm:h-4.5 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
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

            {/* USER PROFILE AREA */}
            <div className="flex items-center gap-1 ml-0.5 sm:ml-1" ref={dropdownRef}>
              {isPending ? (
                <div className="text-xs font-bold text-[#00875A] animate-pulse px-1">
                  যাচাই হচ্ছে...
                </div>
              ) : currentUser ? (
                <div className="flex items-center gap-2.5 relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1 sm:gap-2 bg-gray-50 hover:bg-emerald-50/60 border border-gray-200 hover:border-emerald-300 p-1 pl-1.5 sm:pl-2 pr-2 sm:pr-2.5 rounded-2xl transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="relative">
                      <img
                        src={
                          currentUser.profileImage ||
                          currentUser.image ||
                          defaultHumanAvatar
                        }
                        alt={finalUserName}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover border border-emerald-500/30 group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>

                    <div className="hidden sm:block text-left leading-tight">
                      <span className="block text-xs font-black text-gray-900 max-w-[120px] truncate">
                        {finalUserName}
                      </span>
                      <span className="block text-[9px] font-mono font-bold text-[#00875A]">
                        {finalUserId}
                      </span>
                    </div>

                    <svg
                      className={`w-3 h-3 text-gray-400 group-hover:text-[#00875A] transform transition-transform ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
                        <p className="text-xs font-black text-gray-900 truncate">{finalUserName}</p>
                        <p className="text-[11px] text-emerald-700 font-mono font-bold truncate mt-0.5">
                          ID: {finalUserId}
                        </p>
                      </div>

                      <Link
                        href="/client/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-gray-700 hover:bg-emerald-50 hover:text-[#00875A] transition-colors"
                      >
                        <span>📊</span>
                        <span>My Dashboard</span>
                      </Link>

                      <Link
                        href="/client/account"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-gray-700 hover:bg-emerald-50 hover:text-[#00875A] transition-colors"
                      >
                        <span>👤</span>
                        <span>My Account</span>
                      </Link>

                      <Link
                        href="/client/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-gray-700 hover:bg-emerald-50 hover:text-[#00875A] transition-colors"
                      >
                        <span>📋</span>
                        <span>My Orders</span>
                      </Link>

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                      >
                        <span>🚪</span>
                        <span>Logout Account</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link
                    href="/login"
                    className="px-2.5 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-200 hover:border-[#00875A] text-gray-700 hover:text-[#00875A] text-[11px] sm:text-xs font-extrabold rounded-xl sm:rounded-2xl transition-all cursor-pointer bg-white"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#F25C05] hover:bg-[#D95000] text-white text-[11px] sm:text-xs font-black rounded-xl sm:rounded-2xl shadow-xs transition-all cursor-pointer"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 🛒 Side Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
              {/* Header */}
              <div className="p-6 bg-[#00875A] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛒</span>
                  <h2 className="text-lg font-black tracking-tight">Your Shopping Cart</h2>
                  <span className="bg-white/20 text-xs px-2.5 py-0.5 rounded-full font-bold">{totalItemsCount}</span>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-full bg-white/10 text-white font-bold text-lg cursor-pointer">✕</button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.length > 0 ? (
                  cartItems.map((item, idx) => {
                    const itemId = item._id || item.id;
                    const unitPoints = Number(item.points || item.point || item.rewardPoints || 0);
                    const itemTotalPoints = unitPoints * (item.quantity || 1);

                    return (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-100 p-4 rounded-2xl shadow-2xs gap-3">
                        {/* Image & Title/Price */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={item.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&q=80"}
                            alt={item.title}
                            className="w-12 h-12 rounded-xl object-cover bg-white border border-gray-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs text-gray-900 line-clamp-1">{item.title}</h4>
                            <span className="text-xs font-bold text-[#00875A] block">৳ {item.price}</span>
                          </div>
                        </div>

                        {/* Controls + Points Underneath */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-gray-200">
                              <button onClick={() => updateQuantity(itemId, -1)} className="text-xs font-black text-gray-600 px-1 cursor-pointer">-</button>
                              <span className="text-xs font-black text-gray-900">{item.quantity || 1}</span>
                              <button onClick={() => updateQuantity(itemId, 1)} className="text-xs font-black text-gray-600 px-1 cursor-pointer">+</button>
                            </div>
                            <button onClick={() => removeFromCart(itemId)} className="text-gray-400 hover:text-rose-500 font-bold text-sm p-1 cursor-pointer">🗑️</button>
                          </div>

                          <span className="text-[11px] font-bold text-[#00875A] text-center block">
                            +{itemTotalPoints} Points
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-20 space-y-3">
                    <div className="text-5xl">🛍️</div>
                    <h3 className="font-extrabold text-sm text-gray-800">Your cart is empty</h3>
                  </div>
                )}
              </div>

              {/* Footer Subtotal & Total Points */}
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
                  <div className="flex items-center justify-between text-sm font-black text-gray-900">
                    <div>
                      <span className="block">Subtotal</span>
                      <span className="text-xs font-extrabold text-[#00875A] block">
                        Total: +{totalPoints} Points
                      </span>
                    </div>
                    <span className="text-[#00875A] text-lg">৳ {totalAmount.toFixed(2)}</span>
                  </div>

                  <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="w-full py-3.5 bg-[#F25C05] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                    <span>Proceed to Checkout</span> <span>→</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}