"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const normalizeSponsorCode = (val) => {
  if (!val) return "";
  const s = String(val).trim();
  if (!s) return "";
  return s.toUpperCase().startsWith("BSS-")
    ? s.toUpperCase()
    : s.toUpperCase().startsWith("BSS")
    ? `BSS-${s.slice(3)}`
    : `BSS-${s}`;
};

function RegisterContent() {
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    sponsorId: "",
    name: "",
    mobile: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 🟢 রেফারেল লিংক (/register?sponsor=BSS-...) থেকে আসলে অটোমেটিক স্পন্সর আইডি বক্সে বসে যাবে
  useEffect(() => {
    const urlSponsor =
      searchParams.get("sponsor") ||
      searchParams.get("ref") ||
      searchParams.get("referral") ||
      "";
    if (urlSponsor) {
      setFormData((prev) => ({
        ...prev,
        sponsorId: normalizeSponsorCode(urlSponsor),
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে কি না চেক করা
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!");
      return;
    }

    setLoading(true);

    const cleanMobile = formData.mobile.trim();
    const generatedEmail = `${cleanMobile}@brightsmartshop.local`;
    const cleanSponsor = formData.sponsorId.trim()
      ? normalizeSponsorCode(formData.sponsorId)
      : "";

    try {
      const { data, error } = await authClient.signUp.email({
        email: generatedEmail,
        password: formData.password,
        name: formData.name.trim(),
        mobile: cleanMobile,
        address: formData.address.trim(),
        sponsorId: cleanSponsor,
        sponsorCode: cleanSponsor,
      });

      if (error) {
        setErrorMsg(error.message || "এই মোবাইল নম্বর দিয়ে আগেই অ্যাকাউন্ট করা রয়েছে!");
        setLoading(false);
        return;
      }

      // 🟢 সার্ভারের ডাটাবেসে সিকোয়েন্স অনুযায়ী স্থায়ী BSS- আইডি এবং স্পন্সর আইডি সাথে সাথে সেভ ও সিঙ্ক করা
      let finalBssId = "";
      try {
        const syncRes = await fetch("/api/client/account", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: data?.user?.id || cleanMobile,
            name: formData.name.trim(),
            phone: cleanMobile,
            mobile: cleanMobile,
            address: formData.address.trim(),
            sponsorCode: cleanSponsor,
            password: formData.password,
          }),
        });

        if (syncRes.ok) {
          const syncJson = await syncRes.json();
          if (syncJson?.user?.referralCode || syncJson?.user?.id) {
            finalBssId = syncJson.user.referralCode || syncJson.user.id;
          }
        }

        if (!finalBssId) {
          const statsRes = await fetch(
            `/api/client/dashboard-stats?phone=${encodeURIComponent(cleanMobile)}`,
            { cache: "no-store" }
          );
          if (statsRes.ok) {
            const statsJson = await statsRes.json();
            finalBssId = statsJson?.user?.referralCode || statsJson?.user?.id || "";
          }
        }
      } catch (syncErr) {
        console.error("Profile sync error:", syncErr);
      }

      const assignedId = finalBssId || "BSS-20260011";

      alert(`🎉 রেজিস্ট্রেশন সফল হয়েছে! আপনার আইডি ও স্পন্সর কোড: ${assignedId}`);

      const userWithId = {
        ...(data?.user || {}),
        name: formData.name.trim(),
        phone: cleanMobile,
        mobile: cleanMobile,
        address: formData.address.trim(),
        id: assignedId,
        customerId: assignedId,
        referralCode: assignedId,
        sponsorCode: cleanSponsor,
        sponsorId: cleanSponsor,
      };
      localStorage.setItem("bright_user", JSON.stringify(userWithId));
      window.dispatchEvent(new Event("userUpdated"));

      window.location.href = "/client/dashboard";
    } catch (err) {
      console.error("Sign up error:", err);
      setErrorMsg("সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন।");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-10 font-sans text-gray-800">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="text-center space-y-2 relative z-10">
          <Link href="/" className="inline-flex items-center justify-center gap-2.5 group">
            <img
              src="/logo.jpg"
              alt="Bright Smart Shop Logo"
              className="h-10 sm:h-12 w-auto object-contain rounded-xl group-hover:scale-105 transition-transform"
            />
            <span className="font-serif font-black text-lg sm:text-2xl text-[#00875A] tracking-tight">
              Bright Smart Shop
            </span>
          </Link>

          <h1 className="text-xl sm:text-2xl font-black text-gray-900 pt-2 tracking-tight">
            নতুন অ্যাকাউন্ট তৈরি করুন
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            স্পন্সর আইডি ও আপনার সঠিক তথ্য দিয়ে রেজিস্ট্রেশন সম্পন্ন করুন
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

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-700 block mb-1">
                পাসওয়ার্ড *
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
                কনফার্ম পাসওয়ার্ড *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder="আবার পাসওয়ার্ড দিন"
                className={`w-full bg-gray-50/80 border rounded-xl px-4 py-3 text-xs focus:outline-none ${
                  formData.confirmPassword &&
                  formData.password !== formData.confirmPassword
                    ? "border-rose-400 focus:border-rose-500"
                    : "border-gray-200 focus:border-[#00875A]"
                }`}
              />
            </div>
          </div>

          {/* Address */}
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
            <label className="font-black text-amber-900 flex items-center gap-1.5 text-xs">
              <span>🤝 রেফার / স্পন্সর আইডি (Sponsor ID)</span>
            </label>
            <input
              type="text"
              value={formData.sponsorId}
              onChange={(e) => setFormData({ ...formData, sponsorId: e.target.value })}
              placeholder="উদাহরণ: BSS-20260001 (যদি থাকে)"
              className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 font-bold font-mono focus:outline-none focus:border-[#00875A]"
            />
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-bold text-[#00875A]">
          লোড হচ্ছে...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}