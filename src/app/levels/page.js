"use client";

import React, { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { LEVEL_CONFIG } from "@/lib/level-config";

export default function LevelsPage() {
  const [stats, setStats] = useState({
    currentLevel: 0,
    mainLevel: 0,
    accumulatedPackages: 0,
    currentStepPackages: 0,
    nextLevelTarget: 3,
    isExtraStage: false,
    extraStepPackages: 0,
    extraNextLevelTarget: 10,
    extraPackagesNeeded: 10,
    totalPackages: 0,
    walletBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  const { data: session } = authClient?.useSession
    ? authClient.useSession()
    : { data: null };

  useEffect(() => {
    async function loadLevelStats() {
      try {
        const localUserRaw =
          typeof window !== "undefined" ? localStorage.getItem("bright_user") : null;
        const localUser = localUserRaw ? JSON.parse(localUserRaw) : null;

        const userId = session?.user?.id || localUser?._id || localUser?.id || "";
        const phone =
          session?.user?.mobile ||
          session?.user?.phone ||
          localUser?.mobile ||
          localUser?.phone ||
          "";
        const email = session?.user?.email || localUser?.email || "";

        const params = new URLSearchParams();
        if (userId) params.set("userId", userId);
        if (phone) params.set("phone", phone);
        if (email) params.set("email", email);

        const res = await fetch(`/api/client/dashboard-stats?${params.toString()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.stats) {
            setStats(json.stats);
          }
        }
      } catch (e) {
        console.error("Failed to fetch levels:", e);
      } finally {
        setLoading(false);
      }
    }
    loadLevelStats();
  }, [session]);

  const currentLevel = Number(stats.currentLevel || 0);
  const mainLevel = Number(stats.mainLevel ?? currentLevel);
  const networkPackages = Number(stats.accumulatedPackages || 0);
  const showExtra = Boolean(stats.isExtraStage || currentLevel >= 9 || mainLevel >= 9);

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col lg:flex-row text-gray-800 w-full">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1100px] w-full mx-auto space-y-6 overflow-x-hidden">
        <div className="bg-[#0F172A] text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          <div>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
              CUSTOMER BENEFIT PROGRAM
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              How Will Customers Benefit
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              লেভেল ৯ পর্যন্ত সমস্ত প্যাকেজ হিট করবে। লেভেল ৯ স্পর্শ করার পর ৫০% মেইন চেইনে (লেভেল ১ থেকে ২৪ পর্যন্ত) এবং ৫০% এক্সট্রা প্যাকেজ ফান্ডে যুক্ত হবে।
            </p>
          </div>

          <div className={`grid grid-cols-1 ${showExtra ? "sm:grid-cols-4" : "sm:grid-cols-3"} gap-4`}>
            <div className="bg-[#1E293B] border border-slate-700 p-5 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 block">আপনার বর্তমান লেভেল</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">
                {loading ? "..." : `Level ${currentLevel}`}
              </span>
            </div>

            <div className="bg-[#1E293B] border border-slate-700 p-5 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 block">
                মেইন চেইন ধাপে জমা
              </span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">
                {loading
                  ? "..."
                  : `${stats.currentStepPackages || 0} / ${stats.nextLevelTarget || 0} Pkg`}
              </span>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                মোট নেটওয়ার্ক সেল: {networkPackages} Pkg
              </span>
            </div>

            {showExtra && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl">
                <span className="text-xs font-bold text-amber-300 block">
                  এক্সট্রা প্যাকেজ (Extra Package)
                </span>
                <span className="text-2xl font-black text-amber-400 mt-1 block">
                  {loading
                    ? "..."
                    : `${stats.extraStepPackages || 0} / ${stats.extraNextLevelTarget || 10} Pkg`}
                </span>
                <span className="text-[10px] text-amber-200/80 font-bold block mt-0.5">
                  আরো লাগবে: {stats.extraPackagesNeeded || 0} টি
                </span>
              </div>
            )}

            <div className="bg-[#1E293B] border border-slate-700 p-5 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 block">আমার নিজস্ব প্যাকেজ আইডি (M+P)</span>
              <span className="text-2xl font-black text-sky-400 mt-1 block">
                {loading ? "..." : `${stats.totalPackages || 0} IDs`}
              </span>
            </div>
          </div>

          {/* Level Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase font-black text-[10px] border-b border-slate-800">
                  <th className="py-3.5 px-4 whitespace-nowrap">LEVEL</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">EXTRA PACKAGE (PER PERSON)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">TAKA (CASHBACK)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">DESIGNATION</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">INCENTIVE</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-[#0B132B]">
                {LEVEL_CONFIG.map((row) => {
                  const achieved = currentLevel >= row.level;
                  return (
                    <tr
                      key={row.level}
                      className={achieved ? "bg-emerald-500/10" : "hover:bg-slate-900/60"}
                    >
                      <td className="py-3.5 px-4 font-black text-white whitespace-nowrap">
                        Level {row.level}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                        {row.extraPackages > 0 ? (
                          <span className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] font-black">
                            +{row.extraPackages.toLocaleString()} Extra Pkg
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-400 whitespace-nowrap">
                        ৳ {row.taka.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block whitespace-nowrap px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black">
                          {row.designation}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-pink-400">
                        {row.incentive ? (
                          <span className="px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-[10px] font-black">
                            🎁 {row.incentive}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {achieved ? (
                          <span className="inline-block whitespace-nowrap px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black">
                            ✓ Achieved
                          </span>
                        ) : (
                          <span className="text-slate-500 font-bold text-[10px]">Locked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-xs text-emerald-300 font-bold text-center">
            📌 লেভেল ৯ পর্যন্ত সমস্ত প্যাকেজ হিট করবে, লেভেল ১০ থেকে প্রতিটি ম্যান আইডি এর আন্ডারে উপরে উল্লেখিত সিরিয়াল অনুযায়ী এক্সট্রা প্যাকেজ থাকবে এবং তার লেভেল কমপ্লিট হবে।
          </div>
        </div>
      </main>
    </div>
  );
}