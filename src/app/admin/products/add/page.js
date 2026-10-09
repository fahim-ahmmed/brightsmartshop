"use client";

import React, { useState } from "react";
import Link from "next/link";

const CATEGORIES_LIST = [
  { name: "Grocery", icon: "🌾" },
  { name: "Fashion", icon: "👕" },
  { name: "Cosmetics", icon: "🧴" },
  { name: "Beauty Care", icon: "🪷" },
  { name: "Health & Medicine", icon: "💊" },
  { name: "Electronics", icon: "📺" },
  { name: "Home & Kitchen", icon: "🍳" },
  { name: "Offers", icon: "🏷️" },
];

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    originalPrice: "",
    points: "",
    category: "Grocery",
    description: "",
    image: "📦",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "প্রোডাক্ট আপলোড করা যায়নি।");
      }

      setMsg({ type: "success", text: "প্রোডাক্টটি সফলভাবে সেভ হয়েছে এবং সাইটে লাইভ হয়েছে!" });
      setFormData({
        title: "",
        price: "",
        originalPrice: "",
        points: "",
        category: "Grocery",
        description: "",
        image: "📦",
      });
    } catch (err) {
      setMsg({ type: "error", text: err.message || "একটি সমস্যা ঘটেছে।" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 p-6 sm:p-10 max-w-3xl mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <span className="text-[10px] font-black text-[#00875A] uppercase tracking-widest block">ADMIN PANEL</span>
          <h1 className="text-2xl font-black text-gray-900">Add New Product</h1>
        </div>
        <Link href="/admin" className="text-xs font-bold text-gray-600 hover:underline">← Back to Admin</Link>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-xs font-bold ${msg.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1">Product Title *</label>
          <input
            type="text"
            required
            placeholder="যেমন: ACI Pure Rice 5kg"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-gray-50 border rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00875A]/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Selling Price (৳) *</label>
            <input
              type="number"
              required
              placeholder="195"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full bg-gray-50 border rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00875A]/20"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Original Price (৳)</label>
            <input
              type="number"
              placeholder="220"
              value={formData.originalPrice}
              onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
              className="w-full bg-gray-50 border rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00875A]/20"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Reward Points</label>
            <input
              type="number"
              placeholder="5"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: e.target.value })}
              className="w-full bg-gray-50 border rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00875A]/20"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1">Select Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full bg-gray-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00875A]/20"
          >
            {CATEGORIES_LIST.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1">Product Icon / Image Emoji</label>
          <input
            type="text"
            placeholder="🍚, 🍾, 👔, 🧴, 🪷, 🩺, 🎧, 🍳"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="w-full bg-gray-50 border rounded-xl p-3 text-xs font-semibold focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#00875A] hover:bg-[#00704A] text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? "Uploading Product..." : "Upload & Save Permanently →"}
        </button>
      </form>
    </div>
  );
}