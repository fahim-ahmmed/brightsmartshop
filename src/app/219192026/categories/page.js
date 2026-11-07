"use client";

import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

const DEFAULT_MAIN_CATEGORIES = [
  { name: "Grocery", slug: "grocery" },
  { name: "Fashion", slug: "fashion" },
  { name: "Cosmetics", slug: "cosmetics" },
  { name: "Beauty Care", slug: "beauty-care" },
  { name: "Health & Medicine", slug: "health-medicine" },
  { name: "Electronics", slug: "electronics" },
  { name: "Home & Kitchen", slug: "home-kitchen" },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [parentCategory, setParentCategory] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || data || []);
      }
    } catch (error) {
      toast.error("ক্যাটাগরি লোড করতে সমস্যা হয়েছে!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generatedSlug);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
      setUploadingImage(false);
      toast.success("ছবি সিলেক্ট করা হয়েছে!");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !slug) {
      toast.error("দয়া করে নাম এবং স্লাগ পূরণ করুন!");
      return;
    }

    if (!image) {
      toast.error("দয়া করে একটি ছবি নির্বাচন করুন বা ছবির লিংক দিন!");
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading("ক্যাটাগরি সেভ হচ্ছে...");

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          image,
          // প্যারেন্ট ক্যাটাগরি স্লাগ হিসেবে সেভ হবে যাতে কখনোই মিসম্যাচ না হয়
          parentCategory: parentCategory ? parentCategory.toLowerCase().trim() : null,
          parentSlug: parentCategory ? parentCategory.toLowerCase().trim() : null,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        toast.success("সফলভাবে ক্যাটাগরি তৈরি করা হয়েছে!", { id: loadingToast });
        setName("");
        setSlug("");
        setImage("");
        fetchCategories();
      } else {
        toast.error(data.message || "ক্যাটাগরি তৈরি করতে ব্যর্থ হয়েছে।", { id: loadingToast });
      }
    } catch (error) {
      toast.error("নেটওয়ার্ক সমস্যা!", { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("আপনি কি নিশ্চিত এই ক্যাটাগরি ডিলিট করতে চান?")) return;
    const loadingToast = toast.loading("ডিলিট করা হচ্ছে...");
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("সফলভাবে ডিলিট করা হয়েছে!", { id: loadingToast });
        fetchCategories();
      } else {
        toast.error("ডিলিট করতে সমস্যা হয়েছে।", { id: loadingToast });
      }
    } catch (error) {
      toast.error("নেটওয়ার্ক সমস্যা!", { id: loadingToast });
    }
  };

  // ডিফল্ট ৭টি মেইন ক্যাটাগরি + ডাটাবেসের মেইন ক্যাটাগরি একত্রিত করা
  const dbMainCats = categories.filter((cat) => !cat.parentCategory && !cat.parentSlug);
  const allMainOptions = [
    ...DEFAULT_MAIN_CATEGORIES,
    ...dbMainCats.filter(
      (dbCat) =>
        !DEFAULT_MAIN_CATEGORIES.some(
          (def) => def.slug === dbCat.slug?.toLowerCase() || def.name.toLowerCase() === dbCat.name?.toLowerCase()
        )
    ),
  ];

  return (
    <main className="p-4 sm:p-8 font-sans text-gray-800 space-y-8 bg-slate-100 min-h-screen">
      <Toaster position="top-right" />

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">ক্যাটাগরি ও সাব-ক্যাটাগরি ম্যানেজমেন্ট</h1>
          <p className="text-xs font-bold text-gray-500 mt-1">৭টি মেইন ক্যাটাগরির অধীনে সাব-ক্যাটাগরি তৈরি ও নিয়ন্ত্রণ করুন</p>
        </div>
        <button
          onClick={fetchCategories}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
        >
          🔄 রিফ্রেশ ডাটা
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs h-fit space-y-6">
          <h2 className="text-base font-black text-gray-900 border-b pb-3">➕ নতুন ক্যাটাগরি / সাব-ক্যাটাগরি তৈরি করুন</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">ক্যাটাগরির ধরন (Type)</label>
              <select
                value={parentCategory}
                onChange={(e) => setParentCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:outline-emerald-600"
              >
                <option value="">📁 মূল ক্যাটাগরি (Main Category)</option>
                {allMainOptions.map((cat, i) => (
                  <option key={cat._id || cat.slug || i} value={cat.slug}>
                    ↳ সাব-ক্যাটাগরি (আন্ডার: {cat.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">ক্যাটাগরির নাম *</label>
              <input
                type="text"
                placeholder="যেমন: Hijab বা Shirt বা Rice"
                value={name}
                onChange={handleNameChange}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">স্লাগ (Slug) *</label>
              <input
                type="text"
                placeholder="যেমন: hijab"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:outline-emerald-600"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">১. পিসি থেকে ছবি সিলেক্ট করুন</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-800 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">অথবা ২. সরাসরি ছবির লিংক পেস্ট করুন</label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:outline-emerald-600"
                />
              </div>

              {image && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3">
                  <img src={image} alt="Preview" className="w-14 h-14 object-contain rounded-lg bg-white border shrink-0" />
                  <span className="font-bold text-emerald-800 text-xs">✓ ছবি রেডি</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="w-full bg-[#00875A] hover:bg-[#00704A] text-white font-black text-xs py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "সংরক্ষণ হচ্ছে..." : "💾 ক্যাটাগরি সেভ করুন"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-base font-black text-gray-900 border-b pb-3">📋 তৈরি করা ক্যাটাগরি ও সাব-ক্যাটাগরি তালিকা</h2>

          {loading ? (
            <div className="py-20 text-center text-xs font-bold text-emerald-600 animate-pulse">লোড হচ্ছে...</div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
              {categories.map((cat) => {
                const isSub = cat.parentCategory || cat.parentSlug;
                return (
                  <div
                    key={cat._id}
                    className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-emerald-500 transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 bg-white rounded-xl border overflow-hidden flex items-center justify-center p-1 shrink-0">
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-gray-900">{cat.name}</h3>
                          {isSub && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                              Sub ({cat.parentCategory || cat.parentSlug})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 font-mono mt-0.5">/{cat.slug}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(cat._id)}
                      className="p-2 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white rounded-xl border border-rose-200 transition-all cursor-pointer text-xs"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 font-bold text-xs">
              কোনো সাব-ক্যাটাগরি তৈরি করা হয়নি। বাম পাশ থেকে তৈরি করুন।
            </div>
          )}
        </div>
      </div>
    </main>
  );
}