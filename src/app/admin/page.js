"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    wishlistCount: 0,
    totalProducts: 0,
    pendingWithdrawals: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats || stats);
          setRecentOrders(data.recentOrders || []);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs font-bold text-[#00875A] animate-pulse">
        Loading Real-time System Statistics...
      </div>
    );
  }

  const cards = [
    { label: "Total Customers", value: stats.totalCustomers, sub: "Registered users", icon: "👥" },
    { label: "Total Orders", value: stats.totalOrders, sub: "All time orders", icon: "📋" },
    { label: "Total Revenue", value: `৳${stats.totalRevenue.toFixed(2)}`, sub: "Completed sales", icon: "💰" },
    { label: "Wishlist Demands", value: stats.wishlistCount, sub: "Real customer requests", icon: "❤️" },
    { label: "Live Products", value: stats.totalProducts, sub: "In store catalog", icon: "📦" },
    { label: "Pending Withdrawals", value: `৳${stats.pendingWithdrawals.toFixed(2)}`, sub: "Payout requests", icon: "💳" },
  ];

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time platform metrics synchronized with live database.
          </p>
        </div>
        <span className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black rounded-xl">
          Live Database Sync ●
        </span>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
          <Link href="/admin/orders" className="text-xs text-emerald-400 font-bold hover:underline">
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
                    <td className="py-3 font-mono font-bold text-white">{ord.orderNumber || ord._id}</td>
                    <td className="py-3 text-slate-300 font-bold">{ord.user?.name || "Customer"}</td>
                    <td className="py-3 font-black text-emerald-400">৳{ord.totalAmount}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-400">
                      {new Date(ord.createdAt).toLocaleDateString()}
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