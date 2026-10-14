"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("Admin"); // Admin, Sub-Admin
  const [identifier, setIdentifier] = useState(""); // ইমেইল বা মোবাইল নম্বর
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const inputVal = identifier.trim();
    const targetEmail = inputVal.includes("@")
      ? inputVal.toLowerCase()
      : `${inputVal}@brightsmartshop.local`;

    try {
      const res = await authClient.signIn.email({
        email: targetEmail,
        password: password,
      });

      if (res?.error) {
        setErrorMsg(res.error.message || "ইমেইল/মোবাইল বা পাসওয়ার্ড ভুল দেওয়া হয়েছে!");
        setLoading(false);
        return;
      }

      if (res?.data?.user) {
        localStorage.setItem("bright_user", JSON.stringify(res.data.user));
      }

      // পার্মানেন্ট লগইনের জন্য localStorage ও কুকি সেট করা হলো
      localStorage.setItem("admin_logged_in", "true");
      document.cookie = "admin_session=active; path=/; max-age=86400;";

      // 🟢 সফল লগইনের পর সরাসরি সিক্রেট এডমিন প্যানেলে রিডাইরেক্ট করবে
      window.location.href = "/219192026";
    } catch (err) {
      console.error("Admin Login Failed:", err);
      setErrorMsg("সার্ভারে সমস্যা হয়েছে! অনুগ্রহ করে আবার চেষ্টা করুন।");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 font-sans text-gray-100">
      <div className="w-full max-w-md bg-[#1E293B] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg">
            bss
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Portal Access</h1>
          <p className="text-xs text-slate-400">অ্যাডমিন প্যানেলে প্রবেশ করতে আপনার রোল সিলেক্ট করুন</p>
        </div>

        {/* Error Message Box */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold p-3 rounded-2xl text-center">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-[#0F172A] p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setRole("Admin")}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              role === "Admin" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            ⚙️ Admin
          </button>
          <button
            type="button"
            onClick={() => setRole("Sub-Admin")}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              role === "Sub-Admin" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            🛡️ Sub-Admin
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">ইমেইল বা মোবাইল নম্বর *</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@gmail.com অথবা 017XXXXXXXX"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">সিক্রেট পাসওয়ার্ড *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer mt-2"
          >
            {loading ? "ভেরিফাই হচ্ছে..." : `Sign In as ${role}`}
          </button>
        </form>

      </div>
    </div>
  );
}