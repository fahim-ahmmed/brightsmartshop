"use client";

import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [parentCategory, setParentCategory] = useState("Main");
  const [icon, setIcon] = useState("🏷️");
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
      toast.error("ক্যাটাগরি লোড করতে সমস্যা হয়েছে!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading("ক্যাটাগরি সেভ হচ্ছে...");

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentCategory, icon }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create category");
      }

      toast.success("ক্যাটাগরি সফলভাবে তৈরি করা হয়েছে!", { id: toastId });
      setName("");
      setParentCategory("Main");
      setIcon("🏷️");
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "কিছু সমস্যা হয়েছে!", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const mainCategories = categories.filter((c) => !c.parentCategory || c.parentCategory === "Main");

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4 sm:p-6">
      
      {/* টোস্ট কন্টেইনার */}
      <Toaster position="top-right" reverseOrder={false} />

      <div>
        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
          ADMIN CONTROL
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white">ক্যাটাগরি ও সাব-ক্যাটাগরি ম্যানেজমেন্ট</h1>
        <p className="text-xs text-slate-400 mt-1">
          এখানে তৈরি করা ক্যাটাগরি সাইটের অল ক্যাটাগরি এবং শপে পার্মানেন্টলি শো করবে।
        </p>
      </div>

      {/* ফরম সেকশন */}
      <div className="bg-[#1E293B] border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
        <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">নতুন ক্যাটাগরি তৈরি করুন</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">ক্যাটাগরি লেভেল *</label>
            <select
              value={parentCategory}
              onChange={(e) => setParentCategory(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Main">📁 মূল ক্যাটাগরি (Main Category)</option>
              {mainCategories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  ↳ সাব-ক্যাটাগরি (আওতাধীন: {cat.name})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">ক্যাটাগরির নাম *</label>
            <input
              type="text"
              required
              placeholder="যেমন: Electronics, Grocery ইত্যাদি"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">আইকন বা ইমোজি (ঐচ্ছিক)</label>
            <input
              type="text"
              placeholder="যেমন: 📱 বা 🛒"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer mt-2 disabled:opacity-50"
          >
            {submitting ? "সেভ হচ্ছে..." : "+ ক্যাটাগরি সেভ করুন"}
          </button>
        </form>
      </div>

    </div>
  );
}