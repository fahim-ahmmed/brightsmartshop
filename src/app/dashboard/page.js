"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function ClientDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/client/dashboard-stats");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load dashboard statistics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm font-bold text-gray-600">
        Loading Client Dashboard...
      </div>
    );
  }

  const user = data?.user || {
    name: "Md Fahim Ahammad Shihab",
    id: "20260048",
    email: "fahim@example.com",
  };

  const stats = data?.stats || {
    currentLevel: 0,
    designation: "No Level",
    newPurchasersAfterMe: 0,
    nextLevelTarget: 2,
    walletBalance: 0,
    totalOrders: 0,
  };

  const categoryStats = data?.categoryStats || [
    { name: "Grocery & Daily Essentials", count: 1, color: "#3B82F6" },
    { name: "Beauty & Cosmetics", count: 2, color: "#EC4899" },
    { name: "Home & Kitchen", count: 2, color: "#10B981" },
    { name: "Fashion & Accessories", count: 0, color: "#F59E0B" },
    { name: "Health & Personal Care", count: 0, color: "#8B5CF6" },
    { name: "Baby Care", count: 1, color: "#EF4444" },
    { name: "Electronics & Gadgets", count: 0, color: "#06B6D4" },
    { name: "Dietary Supplement", count: 0, color: "#64748B" },
    { name: "Gifts & Package", count: 4, color: "#F97316" },
    { name: "Ready Service", count: 0, color: "#84CC16" },
  ];

  const totalProducts = categoryStats.reduce((sum, item) => sum + item.count, 0);

  // 8 Soft Pastel Cards (Exact style matching Screenshot 59)
  const statsCards = [
    { 
      label: "Total orders", 
      value: stats.totalOrders.toString(), 
      subtext: "All-time purchases", 
      icon: "📍", 
      bg: "bg-[#EBF5FF] text-sky-900 border-[#D6E8FF]" 
    },
    { 
      label: "Pending Point", 
      value: "0.00", 
      subtext: "60 points monthly target", 
      icon: "✦", 
      bg: "bg-[#FFF0E6] text-orange-900 border-[#FFE1D1]" 
    },
    { 
      label: "Total Package", 
      value: stats.totalOrders.toString(), 
      subtext: "Total packages", 
      icon: "✦", 
      bg: "bg-[#FFFBE6] text-amber-900 border-[#FFF5C2]" 
    },
    { 
      label: "Pending Level", 
      value: stats.newPurchasersAfterMe.toString(), 
      subtext: "New packages since last level", 
      icon: "👥", 
      bg: "bg-[#F3E8FF] text-purple-900 border-[#E9D5FF]" 
    },
    { 
      label: stats.designation ? stats.designation : "No Level", 
      value: `Level 0${stats.currentLevel}`, 
      subtext: `${stats.newPurchasersAfterMe} packages in network`, 
      icon: "✦", 
      bg: "bg-[#FFFBE6] text-amber-900 border-[#FFF5C2]" 
    },
    { 
      label: "Package points", 
      value: "0.00", 
      subtext: "0.0 points per package", 
      icon: "•", 
      bg: "bg-[#FFF0E6] text-orange-900 border-[#FFE1D1]" 
    },
    { 
      label: "Wallet balance", 
      value: `৳ ${stats.walletBalance.toFixed(2)}`, 
      subtext: "Level booster", 
      icon: "৳", 
      bg: "bg-[#F3E8FF] text-purple-900 border-[#E9D5FF]" 
    },
    { 
      label: "Total Sponsor", 
      value: "0", 
      subtext: "Direct sponsored member", 
      icon: "👁️", 
      bg: "bg-[#EBF5FF] text-sky-900 border-[#D6E8FF]" 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans flex flex-col lg:flex-row text-gray-800 w-full">
      
      {/* 1. Dynamic Responsive Sidebar */}
      <DashboardSidebar />

      {/* 2. Main Dashboard Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto overflow-x-hidden">
        
        {/* User Top Strip Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Welcome back to your Bright Smart Shop personal portal
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-2 select-none cursor-default">
              <span className="bg-emerald-500/80 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold text-emerald-100">
                Balance
              </span>
              <span className="text-sm">৳{stats.walletBalance.toFixed(2)}</span>
            </div>

            <Link
              href="/shop"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <span>Shop Now</span>
              <span>→</span>
            </Link>

            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                {user.name ? user.name[0] : "F"}
              </div>
              <div className="text-left leading-tight">
                <div className="text-sm font-bold text-gray-900">{user.name}</div>
                <div className="text-[11px] text-gray-500 font-medium">
                  {stats.designation || `Level ${stats.currentLevel}`} • ID: <span className="font-bold text-gray-700">{user.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Level Tracker Progress Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl border border-emerald-500/30 shadow-md space-y-3">
          <div className="flex justify-between items-center text-xs font-extrabold">
            <span className="text-emerald-400 uppercase tracking-widest">
              🎯 NEW PURCHASERS TRACKER (YOUR LEVEL {stats.currentLevel})
            </span>
            <span className="text-gray-300">
              Target: {stats.nextLevelTarget} Purchasers
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            আপনার কেনার পর ওয়েবসাইট থেকে নতুন <span className="text-emerald-400 font-black text-sm">{stats.newPurchasersAfterMe} জন</span> ক্রেতা কেনাকাটা করেছেন।
          </p>
          <div className="w-full h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (stats.newPurchasersAfterMe / (stats.nextLevelTarget || 1)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* 8 Soft Pastel Cards Grid (Exact matching Screenshot 59) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {statsCards.map((card, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-3xl border ${card.bg} transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative overflow-hidden flex flex-col justify-between min-h-[110px]`}
            >
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/40 pointer-events-none" />

              <div className="flex items-center gap-2 z-10">
                <span className="text-xs opacity-70 font-bold">{card.icon}</span>
                <span className="text-[11px] font-bold tracking-tight opacity-75">
                  {card.label}
                </span>
              </div>

              <div className="z-10 my-1">
                <div className="text-2xl font-black tracking-tight">
                  {card.value}
                </div>
              </div>

              <div className="text-[10px] opacity-70 font-medium z-10">
                {card.subtext}
              </div>
            </div>
          ))}
        </div>

        {/* Live Inventory Mix (Pie Chart) & Category Performance Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Box: Pie Chart & Category List */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">
                LIVE INVENTORY MIX
              </span>
              <h3 className="text-lg font-bold text-gray-900">Products by category</h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              <div 
                className="relative w-36 h-36 rounded-full flex-shrink-0 shadow-inner border-4 border-white"
                style={{
                  background: `conic-gradient(
                    #3B82F6 0% 10%, 
                    #EC4899 10% 30%, 
                    #10B981 30% 50%, 
                    #EF4444 50% 60%, 
                    #F97316 60% 100%
                  )`
                }}
              />

              <div className="space-y-1.5 w-full text-xs font-medium text-gray-600">
                {categoryStats.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="truncate max-w-[120px]">{item.name}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-bold">{item.count} products</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Box: Collection Overview Progress Bars */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">
                  CATEGORY PERFORMANCE
                </span>
                <h3 className="text-lg font-bold text-gray-900">Collection overview</h3>
              </div>
              <Link href="/categories" className="text-xs font-bold text-gray-800 hover:text-emerald-600 flex items-center gap-1">
                <span>View all</span>
                <span>→</span>
              </Link>
            </div>

            <div className="space-y-3.5 pt-1">
              {categoryStats.map((item, idx) => {
                const percentage = totalProducts > 0 ? (item.count / totalProducts) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                      <span>{item.name}</span>
                      <span className="text-gray-900 font-extrabold">{item.count}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.max(percentage, item.count > 0 ? 12 : 0)}%`,
                          backgroundColor: item.color 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ---------------- NEWLY ADDED SECTIONS BELOW ---------------- */}

        {/* Shortcuts, Recent Orders & Sponsor Network Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Recent Orders Box & Reward Status */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Purchase History / Recent Orders */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">
                    PURCHASE HISTORY
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">Recent orders</h3>
                </div>
                <Link href="/client/orders" className="text-xs font-bold text-emerald-600 hover:underline">
                  View all →
                </Link>
              </div>

              {stats.totalOrders > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                        <th className="py-2.5">Order ID</th>
                        <th className="py-2.5">Date</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      <tr>
                        <td className="py-3 font-mono font-bold text-gray-800">#BSS-2026-001</td>
                        <td className="py-3 text-gray-500">Oct 09, 2026</td>
                        <td className="py-3">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px]">
                            Delivered
                          </span>
                        </td>
                        <td className="py-3 text-right font-black text-gray-900">৳ 1,250.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center space-y-3">
                  <div className="text-3xl">✨</div>
                  <h4 className="font-bold text-gray-800 text-sm">Your order history is waiting.</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Discover something useful for your next purchase and start earning cashback points.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/shop"
                      className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-block"
                    >
                      Start shopping
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Reward Banner Card */}
            <div className="relative overflow-hidden bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2 max-w-md">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs">
                    YOUR REWARD ACCOUNT
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                    Small steps. <br /> Real rewards.
                  </h2>
                  <p className="text-xs text-orange-100 leading-relaxed">
                    Level cashback is added to your account as subsequent orders are completed in the shop.
                  </p>
                  <Link href="/levels" className="inline-block pt-2 text-xs font-bold underline text-white hover:text-orange-200">
                    View 24 Levels Breakdown →
                  </Link>
                </div>

                <div className="w-28 h-28 rounded-full border-4 border-white/30 bg-white/10 backdrop-blur-md flex flex-col items-center justify-center text-center p-2 shadow-inner">
                  <span className="text-2xl font-black">৳{stats.walletBalance.toFixed(0)}</span>
                  <span className="text-[9px] uppercase font-bold tracking-wider opacity-90">EARNED BONUSES</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Shortcuts Grid, My Sponsor List & Tip */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Action Shortcuts */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <div>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">
                  SHORTCUTS
                </span>
                <h3 className="text-lg font-bold text-gray-900">Make it quick</h3>
              </div>

              <div className="space-y-3">
                <Link href="/shop" className="p-3 bg-gray-50 hover:bg-emerald-50/60 rounded-2xl flex items-center justify-between transition-all group">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                      +
                    </span>
                    <div>
                      <h5 className="font-bold text-xs text-gray-800 group-hover:text-emerald-700">Shop Products</h5>
                      <p className="text-[10px] text-gray-500">Find your next favourite</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                </Link>

                <Link href="/client/withdraw" className="p-3 bg-gray-50 hover:bg-emerald-50/60 rounded-2xl flex items-center justify-between transition-all group">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs">
                      ✦
                    </span>
                    <div>
                      <h5 className="font-bold text-xs text-gray-800 group-hover:text-emerald-700">Withdraw Wallet</h5>
                      <p className="text-[10px] text-gray-500">bKash, Nagad or Bank transfer</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                </Link>

                <Link href="/levels" className="p-3 bg-gray-50 hover:bg-emerald-50/60 rounded-2xl flex items-center justify-between transition-all group">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                      ⟳
                    </span>
                    <div>
                      <h5 className="font-bold text-xs text-gray-800 group-hover:text-emerald-700">Level Progression</h5>
                      <p className="text-[10px] text-gray-500">Check designation & target</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>

            {/* My Sponsor List Network */}
            <div id="sponsor-list" className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <div>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">
                  MY NETWORK
                </span>
                <h3 className="text-lg font-bold text-gray-900">My Sponsor List</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                      <th className="py-2">SL</th>
                      <th className="py-2">ID</th>
                      <th className="py-2">NAME</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="3" className="py-6 text-center text-gray-400 text-xs italic">
                        No sponsored members yet.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tip Banner Card */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3 shadow-md">
              <span className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-black text-xs">
                ✦
              </span>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
                A LITTLE TIP
              </span>
              <h4 className="font-extrabold text-sm leading-snug">
                Every purchase brings you closer.
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Complete your profile details and address to speed up checkout.
              </p>
              <Link href="/client/account" className="inline-block text-xs font-bold text-amber-300 hover:underline pt-1">
                Complete profile →
              </Link>
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}