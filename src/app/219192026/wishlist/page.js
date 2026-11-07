"use client";

import React, { useState, useEffect } from "react";

export default function AdminWishlistRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWishlistRequests() {
      try {
        const res = await fetch("/api/admin/wishlist-requests");
        if (res.ok) {
          const data = await res.json();
          setRequests(data.requests || []);
        }
      } catch (err) {
        console.error("Failed to fetch wishlist requests", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWishlistRequests();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Wishlist Demand Requests</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time products requested or added to wishlist by users.</p>
        </div>
        <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold">
          {requests.length} Requests
        </span>
      </div>

      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl">
        {!loading && requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3">User Name</th>
                  <th className="py-3">Requested Product</th>
                  <th className="py-3">Category</th>
                  <th className="py-3 text-right">Date Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.map((r, idx) => (
                  <tr key={idx}>
                    <td className="py-3 font-bold text-white">{r.userName || "Registered User"}</td>
                    <td className="py-3 text-slate-300 font-medium">{r.productName}</td>
                    <td className="py-3 text-emerald-400 font-bold">{r.category}</td>
                    <td className="py-3 text-right text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-10 text-center italic">
            No wishlist requests recorded yet. When users add or request items, they will appear here.
          </p>
        )}
      </div>
    </div>
  );
}