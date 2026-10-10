"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { cartItems, clearCart } = useCart() || {};

  const buyId = searchParams.get("id");
  const buyTitle = searchParams.get("title");
  const buyPrice = searchParams.get("price");

  const isDirectBuy = Boolean(buyTitle && buyPrice);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    paymentMethod: "cod", // 'cod', 'bkash', 'nagad'
    senderNumber: "",
    transactionId: "",
  });

  const [loading, setLoading] = useState(false);

  // 1. Calculate Total Items Count
  const totalItemCount = isDirectBuy
    ? 1
    : (cartItems || []).reduce((acc, item) => acc + (item.quantity || 1), 0);

  // 2. Calculate Subtotal Price
  const subtotalPrice = isDirectBuy
    ? Number(buyPrice)
    : (cartItems || []).reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);

  // 3. Calculate Delivery Charge (Free if 3 or more items, otherwise 120 Tk)
  const deliveryCharge = totalItemCount >= 3 ? 0 : 120;

  // 4. Calculate Grand Total
  const totalAmount = subtotalPrice + deliveryCharge;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.address) {
      alert("অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা দিন।");
      return;
    }

    if (formData.paymentMethod !== "cod" && (!formData.senderNumber || !formData.transactionId)) {
      alert("অনুগ্রহ করে সেন্ডার নম্বর এবং Transaction ID প্রদান করুন।");
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        customerName: formData.name,
        phone: formData.phone,
        address: formData.address,
        paymentMethod: formData.paymentMethod,
        paymentDetails: {
          senderNumber: formData.senderNumber,
          transactionId: formData.transactionId,
          officialNumber: "01305470835",
        },
        items: isDirectBuy
          ? [{ id: buyId, title: buyTitle, price: Number(buyPrice), quantity: 1 }]
          : cartItems,
        subtotalPrice,
        deliveryCharge,
        totalAmount,
        status: "Pending",
        createdAt: new Date(),
      };

      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (res.ok) {
        alert("🎉 আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!");
        if (!isDirectBuy && clearCart) clearCart();
        router.push("/client/orders");
      } else {
        alert("অর্ডার জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
    } catch (err) {
      console.error("Order submit error:", err);
      alert("সার্ভারে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 font-sans text-gray-800 space-y-8">
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-black text-[#00875A]">Checkout & Delivery</h1>
        <p className="text-xs text-gray-500 mt-1">আপনার ঠিকানা ও পেমেন্ট সিলেক্ট করে অর্ডার নিশ্চিত করুন</p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-sm font-extrabold text-gray-900 border-b pb-3">১. শিপিং ঠিকানা</h2>
          
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold block mb-1">আপনার নাম *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="আপনার নাম লিখুন"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#00875A]"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">ফোন নম্বর *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="017XXXXXXXX"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#00875A]"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">সম্পূর্ণ ঠিকানা *</label>
              <textarea
                required
                rows="3"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="বাসা নং, রোড নং, এলাকা, জেলা..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#00875A]"
              />
            </div>
          </div>

          <h2 className="text-sm font-extrabold text-gray-900 border-b pb-3 pt-2">২. পেমেন্ট সিলেক্ট করুন</h2>
          
          <div className="space-y-3">
            <label className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer ${
              formData.paymentMethod === "cod" ? "border-[#00875A] bg-emerald-50/50" : "border-gray-200"
            }`}>
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={formData.paymentMethod === "cod"}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              />
              <span className="text-xs font-bold">💵 ক্যাশ অন ডেলিভারি (Cash on Delivery)</span>
            </label>

            <label className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer ${
              formData.paymentMethod === "bkash" ? "border-pink-500 bg-pink-50/50" : "border-gray-200"
            }`}>
              <input
                type="radio"
                name="payment"
                value="bkash"
                checked={formData.paymentMethod === "bkash"}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              />
              <span className="text-xs font-bold text-pink-700">💖 বিকাশ সেন্ড মানি</span>
            </label>

            <label className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer ${
              formData.paymentMethod === "nagad" ? "border-orange-500 bg-orange-50/50" : "border-gray-200"
            }`}>
              <input
                type="radio"
                name="payment"
                value="nagad"
                checked={formData.paymentMethod === "nagad"}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              />
              <span className="text-xs font-bold text-orange-700">🟠 নগদ সেন্ড মানি</span>
            </label>
          </div>

          {formData.paymentMethod !== "cod" && (
            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-3 text-xs border border-slate-800">
              <p className="font-bold text-emerald-400">📲 বিকাশ / নগদ সেন্ড মানি নম্বর:</p>
              <div className="bg-slate-800 p-2.5 rounded-xl text-center text-sm font-black text-amber-400 font-mono">
                01305470835
              </div>
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  placeholder="যে নম্বর থেকে সেন্ড করেছেন"
                  value={formData.senderNumber}
                  onChange={(e) => setFormData({ ...formData, senderNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Transaction ID (TrxID)"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white uppercase"
                />
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm h-fit space-y-4">
          <h2 className="text-sm font-extrabold text-gray-900 border-b pb-3">অর্ডার সামারি</h2>
          
          <div className="space-y-2 text-xs font-bold">
            <div className="flex justify-between">
              <span>প্রোডাক্ট সাবটোটাল ({totalItemCount} টি)</span>
              <span>৳{subtotalPrice}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span>ডেলিভারি চার্জ</span>
              {deliveryCharge === 0 ? (
                <span className="text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ফ্রি (৩টি অফার)
                </span>
              ) : (
                <span className="text-gray-900 font-bold">৳{deliveryCharge}</span>
              )}
            </div>

            {totalItemCount < 3 && (
              <p className="text-[10px] text-amber-600 font-extrabold bg-amber-50 p-2 rounded-xl border border-amber-200">
                💡 টিপস: ৩টি বা তার বেশি প্রোডাক্ট অর্ডারে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি!
              </p>
            )}
          </div>

          <div className="border-t pt-3 flex justify-between text-sm font-black">
            <span>সর্বমোট বিল:</span>
            <span className="text-[#00875A] text-base">৳{totalAmount}</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#00875A] hover:bg-[#00704A] text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            {loading ? "প্রসেস হচ্ছে..." : "✅ কনফার্ম অর্ডার করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-[#00875A]">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}