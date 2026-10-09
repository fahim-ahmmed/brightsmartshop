"use client";

import React, { useState } from "react";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";

export default function WishlistPage() {
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState("wishlist"); // 'wishlist' | 'request'

  // Saved Wishlist Items (Sample Data)
  const [wishlistItems, setWishlistItems] = useState([
    {
      id: "wish-1",
      title: "Premium Organic Mustard Oil (1 Litre)",
      price: 320,
      points: 5.0,
      category: "Grocery & Daily Essentials",
      icon: "🍾",
    },
    {
      id: "demo-7",
      title: "Wireless ANC Bluetooth Noise Canceling Earbuds",
      price: 1650,
      points: 20.0,
      category: "Electronics & Gadgets",
      icon: "🎧",
    },
  ]);

  // Request Product Form State
  const [requestData, setRequestData] = useState({
    productName: "",
    category: "Grocery & Daily Essentials",
    estimatedBudget: "",
    description: "",
    contactNumber: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleRemoveWishlist = (id) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/client/product-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "আবেদন জমা দেওয়া যায়নি।");
      }

      setMessage({
        type: "success",
        text: "আপনার পণ্যের আবেদনটি সফলভাবে অ্যাডমিন প্যানেলে পাঠানো হয়েছে! ধন্যবাদ।",
      });

      // Reset Form
      setRequestData({
        productName: "",
        category: "Grocery & Daily Essentials",
        estimatedBudget: "",
        description: "",
        contactNumber: "",
      });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "একটি ত্রুটি ঘটেছে।" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans flex flex-col justify-between text-gray-800">
      
      {/* Header Bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-md">
              bss
            </div>
            <span className="font-serif font-black text-xl text-gray-900 tracking-tight">
              Bright Smart Shop
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-bold text-gray-700">
            <Link href="/" className="hover:text-emerald-600">Home</Link>
            <Link href="/shop" className="hover:text-emerald-600">Shop Products</Link>
            <Link href="/levels" className="hover:text-emerald-600">24 Level Benefits</Link>
            <Link href="/dashboard" className="hover:text-emerald-600">Dashboard</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all"
            >
              My Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 w-full">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-8 rounded-3xl border border-emerald-500/20 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
              WISHLIST & REQUEST PORTAL
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">
              পছন্দের তালিকা ও নতুন পণ্যের আবেদন
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              পছন্দের প্রোডাক্ট সেভ করে রাখুন অথবা শপে না থাকা প্রোডাক্টের জন্য অ্যাডমিনের কাছে আবেদন জানান।
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/80 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("wishlist")}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "wishlist"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              💖 My Wishlist ({wishlistItems.length})
            </button>
            <button
              onClick={() => setActiveTab("request")}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "request"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📝 Request Product
            </button>
          </div>
        </div>

        {/* Status Message */}
        {message.text && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
              message.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            <span>{message.type === "success" ? "✅" : "⚠️"}</span>
            <span>{message.text}</span>
          </div>
        )}

        {/* ---------------- TAB 1: WISHLIST ITEMS ---------------- */}
        {activeTab === "wishlist" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {wishlistItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative"
                  >
                    <button
                      onClick={() => handleRemoveWishlist(item.id)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                      title="Remove from Wishlist"
                    >
                      ✕
                    </button>

                    <div className="space-y-3">
                      <div className="w-full h-36 bg-gray-50 rounded-2xl flex items-center justify-center text-5xl">
                        {item.icon}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        {item.category}
                      </span>
                      <h3 className="font-extrabold text-sm text-gray-900 leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="text-lg font-black text-gray-900">
                          ৳ {item.price}
                        </div>
                        <div className="text-[10px] text-amber-600 font-bold">
                          +{item.points} Points
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          addToCart({
                            id: item.id,
                            title: item.title,
                            price: item.price,
                            points: item.points,
                          })
                        }
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>🛒 Add to Cart</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-3">
                <div className="text-4xl">💔</div>
                <h3 className="font-extrabold text-base text-gray-900">
                  আপনার উইশলিস্ট খালি!
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  পছন্দের প্রোডাক্টগুলো সেভ করে রাখতে শপ ঘুরে প্রোডাক্ট পছন্দ করুন।
                </p>
                <div className="pt-2">
                  <Link
                    href="/shop"
                    className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl inline-block"
                  >
                    শপে যান →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 2: REQUEST PRODUCT FORM ---------------- */}
        {activeTab === "request" && (
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-100 shadow-2xs space-y-6 max-w-2xl mx-auto animate-in fade-in duration-200">
            <div className="border-b border-gray-100 pb-4">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">
                CUSTOM DEMAND
              </span>
              <h2 className="text-xl font-black text-gray-900">
                নতুন প্রোডাক্টের আবেদন করুন
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                যে প্রোডাক্টটি শপে খুঁজে পাচ্ছেন না, সেটির বিবরণ জমা দিন। আমাদের অ্যাডমিন টিম পর্যালোচনা করে দ্রুত শপে যোগ করবে।
              </p>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  পণ্যের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: Nestle Nido Fortified Milk Powder 1kg"
                  value={requestData.productName}
                  onChange={(e) =>
                    setRequestData({ ...requestData, productName: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    ক্যাটাগরি *
                  </label>
                  <select
                    value={requestData.category}
                    onChange={(e) =>
                      setRequestData({ ...requestData, category: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="Grocery & Daily Essentials">Grocery & Daily Essentials</option>
                    <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                    <option value="Home & Kitchen">Home & Kitchen</option>
                    <option value="Fashion & Accessories">Fashion & Accessories</option>
                    <option value="Health & Personal Care">Health & Personal Care</option>
                    <option value="Baby Care">Baby Care</option>
                    <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                    <option value="Dietary Supplement">Dietary Supplement</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    আনুমানিক বাজেট (৳)
                  </label>
                  <input
                    type="number"
                    placeholder="যেমন: 850"
                    value={requestData.estimatedBudget}
                    onChange={(e) =>
                      setRequestData({ ...requestData, estimatedBudget: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  যোগাযোগের মোবাইল নম্বর *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="যেমন: 017XXXXXXXX"
                  value={requestData.contactNumber}
                  onChange={(e) =>
                    setRequestData({ ...requestData, contactNumber: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  পণ্যের বিবরণ/লিংক (ঐচ্ছিক)
                </label>
                <textarea
                  rows={3}
                  placeholder="পণ্যটির সাইজ, ব্র্যান্ড বা অন্য কোনো বিবরণ সংক্ষেপে লিখুন..."
                  value={requestData.description}
                  onChange={(e) =>
                    setRequestData({ ...requestData, description: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? "আবেদন পাঠানো হচ্ছে..." : "আবেদন জমা দিন →"}
              </button>
            </form>
          </div>
        )}

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}