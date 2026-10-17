"use client";

import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

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
      toast.error("ডাটা ফেচ করতে সমস্যা হয়েছে!");
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

  // অর্ডারগুলোকে ম্যান আইডি ও প্রোডাক্ট আইডিতে ফিল্টার ও সেপারেশন করার লজিক
  const manIdOrders = [];
  const productIdOrders = [];

  orders.forEach((ord) => {
    const sponsor = ord.sponsorId || ord.sponsorCode || ord.referredBy || ord.sponsor || ord.refId || ord.referral || "";
    
    if (sponsor) {
      const isMongoId = /^[a-fA-F0-9]{24}$/.test(sponsor);
      const isProductRef = isMongoId || sponsor.toUpperCase().includes("PROD") || sponsor.toUpperCase().includes("ITEM") || sponsor.toUpperCase().includes("BSS");
      
      if (isProductRef) {
        productIdOrders.push(ord);
      } else {
        manIdOrders.push(ord);
      }
    }
  });

  // 🟢 একদম স্লিম, ছোট এবং কমপ্যাক্ট অর্ডার কার্ড (যাতে একসাথে অনেকগুলো অর্ডার দেখা যায়)
  const SlimOrderCard = ({ ord }) => {
    const sponsor = ord.sponsorId || ord.sponsorCode || ord.referredBy || ord.sponsor || ord.refId || ord.referral || "";

    return (
      <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-xs hover:border-[#00875A] transition-all relative flex flex-col justify-between text-xs space-y-2.5">
        
        {/* স্ট্যাটাস ব্যাজ */}
        <div className={`absolute top-0 right-0 px-2.5 py-1 rounded-bl-lg text-[9px] font-black text-white uppercase tracking-wider z-10 ${
          ord.status === "Paid" ? "bg-emerald-500" :
          ord.status === "Cancelled" ? "bg-rose-500" :
          ord.status === "Delivered" ? "bg-blue-500" : "bg-amber-500"
        }`}>
          {ord.status || "Pending"}
        </div>

        {/* অর্ডার আইডি ও সময় */}
        <div className="border-b border-gray-100 pb-1.5 pr-14">
          <span className="font-black text-gray-900 text-sm tracking-wide">{ord.orderId || ord.orderNo}</span>
          <span className="text-[10px] text-gray-400 block">{new Date(ord.createdAt).toLocaleString()}</span>
        </div>

        {/* কাস্টমার ও ঠিকানা ইনফো */}
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-black text-gray-800">{ord.customerName}</span>
            <span className="text-gray-600 font-semibold">{ord.phone}</span>
          </div>
          <p className="text-gray-500 text-[11px] truncate">📍 {ord.address || "ঠিকানা দেওয়া হয়নি"}</p>
        </div>

        {/* অ্যামাউন্ট, পেমেন্ট এবং রেফারেল সেকশন */}
        <div className="flex justify-between items-center px-1">
          <div>
            <span className="font-black text-[#00875A] text-base">৳{ord.totalAmount || 0}</span>
            <span className="text-[10px] text-gray-500 block font-medium">💳 {ord.paymentMethod || "COD"}</span>
          </div>

          {/* যদি রেফারেন্স থাকে তবেই দেখাবে */}
          {sponsor && (
            <div className="text-right">
              <span className="text-[9px] font-bold text-amber-600 block uppercase">Referral</span>
              <span className="font-mono bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 font-bold text-[10px]">
                {sponsor}
              </span>
            </div>
          )}
        </div>

        {/* অ্যাডমিন অ্যাকশন বাটনসমূহ (একদম কমপ্যাক্ট) */}
        <div className="no-print grid grid-cols-3 gap-1 pt-1.5 border-t border-gray-100">
          <button onClick={() => handleUpdateStatus(ord.orderId, "Paid")} className="py-1.5 bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white border border-emerald-200 font-black text-[9px] uppercase rounded transition-all cursor-pointer">
            ✅ Paid
          </button>
          <button onClick={() => handleUpdateStatus(ord.orderId, "Delivered")} className="py-1.5 bg-blue-50 hover:bg-blue-500 text-blue-700 hover:text-white border border-blue-200 font-black text-[9px] uppercase rounded transition-all cursor-pointer">
            📦 Deliv
          </button>
          <button onClick={() => handleUpdateStatus(ord.orderId, "Cancelled")} className="py-1.5 bg-rose-50 hover:bg-rose-500 text-rose-700 hover:text-white border border-rose-200 font-black text-[9px] uppercase rounded transition-all cursor-pointer">
            ❌ Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="p-4 sm:p-6 font-sans text-gray-800 space-y-6 bg-slate-100 min-h-screen">
      
      {/* টোস্ট নোটিফিকেশন কন্টেইনার */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* টপ হেডার */}
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
          
          {/* ১. সবার উপরে: ওভারঅল বা মোট অর্ডারগুলোর কমপ্যাক্ট গ্রিড */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gray-800 px-4 py-3 text-white flex justify-between items-center">
              <h2 className="text-sm font-black flex items-center gap-2">🌐 ওভারঅল অর্ডার লিস্ট (Total Orders)</h2>
              <span className="bg-white text-gray-900 px-2.5 py-0.5 rounded-full text-[10px] font-black">মোট: {orders.length} টি</span>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[500px] bg-gray-50/50 custom-scroll">
              {orders.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {orders.map(ord => <SlimOrderCard key={ord.orderId || ord._id} ord={ord} />)}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-12 font-bold text-xs">কোনো অর্ডার পাওয়া যায়নি</p>
              )}
            </div>
          </div>

          
          {/* ২. তার নিচে: ম্যান আইডি (M) এবং প্রোডাক্ট আইডি (P) এর আলাদা সেকশন */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* বাম পাশ: ম্যান আইডি (Man ID) */}
            <div className="bg-white rounded-2xl shadow-xs border border-purple-200 overflow-hidden flex flex-col h-[70vh]">
              <div className="bg-purple-600 px-4 py-3 text-white flex justify-between items-center shrink-0">
                <h2 className="text-sm font-black flex items-center gap-2">👤 ম্যান আইডি (Man ID - M) অর্ডার</h2>
                <span className="bg-white text-purple-700 px-2.5 py-0.5 rounded-full text-[10px] font-black">{manIdOrders.length} টি</span>
              </div>
              
              <div className="p-4 overflow-y-auto bg-purple-50/20 flex-1 custom-scroll">
                {manIdOrders.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {manIdOrders.map(ord => <SlimOrderCard key={ord.orderId || ord._id} ord={ord} />)}
                  </div>
                ) : (
                  <p className="text-center text-purple-400 py-16 font-bold text-xs">কোনো ম্যান আইডি অর্ডার নেই</p>
                )}
              </div>
            </div>

            {/* ডান পাশ: প্রোডাক্ট আইডি (Product ID) */}
            <div className="bg-white rounded-2xl shadow-xs border border-blue-200 overflow-hidden flex flex-col h-[70vh]">
              <div className="bg-blue-600 px-4 py-3 text-white flex justify-between items-center shrink-0">
                <h2 className="text-sm font-black flex items-center gap-2">📦 প্রোডাক্ট আইডি (Product ID - P) অর্ডার</h2>
                <span className="bg-white text-blue-700 px-2.5 py-0.5 rounded-full text-[10px] font-black">{productIdOrders.length} টি</span>
              </div>
              
              <div className="p-4 overflow-y-auto bg-blue-50/20 flex-1 custom-scroll">
                {productIdOrders.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {productIdOrders.map(ord => <SlimOrderCard key={ord.orderId || ord._id} ord={ord} />)}
                  </div>
                ) : (
                  <p className="text-center text-blue-400 py-16 font-bold text-xs">কোনো প্রোডাক্ট আইডি অর্ডার নেই</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* কাস্টম স্ক্রলবার স্টাইল */}
      <style jsx>{`
        .custom-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </main>
  );
}