"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function ClientOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserOrders() {
      try {
        const savedUser = localStorage.getItem("bright_user");
        let queryParam = "";
        
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          const userId = parsedUser.id || parsedUser._id;
          
          // প্রথমে আইডি দিয়ে খুঁজবে, আইডি না থাকলে ফোন নাম্বার দিয়ে
          if (userId) {
            queryParam = `?userId=${userId}`;
          } else if (parsedUser.phone) {
            queryParam = `?phone=${parsedUser.phone}`;
          }
        }

        if (!queryParam) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/orders${queryParam}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Orders fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserOrders();
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 font-sans text-gray-800 space-y-6 min-h-[60vh]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <span className="text-xs font-black text-[#00875A] uppercase tracking-widest block mb-1">
            MY ORDER HISTORY
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">আমার অর্ডারসমূহ</h1>
          <p className="text-xs text-gray-500 mt-1">আপনার সকল অর্ডার ট্র্যাকিং এবং ডেলিভারি স্ট্যাটাস এখান থেকে দেখুন।</p>
        </div>
        <Link href="/shop" className="text-xs font-bold text-[#00875A] bg-emerald-50 px-5 py-2.5 rounded-full border border-emerald-200 hover:bg-[#00875A] hover:text-white transition-all shadow-sm">
          + নতুন কেনাকাটা
        </Link>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#00875A] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-[#00875A] animate-pulse">
            আপনার অর্ডার খোঁজা হচ্ছে...
          </p>
        </div>
      ) : orders.length > 0 ? (
        <div className="grid gap-5">
          {orders.map((ord, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm hover:border-[#00875A] transition-colors space-y-4 group relative overflow-hidden">
              
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 text-xs">
                <div>
                  <span className="font-extrabold text-gray-900 block text-base mb-1">অর্ডার: {ord.orderId || ord.orderNo}</span>
                  <span className="text-gray-500 font-bold">
                    {new Date(ord.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className={`px-4 py-1.5 rounded-full font-black text-[11px] uppercase shadow-sm ${
                    ord.status === "Paid" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                    ord.status === "Cancelled" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                    ord.status === "Delivered" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                    "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>
                    {ord.status || "Pending"}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {(ord.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs sm:text-sm bg-gray-50/80 p-3 rounded-2xl border border-gray-100 group-hover:bg-emerald-50/30 transition-colors">
                    <span className="font-bold text-gray-800">{item.title} <span className="text-gray-400 ml-1 font-medium">(x{item.quantity || 1})</span></span>
                    <span className="font-black text-[#00875A]">৳{item.price * (item.quantity || 1)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-between items-center text-xs pt-3 border-t border-gray-100 font-bold gap-3">
                <span className="text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                  পেমেন্ট: <span className="text-gray-900 ml-1">
                    {
                      ord.paymentMethod === 'office_receive' ? '🏢 অফিস রিসিভ' : 
                      ord.paymentMethod === 'bkash' ? 'বিকাশ' : 
                      ord.paymentMethod === 'nagad' ? 'নগদ' : 'ক্যাশ অন ডেলিভারি'
                    }
                  </span>
                </span>
                <span className="text-sm font-black text-gray-900 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100">
                  সর্বমোট: <span className="text-[#00875A] ml-1 text-base">৳{ord.totalAmount}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border shadow-sm space-y-4 my-8">
          <div className="text-6xl mb-4">🛍️</div>
          <h2 className="text-lg font-black text-gray-800">আপনি এখনও কোনো অর্ডার করেননি!</h2>
          <p className="text-sm text-gray-500 font-medium">
            আপনার প্রয়োজনীয় জিনিসপত্র পছন্দ করতে শপ ভিজিট করুন।
          </p>
          <div className="pt-4">
            <Link href="/shop" className="inline-block bg-[#00875A] text-white font-bold text-sm px-8 py-3 rounded-xl hover:bg-[#00704A] hover:shadow-lg hover:-translate-y-0.5 transition-all">
              শপিং শুরু করুন ➔
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}