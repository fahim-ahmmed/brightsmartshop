"use client";

import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 সঠিক API রুট (/api/orders) থেকে ডাটা ফেচ করা
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
      toast.error("ডাটা ফেচ করতে সমস্যা হয়েছে!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  // স্ট্যাটাস আপডেট করার ফাংশন
  const handleUpdateStatus = async (orderId, newStatus) => {
    const loadingToastId = toast.loading(`অর্ডারটি '${newStatus}' করা হচ্ছে...`);

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (res.ok) {
        toast.success(`অর্ডার সফলভাবে '${newStatus}' করা হয়েছে!`, { id: loadingToastId });
        fetchAllOrders(); 
      } else {
        toast.error("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।", { id: loadingToastId });
      }
    } catch (e) {
      toast.error("নেটওয়ার্ক সমস্যা!", { id: loadingToastId });
    }
  };

  // 🟢 অর্ডার ডিলিট করার ফাংশন
  const handleDeleteOrder = async (orderId) => {
    if (!confirm("আপনি কি নিশ্চিত এই অর্ডারটি চিরতরে ডিলিট করতে চান?")) return;

    const loadingToastId = toast.loading("অর্ডারটি ডিলিট করা হচ্ছে...");

    try {
      // সঠিক API রুট (/api/orders?orderId=...) ব্যবহার করা হয়েছে
      const res = await fetch(`/api/orders?orderId=${orderId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("অর্ডার সফলভাবে ডিলিট করা হয়েছে!", { id: loadingToastId });
        setOrders((prev) => prev.filter((ord) => (ord.orderId || ord.orderNo || ord._id) !== orderId));
      } else {
        toast.error("অর্ডার ডিলিট করতে সমস্যা হয়েছে।", { id: loadingToastId });
      }
    } catch (e) {
      toast.error("নেটওয়ার্ক সমস্যা!", { id: loadingToastId });
    }
  };

  // ফিল্টারিং: শুধু 'M' এবং 'P' আলাদা করা
  const manIdOrders = [];
  const productIdOrders = [];

  orders.forEach((ord) => {
    const orderNo = (ord.orderNo || ord.orderId || "").toUpperCase();
    if (orderNo.startsWith("M")) {
      manIdOrders.push(ord);
    } else if (orderNo.startsWith("P")) {
      productIdOrders.push(ord);
    }
  });

  const SlimOrderCard = ({ ord }) => {
    const sponsor = ord.sponsorId || ord.sponsorCode || ord.referredBy || ord.sponsor || ord.refId || ord.referral || "";
    const currentOrderId = ord.orderId || ord.orderNo;

    return (
      <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-xs hover:border-[#00875A] transition-all relative flex flex-col justify-between text-xs space-y-2.5">
        <div className={`absolute top-0 right-0 px-2.5 py-1 rounded-bl-lg text-[9px] font-black text-white uppercase tracking-wider z-10 ${
          ord.status === "Paid" ? "bg-emerald-500" :
          ord.status === "Cancelled" ? "bg-rose-500" :
          ord.status === "Delivered" ? "bg-blue-500" : "bg-amber-500"
        }`}>
          {ord.status || "Pending"}
        </div>

        <div className="border-b border-gray-100 pb-1.5 pr-14">
          <span className="font-black text-gray-900 text-sm tracking-wide">{currentOrderId}</span>
          <span className="text-[10px] text-gray-400 block">{new Date(ord.createdAt).toLocaleString()}</span>
        </div>

        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-black text-gray-800">{ord.customerName}</span>
            <span className="text-gray-600 font-semibold">{ord.phone}</span>
          </div>
          <p className="text-gray-500 text-[11px] truncate">📍 {ord.address || "ঠিকানা দেওয়া হয়নি"}</p>
        </div>

        <div className="flex justify-between items-center px-1">
          <div>
            <span className="font-black text-[#00875A] text-base">৳{ord.totalAmount || 0}</span>
            <span className="text-[10px] text-gray-500 block font-medium">💳 {ord.paymentMethod || "COD"} | পয়েন্ট: {ord.totalPoints || ord.points || 0}</span>
          </div>

          {sponsor && (
            <div className="text-right">
              <span className="text-[9px] font-bold text-amber-600 block uppercase">Referral</span>
              <span className="font-mono bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 font-bold text-[10px]">
                {sponsor}
              </span>
            </div>
          )}
        </div>

        <div className="no-print space-y-1.5 pt-1.5 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-1">
            <button onClick={() => handleUpdateStatus(currentOrderId, "Paid")} className="py-1.5 bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white border border-emerald-200 font-black text-[9px] uppercase rounded transition-all cursor-pointer">
              ✅ Paid
            </button>
            <button onClick={() => handleUpdateStatus(currentOrderId, "Delivered")} className="py-1.5 bg-blue-50 hover:bg-blue-500 text-blue-700 hover:text-white border border-blue-200 font-black text-[9px] uppercase rounded transition-all cursor-pointer">
              📦 Deliv
            </button>
            <button onClick={() => handleUpdateStatus(currentOrderId, "Cancelled")} className="py-1.5 bg-rose-50 hover:bg-rose-500 text-rose-700 hover:text-white border border-rose-200 font-black text-[9px] uppercase rounded transition-all cursor-pointer">
              ❌ Cancel
            </button>
          </div>
          
          <button onClick={() => handleDeleteOrder(currentOrderId)} className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs">
            🗑️ অর্ডার ডিলিট করুন
          </button>
        </div>
      </div>
    );
  };

  const OrderListRow = ({ ord }) => {
    const sponsor = ord.sponsorId || ord.sponsorCode || ord.referredBy || ord.sponsor || ord.refId || ord.referral || "";
    const currentOrderId = ord.orderId || ord.orderNo;

    return (
      <div className="bg-white hover:bg-slate-50 transition-colors p-3.5 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 min-w-[200px]">
          <span className="font-black text-gray-900 font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">{currentOrderId}</span>
          <div>
            <p className="font-black text-gray-800">{ord.customerName}</p>
            <p className="text-[10px] text-gray-400">{new Date(ord.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <span className="font-black text-[#00875A] text-sm block">৳{ord.totalAmount || 0}</span>
            <span className="text-[10px] text-gray-500 font-bold">পয়েণ্ট: {ord.totalPoints || ord.points || 0}</span>
          </div>
          
          {sponsor ? (
            <span className="font-mono bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-bold text-[10px]">
              🤝 {sponsor}
            </span>
          ) : (
            <span className="text-gray-300 font-bold text-[10px]">কোনো রেফারেন্স নেই</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
            ord.status === "Paid" ? "bg-emerald-100 text-emerald-700" :
            ord.status === "Cancelled" ? "bg-rose-100 text-rose-700" :
            ord.status === "Delivered" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
          }`}>
            {ord.status || "Pending"}
          </span>

          <div className="no-print flex items-center gap-1">
            <button onClick={() => handleUpdateStatus(currentOrderId, "Paid")} title="Paid" className="px-2 py-1 bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white border border-emerald-200 font-bold text-[10px] rounded transition-all cursor-pointer">
              ✅
            </button>
            <button onClick={() => handleUpdateStatus(currentOrderId, "Delivered")} title="Delivered" className="px-2 py-1 bg-blue-50 hover:bg-blue-500 text-blue-700 hover:text-white border border-blue-200 font-bold text-[10px] rounded transition-all cursor-pointer">
              📦
            </button>
            <button onClick={() => handleUpdateStatus(currentOrderId, "Cancelled")} title="Cancel" className="px-2 py-1 bg-rose-50 hover:bg-rose-500 text-rose-700 hover:text-white border border-rose-200 font-bold text-[10px] rounded transition-all cursor-pointer">
              ❌
            </button>
            <button onClick={() => handleDeleteOrder(currentOrderId)} title="Delete" className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded transition-all cursor-pointer ml-1">
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="p-4 sm:p-6 font-sans text-gray-800 space-y-6 bg-slate-100 min-h-screen">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex flex-wrap items-center justify-between gap-4 border border-gray-200 bg-white p-5 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-black text-gray-900">অর্ডার ম্যানেজমেন্ট</h1>
          <p className="text-xs font-bold text-gray-500 mt-0.5">প্রতিদিনের অর্ডার ও স্ট্যাটাস ম্যানেজমেন্ট ড্যাশবোর্ড</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => window.print()} className="no-print bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer">
            📄 PDF
          </button>
          <button onClick={fetchAllOrders} className="no-print bg-[#00875A] hover:bg-[#00704A] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer">
            🔄 রিফ্রেশ
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm font-bold text-[#00875A] animate-pulse">ডাটা লোড হচ্ছে...</div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gray-800 px-4 py-3 text-white flex justify-between items-center">
              <h2 className="text-sm font-black flex items-center gap-2">🌐 ওভারঅল অর্ডার লিস্ট (Total Orders)</h2>
              <span className="bg-white text-gray-900 px-2.5 py-0.5 rounded-full text-[10px] font-black">মোট: {orders.length} টি</span>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[500px] bg-gray-50/50">
              {orders.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {orders.map(ord => <SlimOrderCard key={ord.orderId || ord._id || ord.orderNo} ord={ord} />)}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-12 font-bold text-xs">কোনো অর্ডার পাওয়া যায়নি</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-xs border border-purple-200 overflow-hidden flex flex-col h-[65vh]">
              <div className="bg-purple-600 px-4 py-3 text-white flex justify-between items-center shrink-0">
                <h2 className="text-sm font-black flex items-center gap-2">👤 ম্যান আইডি (Man ID - M) লিস্ট</h2>
                <span className="bg-white text-purple-700 px-2.5 py-0.5 rounded-full text-[10px] font-black">{manIdOrders.length} টি</span>
              </div>
              
              <div className="p-4 overflow-y-auto bg-purple-50/20 flex-1 space-y-2.5">
                {manIdOrders.length > 0 ? (
                  manIdOrders.map(ord => <OrderListRow key={ord.orderId || ord._id || ord.orderNo} ord={ord} />)
                ) : (
                  <p className="text-center text-purple-400 py-16 font-bold text-xs">কোনো ম্যান আইডি অর্ডার নেই</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xs border border-blue-200 overflow-hidden flex flex-col h-[65vh]">
              <div className="bg-blue-600 px-4 py-3 text-white flex justify-between items-center shrink-0">
                <h2 className="text-sm font-black flex items-center gap-2">📦 প্রোডাক্ট আইডি (Product ID - P) লিস্ট</h2>
                <span className="bg-white text-blue-700 px-2.5 py-0.5 rounded-full text-[10px] font-black">{productIdOrders.length} টি</span>
              </div>
              
              <div className="p-4 overflow-y-auto bg-blue-50/20 flex-1 space-y-2.5">
                {productIdOrders.length > 0 ? (
                  productIdOrders.map(ord => <OrderListRow key={ord.orderId || ord._id || ord.orderNo} ord={ord} />)
                ) : (
                  <p className="text-center text-blue-450 py-16 font-bold text-xs">কোনো প্রোডাক্ট আইডি অর্ডার নেই</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}