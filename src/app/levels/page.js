"use client";

import React, { useState, useEffect } from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function LevelsPage() {
  const [userLevelInfo, setUserLevelInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // ২৪ লেভেলের ডাটা (Package বাদ দিয়ে)
  const levelsData = [
    { level: 1, taka: "00", designation: "Preferred Customer" },
    { level: 2, taka: "03", designation: "" },
    { level: 3, taka: "04", designation: "" },
    { level: 4, taka: "08", designation: "" },
    { level: 5, taka: "15", designation: "General Customer" },
    { level: 6, taka: "32", designation: "" },
    { level: 7, taka: "60", designation: "" },
    { level: 8, taka: "100", designation: "" },
    { level: 9, taka: "250", designation: "" },
    { level: 10, taka: "510", designation: "Regular Customer" },
    { level: 11, taka: "1025", designation: "" },
    { level: 12, taka: "2050", designation: "" },
    { level: 13, taka: "4050", designation: "" },
    { level: 14, taka: "8200", designation: "" },
    { level: 15, taka: "16000", designation: "Special Customer" },
    { level: 16, taka: "30000", designation: "" },
    { level: 17, taka: "65000", designation: "Silver Customer" },
    { level: 18, taka: "100000", designation: "" },
    { level: 19, taka: "250000", designation: "Gold Customer" },
    { level: 20, taka: "350000", designation: "" },
    { level: 21, taka: "800000", designation: "Diamond Customer" },
    { level: 22, taka: "1500000", designation: "Platinum Customer" },
    { level: 23, taka: "2000000", designation: "Royel Customer" },
    { level: 24, taka: "5000000", designation: "Crown Customer" },
  ];

  useEffect(() => {
    async function fetchUserLevel() {
      try {
        const savedUser = localStorage.getItem("bright_user");
        if (!savedUser) {
          setLoading(false);
          return;
        }
        const user = JSON.parse(savedUser);
        const userId = user.id || user._id;

        const res = await fetch(`/api/levels?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUserLevelInfo(data);
        }
      } catch (err) {
        console.error("Level info fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserLevel();
  }, []);

  // লজিক অনুযায়ী ডিফল্ট লেভেল ০ থেকে শুরু হবে
  const currentLevel = userLevelInfo?.level !== undefined ? userLevelInfo.level : 0;
  const currentPackages = userLevelInfo?.totalAccumulatedPackages || 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto">
        
        {/* Header Title & Dynamic User Stats */}
        <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/60 shadow-lg space-y-4">
          <div>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              CUSTOMER BENEFIT PROGRAM
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              How Will Customers Benefits
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Earn level upgrades based on your own purchase points and unlock level-up cashback benefits.
            </p>
          </div>

          {/* Dynamic User Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/50 space-y-1">
              <p className="text-[11px] font-bold text-slate-400">বর্তমান লেভেল</p>
              <h3 className="text-2xl font-black text-emerald-400">Level {currentLevel}</h3>
            </div>
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/50 space-y-1">
              <p className="text-[11px] font-bold text-slate-400">মোট প্যাকেজ কাউন্ট</p>
              <h3 className="text-2xl font-black text-amber-400">{currentPackages} Pkg</h3>
            </div>
          </div>

          {/* Progress Bar Card */}
          <div className="pt-2 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-emerald-400">Current Level: Level {currentLevel}</span>
              <span className="text-slate-400">Total Packages: {currentPackages}</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((currentPackages / 100) * 100, 100)}%` }} 
              />
            </div>
          </div>
        </div>

        {/* 24 Level Table Structure (Package Column Removed) */}
        <div className="bg-slate-800/60 rounded-3xl border border-slate-700/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-950 text-slate-300 uppercase font-black tracking-wider text-[11px] border-b border-slate-700">
                  <th className="py-4 px-6">Level</th>
                  <th className="py-4 px-6">Taka (Cashback)</th>
                  <th className="py-4 px-6">Designation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {levelsData.map((row) => {
                  const isCurrent = row.level === currentLevel;
                  return (
                    <tr
                      key={row.level}
                      className={`transition-colors ${
                        isCurrent
                          ? "bg-emerald-950/60 text-emerald-300 font-bold border-l-4 border-l-emerald-400"
                          : "hover:bg-slate-800/80 text-slate-300"
                      }`}
                    >
                      <td className="py-3.5 px-6 font-bold">{row.level}</td>
                      <td className="py-3.5 px-6 font-extrabold text-emerald-400">৳ {row.taka}</td>
                      <td className="py-3.5 px-6 font-semibold">
                        {row.designation ? (
                          <span className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-xs text-amber-400 font-bold">
                            {row.designation}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}