"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Better Auth Sign-In Integration
      const { data, error: authError } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        throw new Error(authError.message || "Invalid credentials. Please try again.");
      }

      // Login successful -> Redirect directly to Home Page
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err.message || "Failed to log in. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/60 font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-10 space-y-6">
        
        {/* Header Title */}
        <div className="text-left space-y-1">
          <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest block">
            WELCOME BACK
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Log in to your account
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Enter your details below to access your Bright Smart Shop portal.
          </p>
        </div>

        {/* Error Alert Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl p-3.5 font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
              EMAIL ADDRESS *
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                PASSWORD *
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-semibold"
              >
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              required
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <span>Logging in...</span>
              ) : (
                <>
                  <span>Log In</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* Footer Register Link */}
        <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-medium">
            Don't have a client account?{" "}
            <Link
              href="/register"
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
            >
              Create Account
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}