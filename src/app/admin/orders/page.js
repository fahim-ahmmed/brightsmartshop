"use client";

import React, { useState, useEffect } from "react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  // স্ট্যাটাস আপডেট করার ফাংশন
  const handleUpdateStatus = async (orderId, newStatus) => {
    const confirmUpdate = window.confirm(`আপনি কি অর্ডারটি '${newStatus}' করতে চান?`);
    if (!confirmUpdate) return;

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (res.ok) {
        alert(`অর্ডার সফলভাবে '${newStatus}' করা হয়েছে!`);
        fetchAllOrders(); // সাথে সাথে ডাটা রিফ্রেশ হবে
      } else {
        alert("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।");
      }
    } catch (e) {
      alert("নেটওয়ার্ক সমস্যা!");
    }
  };

  return (
    <main className="p-4 sm:p-8 font-sans text-gray-800 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5 bg-white p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900">অর্ডার ম্যানেজমেন্ট</h1>
          <p className="text-xs font-bold text-gray-500 mt-1">সব কাস্টমারের অর্ডারের তালিকা ও স্ট্যাটাস আপডেট করুন</p>
        </div>
        <button onClick={fetchAllOrders} className="bg-[#00875A] hover:bg-[#00704A] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all">
          🔄 রিফ্রেশ তালিকা
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm font-bold text-[#00875A] animate-pulse">ডাটা লোড হচ্ছে...</div>
      ) : orders.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map((ord) => (
            <div key={ord.orderId} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4 hover:border-[#00875A] transition-colors relative overflow-hidden">
              
              {/* স্ট্যাটাস রিবন */}
              <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-[10px] font-black text-white uppercase tracking-wider ${
                ord.status === "Paid" ? "bg-emerald-500" :
                ord.status === "Cancelled" ? "bg-rose-500" :
                ord.status === "Delivered" ? "bg-blue-500" : "bg-amber-500"
              }`}>
                {ord.status || "Pending"}
              </div>

              <div className="border-b border-gray-100 pb-4">
                <span className="font-black text-gray-900 text-lg block">{ord.orderId}</span>
                <span className="text-xs font-bold text-gray-500">{new Date(ord.createdAt).toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                <div className="space-y-1.5 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <p className="font-black text-gray-800 text-sm">{ord.customerName}</p>
                  <p className="text-gray-600">📞 {ord.phone}</p>
                  <p className="text-gray-500 line-clamp-2">📍 {ord.address}</p>
                </div>

                <div className="space-y-1.5 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <p className="font-black text-[#00875A] text-lg mb-2">৳{ord.totalAmount}</p>
                  <p className="bg-white px-2 py-1 rounded border inline-block">💳 {ord.paymentMethod}</p>
                  {ord.paymentDetails?.transactionId && (
                    <div className="mt-1">
                      <p className="text-[10px] font-bold text-amber-600">TrxID: {ord.paymentDetails.transactionId}</p>
                      <p className="text-[10px] font-bold text-gray-500">Sender: {ord.paymentDetails.senderNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* অর্ডারকৃত পণ্যসমূহ */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs">
                <p className="font-black text-gray-800 mb-2 border-b pb-1">অর্ডারকৃত পণ্যসমূহ:</p>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                  {(ord.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between font-bold text-gray-600">
                      <span>• {item.title} (x{item.quantity || 1})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 🎯 এডমিন একশন বাটনসমূহ */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleUpdateStatus(ord.orderId, "Paid")}
                  className="flex-1 min-w-[100px] px-3 py-2.5 bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white border border-emerald-200 font-bold text-xs rounded-xl transition-all"
                >
                  ✅ Paid
                </button>
                <button
                  onClick={() => handleUpdateStatus(ord.orderId, "Delivered")}
                  className="flex-1 min-w-[100px] px-3 py-2.5 bg-blue-50 hover:bg-blue-500 text-blue-700 hover:text-white border border-blue-200 font-bold text-xs rounded-xl transition-all"
                >
                  📦 Delivered
                </button>
                <button
                  onClick={() => handleUpdateStatus(ord.orderId, "Cancelled")}
                  className="flex-1 min-w-[100px] px-3 py-2.5 bg-rose-50 hover:bg-rose-500 text-rose-700 hover:text-white border border-rose-200 font-bold text-xs rounded-xl transition-all"
                >
                  ❌ Cancel
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-16 rounded-3xl text-center border shadow-sm space-y-3">
          <div className="text-5xl">📭</div>
          <p className="text-sm font-bold text-gray-500">কোনো অর্ডার পাওয়া যায়নি</p>
        </div>
      )}
    </main>
  );
}