"use client";

import React, { useState, useEffect } from "react";

export default function AdminAddProductPage() {
  const [formData, setFormData] = useState({
    title: "",
    category: "grocery",
    costPrice: 0, // বাইং প্রাইস
    price: 0,     // সেলিং প্রাইস
    originalPrice: 0,
    unit: "1 Pcs",
    image: "",
  });

  const [calculatedPoints, setCalculatedPoints] = useState(0);
  const [loading, setLoading] = useState(false);

  // 🟢 অটোমেটিক পয়েন্ট ক্যালকুলেশন লজিক: (Selling Price - Buying Price) / 2.25
  useEffect(() => {
    const cost = parseFloat(formData.costPrice) || 0;
    const sell = parseFloat(formData.price) || 0;

    if (sell > cost && cost >= 0) {
      const profit = sell - cost;
      const pts = profit / 2.25;
      // ২ দশমিক স্থান পর্যন্ত সুন্দর রাখার জন্য (যেমন: 8.89 বা Math.floor ব্যবহার করতে পারেন)
      setCalculatedPoints(Number(pts.toFixed(2)));
    } else {
      setCalculatedPoints(0);
    }
  }, [formData.costPrice, formData.price]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        costPrice: Number(formData.costPrice),
        price: Number(formData.price),
        points: calculatedPoints, // অটো ক্যালকুলেটেড পয়েন্ট পাঠানো হচ্ছে
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(`✅ প্রোডাক্ট সফলভাবে যুক্ত হয়েছে! পয়েন্ট অর্জিত: ${calculatedPoints} Points`);
        setFormData({
          title: "",
          category: "grocery",
          costPrice: 0,
          price: 0,
          originalPrice: 0,
          unit: "1 Pcs",
          image: "",
        });
      } else {
        alert("⚠️ প্রোডাক্ট যোগ করতে ব্যর্থ হয়েছে!");
      }
    } catch (err) {
      console.error("Save product error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-3xl border border-gray-200 shadow-xl font-sans text-gray-800">
      <h1 className="text-2xl font-black text-[#00875A] mb-2">নতুন প্রোডাক্ট যুক্ত করুন</h1>
      <p className="text-xs text-gray-500 mb-6">
        বাইং প্রাইস এবং সেলিং প্রাইস দিলে অটোমেটিক রিওয়ার্ড পয়েন্ট হিসেব হয়ে যাবে।
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        <div>
          <label className="font-bold block mb-1">প্রোডাক্টের নাম *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="যেমন: মিনিকেট চাল ২৫ কেজি"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#00875A]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-bold block mb-1">ক্যাটাগরি *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#00875A]"
            >
              <option value="grocery">Grocery & Daily Essentials</option>
              <option value="cosmetics">Beauty & Cosmetics</option>
              <option value="fashion">Fashion & Clothing</option>
              <option value="kitchen">Home & Kitchen</option>
              <option value="electronics">Electronics</option>
            </select>
          </div>

          <div>
            <label className="font-bold block mb-1">পরিমাণ/ওজন (Unit) *</label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="1 Pcs / 1 Kg / 500 ml"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#00875A]"
            />
          </div>
        </div>

        {/* PRICE & POINT CALCULATION BOX */}
        <div className="bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-black text-gray-800 block mb-1">
                কেনা প্রাইস (Buying Price) ৳ *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="যেমন: 100"
                className="w-full bg-white border border-gray-300 rounded-xl p-3 font-bold text-gray-900 focus:outline-none focus:border-[#00875A]"
              />
            </div>

            <div>
              <label className="font-black text-gray-800 block mb-1">
                বিক্রয় প্রাইস (Selling Price) ৳ *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="যেমন: 145"
                className="w-full bg-white border border-gray-300 rounded-xl p-3 font-bold text-gray-900 focus:outline-none focus:border-[#00875A]"
              />
            </div>
          </div>

          {/* AUTO CALCULATED POINT CARD */}
          <div className="bg-white p-3.5 rounded-xl border border-emerald-300/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-500 block">
                প্রফিট: ৳{Math.max(0, formData.price - formData.costPrice)}
              </span>
              <span className="text-xs font-black text-[#00875A]">
                অটোমেটিক রিওয়ার্ড পয়েন্ট (Profit ÷ 2.25):
              </span>
            </div>
            <div className="bg-[#00875A] text-white px-3.5 py-1.5 rounded-xl font-black text-sm shadow-2xs">
              🌟 {calculatedPoints} Points
            </div>
          </div>
        </div>

        <div>
          <label className="font-bold block mb-1">ছবি URL *</label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#00875A]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#F25C05] hover:bg-[#D95000] text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
        >
          {loading ? "সেভ হচ্ছে..." : "🚀 প্রোডাক্ট যোগ করুন"}
        </button>
      </form>
    </div>
  );
}