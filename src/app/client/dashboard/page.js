"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function ClientDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastFetchKeyRef = useRef(null);

  // Better Auth Live Session Hook
  const { data: session } = authClient?.useSession
    ? authClient.useSession()
    : { data: null };

  useEffect(() => {
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

    // 🟢 একই ইউজারের জন্য দুইবার ফেচ করা বন্ধ (সেশন পরে লোড হলেও আবার ফেচ হবে না)
    const fetchKey = userId || "anon";
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;

    // 🟢 আগে দেখা তথ্য সাথে সাথে দেখানো (এই ট্যাবের সেশনে), নতুন তথ্য এলে বদলে যাবে
    const cacheKey = userId ? `bss_dash_${userId}` : "";
    if (cacheKey) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          setData(JSON.parse(cached));
          setLoading(false);
        }
      } catch (e) {}
    }

    async function fetchStats() {
      try {
        const params = new URLSearchParams();
        if (userId) params.set("userId", userId);
        if (phone) params.set("phone", phone);
        if (email) params.set("email", email);

        const res = await fetch(`/api/client/dashboard-stats?${params.toString()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (cacheKey) {
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(json));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard statistics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [session]);

  const localUserRaw =
    typeof window !== "undefined" ? localStorage.getItem("bright_user") : null;
  const localUser = localUserRaw ? JSON.parse(localUserRaw) : null;

  // 🟢 ব্যাকএন্ডের পার্মানেন্ট আইডিকে সর্বোচ্চ অগ্রাধিকার দেওয়া হয়েছে
  const user = {
    name:
      data?.user?.name ||
      session?.user?.name ||
      localUser?.name ||
      "Md Fahim Ahammad Shihab",
    id: data?.user?.id || localUser?.referralCode || localUser?.id || "20260048",
    email:
      data?.user?.email ||
      session?.user?.email ||
      localUser?.email ||
      "fahim@example.com",
    avatar:
      data?.user?.profileImage ||
      session?.user?.image ||
      localUser?.profileImage ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80",
  };

  const stats = data?.stats || {
    currentLevel: 0,
    designation: "No Level",
    newPurchasersAfterMe: 0,
    accumulatedPackages: 0,
    walletBalance: 0,
    totalOrders: 0,
    reservePoints: 0,
    pointsNeededForNextPackage: 40,
    totalPackages: 0,
    totalSponsors: 0,
  };

  const myChainNodes = data?.myChainNodes || [];
  const recentOrders = data?.recentOrders || [];

  const levelRequirements = [
    { level: 1, required: 3, designation: "Preferred Customer" },
    { level: 2, required: 5, designation: "Preferred Customer" },
    { level: 3, required: 9, designation: "Preferred Customer" },
    { level: 4, required: 16, designation: "Preferred Customer" },
    { level: 5, required: 33, designation: "General Customer" },
    { level: 6, required: 65, designation: "General Customer" },
    { level: 7, required: 129, designation: "General Customer" },
    { level: 8, required: 257, designation: "General Customer" },
    { level: 9, required: 513, designation: "General Customer" },
    { level: 10, required: 1025, designation: "Regular Customer" },
    { level: 11, required: 2049, designation: "Regular Customer" },
    { level: 12, required: 4097, designation: "Regular Customer" },
    { level: 13, required: 8193, designation: "Regular Customer" },
    { level: 14, required: 16385, designation: "Regular Customer" },
    { level: 15, required: 32769, designation: "Special Customer" },
    { level: 16, required: 65537, designation: "Special Customer" },
    { level: 17, required: 131073, designation: "Silver Customer" },
    { level: 18, required: 262145, designation: "Silver Customer" },
    { level: 19, required: 524289, designation: "Gold Customer" },
    { level: 20, required: 1048577, designation: "Gold Customer" },
    { level: 21, required: 2097153, designation: "Diamond Customer" },
    { level: 22, required: 4194305, designation: "Platinum Customer" },
    { level: 23, required: 8388609, designation: "Royal Customer" },
    { level: 24, required: 16777217, designation: "Crown Customer" },
  ];

  const totalPackagesAfterMe =
    stats.accumulatedPackages !== undefined
      ? stats.accumulatedPackages
      : Math.floor((stats.newPurchasersAfterMe || 0) / 40);

  // প্যাকেজ সংখ্যা অনুযায়ী সঠিক বর্তমান লেভেল ও পরবর্তী টার্গেট নির্ধারণ
  let calculatedLevel = 0;
  let currentDesignation = "New Member";
  for (const row of levelRequirements) {
    if (totalPackagesAfterMe >= row.required) {
      calculatedLevel = row.level;
      currentDesignation = row.designation;
    } else {
      break;
    }
  }

  const currentLevel = Math.max(Number(stats.currentLevel || 0), calculatedLevel);
  const nextLevelObj =
    levelRequirements.find((r) => r.level === currentLevel + 1) ||
    levelRequirements[levelRequirements.length - 1];
  const nextLevelTargetPackages = nextLevelObj.required;

  const reservePoints = Number(stats.reservePoints || 0);
  const pointsNeeded = 40 - (reservePoints % 40);
  const reserveProgressPercent = Math.min(100, ((reservePoints % 40) / 40) * 100);

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

  const statsCards = [
    {
      label: "Reserve Points",
      value: `${reservePoints} Pts`,
      subtext: `আর ${pointsNeeded} পয়েন্ট হলেই নতুন প্যাকেজ আইডি`,
      icon: "💎",
      bg: "bg-[#ECFDF5] text-emerald-900 border-[#A7F3D0]",
    },
    {
      label: "Total Package (IDs)",
      value: (myChainNodes.length || stats.totalPackages || 0).toString(),
      subtext: "40 Pts = 1 Package ID",
      icon: "✦",
      bg: "bg-[#FFFBE6] text-amber-900 border-[#FFF5C2]",
    },
    {
      label: "Total orders",
      value: (stats.totalOrders || 0).toString(),
      subtext: "All-time purchases",
      icon: "📍",
      bg: "bg-[#EBF5FF] text-sky-900 border-[#D6E8FF]",
    },
    {
      label: "Network Packages",
      value: totalPackagesAfterMe.toString(),
      subtext: `Target: ${nextLevelTargetPackages} Packages (for Level ${Math.min(24, currentLevel + 1)})`,
      icon: "👥",
      bg: "bg-[#F3E8FF] text-purple-900 border-[#E9D5FF]",
    },
    {
      label: currentDesignation,
      value: `Level ${currentLevel < 10 ? `0${currentLevel}` : currentLevel}`,
      subtext: `${totalPackagesAfterMe} packages in network`,
      icon: "🏆",
      bg: "bg-[#FFFBE6] text-amber-900 border-[#FFF5C2]",
    },
    {
      label: "Wallet balance",
      value: `৳ ${Number(stats.walletBalance || 0).toFixed(2)}`,
      subtext: "Level cashback earnings",
      icon: "৳",
      bg: "bg-[#F3E8FF] text-purple-900 border-[#E9D5FF]",
    },
    {
      label: "Total Sponsor",
      value: (stats.totalSponsors || 0).toString(),
      subtext: "Direct sponsored member",
      icon: "👁️",
      bg: "bg-[#EBF5FF] text-sky-900 border-[#D6E8FF]",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-xs font-black text-[#00875A] animate-pulse">
        Loading Client Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans flex flex-col lg:flex-row text-gray-800 w-full">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto overflow-x-hidden">
        {/* User Top Strip Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Welcome back to your Bright Smart Shop personal portal
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 font-black text-xs rounded-xl flex items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold text-emerald-700">
                💎 Reserve:
              </span>
              <span className="text-sm text-[#00875A]">{reservePoints} / 40 Pts</span>
            </div>

            <div className="px-4 py-2.5 bg-[#00875A] text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-2 select-none cursor-default">
              <span className="bg-emerald-700/80 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold text-emerald-100">
                Balance
              </span>
              <span className="text-sm">৳{Number(stats.walletBalance || 0).toFixed(2)}</span>
            </div>

            <Link
              href="/shop"
              className="px-5 py-2.5 bg-[#00875A] hover:bg-[#00704A] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Shop Now</span>
              <span>→</span>
            </Link>

            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#00875A] shadow-xs"
              />
              <div className="text-left leading-tight">
                <div className="text-sm font-bold text-gray-900">{user.name}</div>
                <div className="text-[11px] text-gray-500 font-medium">
                  {currentDesignation} (Level {currentLevel})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reserve Points & Level Tracker Dual Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-6 rounded-3xl border border-emerald-400/30 shadow-md space-y-3">
            <div className="flex justify-between items-center text-xs font-extrabold">
              <span className="text-emerald-300 uppercase tracking-widest">
                💎 RESERVE POINTS (রিজার্ভ পয়েন্ট)
              </span>
              <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3 py-1 rounded-full">
                {reservePoints} / 40 Points
              </span>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              আপনার রিজার্ভে বর্তমানে{" "}
              <span className="text-amber-300 font-black text-sm">{reservePoints} পয়েন্ট</span>{" "}
              জমা আছে। আর মাত্র{" "}
              <span className="text-white font-black underline">{pointsNeeded} পয়েন্ট</span>{" "}
              হলেই স্বয়ংক্রিয়ভাবে ১টি নতুন প্যাকেজ আইডি (Man/Product ID) তৈরি হয়ে চেইনে যুক্ত হবে!
            </p>
            <div className="w-full h-3 bg-slate-950/70 rounded-full border border-emerald-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${reserveProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl border border-emerald-500/30 shadow-md space-y-3">
            <div className="flex justify-between items-center text-xs font-extrabold">
              <span className="text-emerald-400 uppercase tracking-widest">
                🎯 NEW PACKAGES TRACKER (YOUR LEVEL {currentLevel})
              </span>
              <span className="text-gray-300">
                Target: {nextLevelTargetPackages} Packages
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              আপনার মেইন আইডির পর ওয়েবসাইট থেকে নতুন{" "}
              <span className="text-emerald-400 font-black text-sm">
                {totalPackagesAfterMe} টি
              </span>{" "}
              প্যাকেজ কেনাকাটা হয়েছে।
            </p>
            <div className="w-full h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (totalPackagesAfterMe / (nextLevelTargetPackages || 1)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
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
                <div className="text-2xl font-black tracking-tight">{card.value}</div>
              </div>

              <div className="text-[10px] opacity-70 font-medium z-10">{card.subtext}</div>
            </div>
          ))}
        </div>

        {/* Chain Nodes List */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <span className="text-[10px] font-black text-[#00875A] uppercase tracking-widest block">
                GLOBAL CHAIN ACCOUNTS (40 PTS = 1 ID)
              </span>
              <h3 className="text-lg font-bold text-gray-900">
                আমার মেইন আইডি ও প্রোডাক্ট আইডি তালিকা ({myChainNodes.length} টি)
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              রিজার্ভ জমা: {reservePoints} Pts (আর {pointsNeeded} Pts হলে নতুন আইডি)
            </span>
          </div>

          {myChainNodes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {myChainNodes.map((node, index) => (
                <div
                  key={node._id || index}
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    node.isManId
                      ? "bg-emerald-50/70 border-emerald-300"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                        node.isManId
                          ? "bg-[#00875A] text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {node.isManId ? "Main ID (M)" : "Product ID (P)"}
                    </span>
                    <div className="text-base font-black text-gray-900 mt-1.5 font-mono">
                      {node.chainAccountId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-extrabold text-[#00875A]">
                      Level {node.currentLevel || 0}
                    </div>
                    <div className="text-[10px] text-gray-500 font-bold">
                      {node.accumulatedPackages || 0} Pkg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              আপনার এখনো ৪০ পয়েন্ট পূর্ণ হয়নি (বর্তমান রিজার্ভ পয়েন্ট:{" "}
              <strong className="text-[#00875A]">{reservePoints} Pts</strong>)। ৪০ পয়েন্ট পূর্ণ
              হলেই এখানে আপনার <strong>Main ID / Product ID</strong> দেখা যাবে।
            </div>
          )}
        </div>

        {/* Live Inventory Mix & Category Performance Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                  )`,
                }}
              />

              <div className="space-y-1.5 w-full text-xs font-medium text-gray-600">
                {categoryStats.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate max-w-[120px]">{item.name}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-bold">
                      {item.count} products
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">
                  CATEGORY PERFORMANCE
                </span>
                <h3 className="text-lg font-bold text-gray-900">Collection overview</h3>
              </div>
              <Link
                href="/categories"
                className="text-xs font-bold text-gray-800 hover:text-emerald-600 flex items-center gap-1"
              >
                <span>View all</span>
                <span>→</span>
              </Link>
            </div>

            <div className="space-y-3.5 pt-1">
              {categoryStats.map((item, idx) => {
                const percentage =
                  totalProducts > 0 ? (item.count / totalProducts) * 100 : 0;
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
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Shortcuts, Recent Orders & Sponsor Network Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-black text-[#00875A] uppercase tracking-widest block">
                    PURCHASE HISTORY
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">Recent orders</h3>
                </div>
                <Link
                  href="/client/orders"
                  className="text-xs font-bold text-[#00875A] hover:underline"
                >
                  View all →
                </Link>
              </div>

              {recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                        <th className="py-2.5">Order ID</th>
                        <th className="py-2.5">Points</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentOrders.map((ord, i) => (
                        <tr key={i}>
                          <td className="py-3 font-mono font-bold text-gray-800">
                            {ord.orderNo || ord.orderId}
                          </td>
                          <td className="py-3 font-bold text-[#00875A]">
                            +{ord.totalPoints || ord.points || 0} Pts
                          </td>
                          <td className="py-3">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px]">
                              {ord.status || "Pending"}
                            </span>
                          </td>
                          <td className="py-3 text-right font-black text-gray-900">
                            ৳ {ord.totalAmount || ord.total || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center space-y-3">
                  <div className="text-3xl">✨</div>
                  <h4 className="font-bold text-gray-800 text-sm">
                    Your order history is waiting.
                  </h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Discover something useful for your next purchase and start earning
                    cashback points.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/shop"
                      className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-block cursor-pointer"
                    >
                      Start shopping
                    </Link>
                  </div>
                </div>
              )}
            </div>

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
                    Level cashback is added to your account as subsequent orders are
                    completed in the shop.
                  </p>
                  <Link
                    href="/levels"
                    className="inline-block pt-2 text-xs font-bold underline text-white hover:text-orange-200"
                  >
                    View 24 Levels Breakdown →
                  </Link>
                </div>

                <div className="w-28 h-28 rounded-full border-4 border-white/30 bg-white/10 backdrop-blur-md flex flex-col items-center justify-center text-center p-2 shadow-inner">
                  <span className="text-2xl font-black">
                    ৳{Number(stats.walletBalance || 0).toFixed(0)}
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-wider opacity-90">
                    EARNED BONUSES
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <div>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">
                  SHORTCUTS
                </span>
                <h3 className="text-lg font-bold text-gray-900">Make it quick</h3>
              </div>

              <div className="space-y-3">
                <Link
                  href="/shop"
                  className="p-3 bg-gray-50 hover:bg-emerald-50/60 rounded-2xl flex items-center justify-between transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                      +
                    </span>
                    <div>
                      <h5 className="font-bold text-xs text-gray-800 group-hover:text-emerald-700">
                        Shop Products
                      </h5>
                      <p className="text-[10px] text-gray-500">
                        Find your next favourite
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </Link>

                <Link
                  href="/client/withdraw"
                  className="p-3 bg-gray-50 hover:bg-emerald-50/60 rounded-2xl flex items-center justify-between transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs">
                      ✦
                    </span>
                    <div>
                      <h5 className="font-bold text-xs text-gray-800 group-hover:text-emerald-700">
                        Withdraw Wallet
                      </h5>
                      <p className="text-[10px] text-gray-500">
                        bKash, Nagad or Bank transfer
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </Link>

                <Link
                  href="/levels"
                  className="p-3 bg-gray-50 hover:bg-emerald-50/60 rounded-2xl flex items-center justify-between transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                      ⟳
                    </span>
                    <div>
                      <h5 className="font-bold text-xs text-gray-800 group-hover:text-emerald-700">
                        Level Progression
                      </h5>
                      <p className="text-[10px] text-gray-500">
                        Check designation & target
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </Link>
              </div>
            </div>

            <div
              id="sponsor-list"
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4"
            >
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
                    {data?.sponsorList?.length > 0 ? (
                      data.sponsorList.map((sp, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2 font-mono text-gray-500">{i + 1}</td>
                          <td className="py-2 font-mono font-bold text-emerald-700">{sp.id}</td>
                          <td className="py-2 font-bold text-gray-800">{sp.name}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
                          className="py-6 text-center text-gray-400 text-xs italic"
                        >
                          No sponsored members yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

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
              <Link
                href="/client/account"
                className="inline-block text-xs font-bold text-amber-300 hover:underline pt-1"
              >
                Complete profile →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}