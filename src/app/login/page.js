"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("Customer"); // Customer, Admin, Sub-Admin
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authClient?.signIn?.email) {
        await authClient.signIn.email({
          email,
          password,
        });
      }

      if (role === "Admin" || role === "Sub-Admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      console.error("Login failed", err);
      alert("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#1E293B] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg">
            bss
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-400">Select your account type to access panel</p>
        </div>

        {/* Role Selector Tabs (Customer, Admin, Sub-Admin) */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#0F172A] p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setRole("Customer")}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              role === "Customer" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setRole("Admin")}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              role === "Admin" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => setRole("Sub-Admin")}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              role === "Sub-Admin" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Sub-Admin
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            {loading ? "Signing in..." : `Sign In as ${role}`}
          </button>
        </form>

        {role === "Customer" && (
          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
            Don't have a customer account?{" "}
            <Link href="/register" className="text-emerald-400 font-bold hover:underline">
              Register here
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}