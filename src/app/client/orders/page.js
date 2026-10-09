"use client";

import React from "react";
import Link from "next/link";
import Footer from "@/components/layout/Footer";

export default function MyOrdersPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-800 flex flex-col justify-between">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 w-full space-y-6">
        
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-black text-gray-900">📋 My Orders</h1>
          <p className="text-xs text-gray-500 mt-1">
            আপনার সকল অর্ডার ট্র্যাকিং এবং ডেলিভারি স্ট্যাটাস এখান থেকে দেখুন।
          </p>
        </div>

        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-4">
          <div className="text-5xl">🛍️</div>
          <h3 className="font-extrabold text-base text-gray-900">
            আপনি এখনও কোনো অর্ডার করেননি!
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            আপনার প্রয়োজনীয় জিনিসপত্র পছন্দ করতে শপ ভিজিট করুন।
          </p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 bg-[#00875A] text-white text-xs font-black rounded-xl"
          >
            শপিং শুরু করুন →
          </Link>
        </div>

      </main>
      <Footer />
    </div>
  );
}