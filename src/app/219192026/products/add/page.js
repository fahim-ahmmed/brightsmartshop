"use client";

import React, { useState, useEffect } from "react";

export default function AdminAddProductPage() {
  const [categories, setCategories] = useState([]); // ডাটাবেসের সমস্ত ক্যাটাগরি

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    subCategory: "", // 🟢 সাব-ক্যাটাগরি ফিল্ড যুক্ত করা হলো
    costPrice: 0,   // বাইং প্রাইস
    price: 0,       // সেলিং প্রাইস
    originalPrice: 0,
    unit: "1 Pcs",
    image: "",
  });

  const [calculatedPoints, setCalculatedPoints] = useState(0);
  const [loading, setLoading] = useState(false);

  // ১. ডাটাবেস থেকে ডাইনামিক ক্যাটাগরি লোড করা
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const list = data.categories || data || [];
          setCategories(list);

          const mainCats = list.filter((c) => !c.parentCategory && !c.parentSlug);
          if (mainCats.length > 0) {
            setFormData((prev) => ({
              ...prev,
              category: mainCats[0].slug || mainCats[0].name,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }
    fetchCategories();
  }, []);

  // মূল ক্যাটাগরিগুলোর তালিকা
  const mainCategories = categories.filter((c) => !c.parentCategory && !c.parentSlug);

  // সিলেক্ট করা মূল ক্যাটাগরির অধীনে থাকা সাব-ক্যাটাগরি বের করা
  const currentMainCatObj = categories.find(
    (c) =>
      c.slug?.toLowerCase() === formData.category?.toLowerCase() ||
      c.name?.toLowerCase() === formData.category?.toLowerCase() ||
      c._id?.toString() === formData.category
  );

  const subCategories = categories.filter((c) => {
    if (!currentMainCatObj) return false;
    const parent = (c.parentCategory || c.parentSlug || "").toString().toLowerCase();
    const mainId = (currentMainCatObj._id || "").toString().toLowerCase();
    const mainSlug = (currentMainCatObj.slug || "").toLowerCase();
    const mainName = (currentMainCatObj.name || "").toLowerCase();

    return parent === mainId || parent === mainSlug || parent === mainName;
  });

  // 🟢 অটোমেটিক পয়েন্ট ক্যালকুলেশন লজিক (শুধুমাত্র পূর্ণ সংখ্যা)
  useEffect(() => {
    const cost = parseFloat(formData.costPrice) || 0;
    const sell = parseFloat(formData.price) || 0;

    if (sell > cost && cost >= 0) {
      const profit = sell - cost;
      const pts = profit / 2.25;
      // Math.floor দিয়ে দশমিক বাদ দিয়ে সম্পূর্ণ পূর্ণ সংখ্যায় রূপান্তর
      setCalculatedPoints(Math.floor(pts));
    } else {
      setCalculatedPoints(0);
    }
  }, [formData.costPrice, formData.price]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.price) {
      alert("দয়া করে নাম, ক্যাটাগরি এবং সেলিং প্রাইস দিন!");
      return;
    }

    setLoading(true);

    try {
      const selectedSubObj = subCategories.find(
        (s) =>
          s.slug === formData.subCategory ||
          s.name === formData.subCategory ||
          s._id?.toString() === formData.subCategory
      );

      const payload = {
        ...formData,
        costPrice: Number(formData.costPrice),
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice || formData.price),
        points: calculatedPoints, // পূর্ণ সংখ্যা পয়েন্ট পাঠানো হচ্ছে
        subCategory: selectedSubObj?.slug || formData.subCategory || "",
        subCategoryName: selectedSubObj?.name || formData.subCategory || "",
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(`✅ প্রোডাক্ট সফলভাবে যুক্ত হয়েছে! পয়েন্ট অর্জিত: ${calculatedPoints} Points`);
        setFormData({
          title: "",
          category: mainCategories.length > 0 ? (mainCategories[0].slug || mainCategories[0].name) : "",
          subCategory: "",
          costPrice: 0,
          price: 0,
          originalPrice: 0,
          unit: "1 Pcs",
          image: "",
        });
      } else {
        alert("⚠️ প্রোডাক্ট যোগ করতে ব্যর্থ হয়েছে!");
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
        বাইং প্রাইস এবং সেলিং প্রাইস দিলে অটোমেটিক রিওয়ার্ড পয়েন্ট হিসেব হয়ে যাবে।
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        <div>
          <label className="font-bold block mb-1">প্রোডাক্টের নাম *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="যেমন: মিনিকেট চাল ২৫ কেজি / লাক্সারি হিজাব"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#00875A]"
          />
        </div>

        {/* 🟢 মূল ক্যাটাগরি ও সাব-ক্যাটাগরি ড্রপডাউন */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-bold block mb-1">মূল ক্যাটাগরি *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: "" })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#00875A]"
              required
            >
              <option value="">মূল ক্যাটাগরি নির্বাচন করুন</option>
              {mainCategories.map((cat) => (
                <option key={cat._id} value={cat.slug || cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold block mb-1 text-emerald-700">সাব-ক্যাটাগরি (Optional)</label>
            <select
              value={formData.subCategory}
              onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#00875A]"
            >
              <option value="">-- সাব-ক্যাটাগরি নেই --</option>
              {subCategories.map((sub) => (
                <option key={sub._id} value={sub.slug || sub.name}>
                  ↳ {sub.name}
                </option>
              ))}
            </select>
          </div>
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
                বিক্রয় প্রাইস (Selling Price) ৳ *
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
                অটোমেটিক রিওয়ার্ড পয়েন্ট:
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