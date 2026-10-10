"use client";

import React, { useState, useEffect } from "react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/admin/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Failed to load orders", err);
      }
    }
    loadOrders();
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (res.ok) {
        setOrders(orders.map((o) => ((o._id || o.id) === orderId ? { ...o, status: newStatus } : o)));
      }
    } catch (err) {
      console.error("Status update error", err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Real Customer Orders</h1>
          <p className="text-xs text-slate-400 mt-1">Manage and deliver live orders placed on Bright Smart Shop.</p>
        </div>
        <span className="text-xs text-emerald-400 font-bold">{orders.length} Active Orders</span>
      </div>

      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl">
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3">Order Number</th>
                  <th className="py-3">Customer</th>
                  <th className="py-3">Phone</th>
                  <th className="py-3">Total</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((o) => (
                  <tr key={o._id || o.id}>
                    <td className="py-3 font-mono font-bold text-white">{o.orderNumber || o._id}</td>
                    <td className="py-3 font-bold text-slate-200">{o.user?.name || o.customerName}</td>
                    <td className="py-3 text-slate-400">{o.phone || o.shippingAddress?.phone}</td>
                    <td className="py-3 font-black text-emerald-400">৳{o.totalAmount}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-full font-black text-[10px]">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => updateStatus(o._id || o.id, "Delivered")}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg transition-all"
                      >
                        Mark Delivered
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-10 text-center italic">
            No real orders placed yet. When a customer completes checkout, their order will appear here.
          </p>
        )}
      </div>
    </div>
  );
}