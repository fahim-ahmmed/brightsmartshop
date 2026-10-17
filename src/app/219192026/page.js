"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    wishlistCount: 0,
    totalProducts: 0,
    pendingWithdrawals: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // সিকিউরিটি ভেরিফিকেশন (localStorage চেক)
  useEffect(() => {
    const adminToken = localStorage.getItem("admin_logged_in");
    if (!adminToken) {
      router.push("/219192026/login");
      return;
    }

    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.stats) setStats(data.stats);
          if (data.recentOrders) setRecentOrders(data.recentOrders);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-bold text-emerald-400 animate-pulse">
        Loading Real-time System Statistics...
      </div>
    );
  }

  const cards = [
    { label: "Total Customers", value: stats.totalCustomers, sub: "Registered users", icon: "👥" },
    { label: "Total Orders", value: stats.totalOrders, sub: "All time orders", icon: "📋" },
    { label: "Pending Orders", value: stats.pendingOrders || 0, sub: "Awaiting fulfillment", icon: "⏳" },
    { label: "Total Revenue", value: `৳${Number(stats.totalRevenue || 0).toFixed(2)}`, sub: "Paid / Completed sales", icon: "💰" },
    { label: "Wishlist Demands", value: stats.wishlistCount, sub: "Real customer requests", icon: "❤️" },
    { label: "Live Products", value: stats.totalProducts, sub: "In store catalog", icon: "📦" },
    { label: "Pending Withdrawals", value: `৳${Number(stats.pendingWithdrawals || 0).toFixed(2)}`, sub: "Unpaid payout requests", icon: "💳" },
  ];

  return (
    <div className="space-y-8 font-sans text-gray-100">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time platform metrics synchronized with live database.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black rounded-xl">
            Live Database Sync ●
          </span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((c, idx) => (
          <div key={idx} className="bg-[#1E293B] border border-slate-800 p-5 rounded-3xl shadow-md flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>{c.label}</span>
              <span className="text-base">{c.icon}</span>
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-white">{c.value}</span>
            </div>
            <span className="text-[10px] text-slate-400">{c.sub}</span>
          </div>
        ))}
      </div>

      {/* Recent Orders Table */}
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white">Recent Customer Orders</h3>
          <Link href="/219192026/orders" className="text-xs text-emerald-400 font-bold hover:underline">
            View All Orders →
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5">Order ID</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Amount</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentOrders.map((ord) => (
                  <tr key={ord._id || ord.id}>
                    <td className="py-3 font-mono font-bold text-white">{ord.orderNumber || ord.orderId || ord._id}</td>
                    <td className="py-3 text-slate-300 font-bold">{ord.customerName || ord.user?.name || "Customer"}</td>
                    <td className="py-3 font-black text-emerald-400">৳{ord.totalAmount}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold">
                        {ord.status || "Pending"}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-400">
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-6 text-center italic">
            No real orders in database yet. New customer orders will automatically appear here.
          </p>
        )}
      </div>

    </div>
  );
}