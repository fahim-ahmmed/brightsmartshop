"use client";

import React, { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    identifier: "", // মোবাইল নম্বর বা ইমেইল
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const inputVal = formData.identifier.trim();
    
    // যদি ইনপুট মোবাইল নম্বর হয়, তবে ভার্চুয়াল ইমেইল ফরম্যাট করবে; আর যদি ইমেইল হয় তবে সেটাই রাখবে
    const isEmail = inputVal.includes("@");
    const targetEmail = isEmail ? inputVal.toLowerCase() : `${inputVal}@brightsmartshop.local`;

    try {
      const { data, error } = await authClient.signIn.email({
        email: targetEmail,
        password: formData.password,
      });

      if (error) {
        setErrorMsg("⚠️ মোবাইল নম্বর/ইমেইল অথবা পাসওয়ার্ড সঠিক নয়!");
        setLoading(false);
      } else {
        if (data?.user) {
          localStorage.setItem("bright_user", JSON.stringify(data.user));
        }
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন।");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-gray-800">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-200/80 shadow-2xl space-y-6">
        
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <img
              src="/logo.jpg"
              alt="Bright Smart Shop Logo"
              className="h-10 sm:h-12 w-auto object-contain rounded-xl group-hover:scale-105 transition-transform"
            />
            <span className="font-serif font-black text-lg sm:text-2xl text-[#00875A] tracking-tight">
              Bright Smart Shop
            </span>
          </Link>


        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold p-3.5 rounded-2xl text-center shadow-2xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">
              মোবাইল নম্বর *
            </label>
            <input
              type="text"
              required
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              placeholder="017XXXXXXXX"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00875A] font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">
              পাসওয়ার্ড *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00875A] font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#00875A] hover:bg-[#00704A] text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer mt-2"
          >
            {loading ? "প্রসেস হচ্ছে..." : "লগইন করুন"}
          </button>
        </form>

        <div className="border-t border-gray-100 pt-4 text-center space-y-2 text-xs">
          <p className="text-gray-500 font-medium">
            অ্যাকাউন্ট নেই?{" "}
            <Link href="/register" className="font-black text-[#F25C05] hover:underline">
              নতুন অ্যাকাউন্ট তৈরি করুন
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}