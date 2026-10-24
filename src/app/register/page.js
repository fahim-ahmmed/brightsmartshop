"use client";

import React, { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    sponsorId: "",
    name: "",
    mobile: "",
    address: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const cleanMobile = formData.mobile.trim();
    // মোবাইল নম্বর দিয়ে ইমেইল ফিল্ড অটো জেনারেট
    const generatedEmail = `${cleanMobile}@brightsmartshop.local`;

    try {
      const { data, error } = await authClient.signUp.email({
        email: generatedEmail,
        password: formData.password,
        name: formData.name,
        mobile: cleanMobile,
        address: formData.address,
        sponsorId: formData.sponsorId,
      });

      if (error) {
        setErrorMsg(error.message || "এই মোবাইল নম্বর দিয়ে আগেই অ্যাকাউন্ট করা রয়েছে!");
        setLoading(false);
      } else {
        alert("🎉 রেজিস্ট্রেশন সফল হয়েছে!");
        if (data?.user) {
          localStorage.setItem("bright_user", JSON.stringify(data.user));
        }
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Sign up error:", err);
      setErrorMsg("সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন।");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-10 font-sans text-gray-800">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-2xl space-y-6 relative overflow-hidden">
        
        <div className="text-center space-y-2 relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
           
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
            
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 pt-2 tracking-tight">
            নতুন অ্যাকাউন্ট তৈরি করুন
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            স্পন্সর আইডি ও আপনার সঠিক তথ্য দিয়ে রেজিস্ট্রেশন সম্পন্ন করুন
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold p-3.5 rounded-2xl text-center shadow-2xs">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs relative z-10">
         

          {/* Name & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-700 block mb-1">
                আপনার পূর্ণ নাম *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="আপনার নাম লিখুন"
                className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00875A]"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                মোবাইল নম্বর *
              </label>
              <input
                type="tel"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="017XXXXXXXX"
                className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00875A]"
              />
            </div>
          </div>

          {/* Password & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-700 block mb-1">
                পাসওয়ার্ড *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="•••••••• (সর্বনিম্ন ৮ অক্ষর)"
                className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00875A]"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                সম্পূর্ণ ঠিকানা *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="বাসা নং, রোড, থানা, জেলা..."
                className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00875A]"
              />
            </div>
             
          {/* Sponsor ID */}
          <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl space-y-1">
            <label className="font-black text-amber-900 block flex items-center gap-1.5 text-xs">
              <span>🤝 রেফার / স্পন্সর আইডি (Sponsor ID)</span>
            </label>
            <input
              type="text"
              value={formData.sponsorId}
              onChange={(e) => setFormData({ ...formData, sponsorId: e.target.value })}
              placeholder="উদাহরণ: BSS1024 (অপশনাল বা প্রয়োজনীয় আইডি)"
              className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#00875A]"
            />
          </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#F25C05] hover:bg-[#D95000] text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all cursor-pointer mt-3"
          >
            {loading ? "প্রসেস হচ্ছে..." : "🚀 রেজিস্টার সম্পূর্ণ করুন"}
          </button>
        </form>

        <div className="border-t border-gray-100 pt-4 text-center space-y-2 text-xs relative z-10">
          <p className="text-gray-500 font-medium">
            অলরেডি অ্যাকাউন্ট আছে?{" "}
            <Link href="/login" className="font-black text-[#00875A] hover:underline">
              লগইন করুন
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}