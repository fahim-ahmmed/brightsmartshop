"use client";

import React from "react";
import Link from "next/link";
import Footer from "@/components/layout/Footer";

export default function OffersPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-800 flex flex-col justify-between">
      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 w-full space-y-6">
        
        <div className="bg-gradient-to-r from-[#00875A] to-teal-800 text-white p-8 rounded-3xl shadow-lg space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full border border-white/30">
            🏷️ SPECIAL DISCOUNTS
          </span>
          <h1 className="text-2xl sm:text-4xl font-black">
            Mega Cashback Offers & Discounts
          </h1>
          <p className="text-xs text-emerald-100">
            প্রতিটি কেনাকাটায় পাবেন বিশেষ লেভেল রিওয়ার্ড পয়েন্ট এবং ক্যাশব্যাক বোনাস!
          </p>
        </div>

        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
          <p className="text-sm font-bold text-gray-700">
            বর্তমানে বিশেষ অফারের জন্য প্রোডাক্ট শো করতে নিচে ক্লিক করুন:
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-block px-6 py-3 bg-[#00875A] text-white text-xs font-black rounded-xl"
          >
            অফার প্রোডাক্টগুলো দেখুন →
          </Link>
        </div>

      </main>
      <Footer />
    </div>
  );
}