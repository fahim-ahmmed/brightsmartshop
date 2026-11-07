"use client";

import React, { useState, useEffect } from "react";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    link: "/shop",
  });

  const [imagePreview, setImagePreview] = useState("");

  // ১. ডাটাবেস থেকে ব্যানার লিস্ট লোড করা
  const loadBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners || []);
      }
    } catch (err) {
      console.error("Failed to load banners", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // ২. লোকাল ফাইল ইমেজের Base64 প্রিভিউ তৈরি
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ৩. নতুন ব্যানার ডাটাবেসে সাবমিট করা
  const handleAddBanner = async (e) => {
    e.preventDefault();

    if (!imagePreview) {
      alert("অনুগ্রহ করে ব্যানারের জন্য একটি ছবি সিলেক্ট করুন!");
      return;
    }

    setPublishing(true);

    try {
      const payload = {
        title: form.title || "Special Offer Banner",
        subtitle: form.subtitle || "Smart Shopping, Better Living",
        link: form.link || "/shop",
        image: imagePreview,
        isActive: true,
      };

      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("🎉 ব্যানার সফলভাবে হোম পেজ স্লাইডারে আপলোড হয়েছে!");
        setForm({ title: "", subtitle: "", link: "/shop" });
        setImagePreview("");
        loadBanners(); // সাথে সাথে লিস্ট রিফ্রেশ
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.message || "Failed to upload banner"}`);
      }
    } catch (err) {
      console.error("Banner upload error", err);
      alert("সার্ভারে কানেক্ট করতে সমস্যা হয়েছে।");
    } finally {
      setPublishing(false);
    }
  };

  // ৪. ব্যানারের স্ট্যাটাস টগল করা (Active / Inactive)
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetch("/api/admin/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });

      if (res.ok) {
        loadBanners();
      }
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  // ৫. ব্যানার স্থায়ীভাবে মুছে ফেলা
  const handleDeleteBanner = async (id) => {
    if (confirm("আপনি কি নিশ্চিত যে এই ব্যানারটি ডিলিট করতে চান?")) {
      try {
        const res = await fetch(`/api/admin/banners?id=${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          alert("ব্যানার ডিলিট হয়েছে!");
          loadBanners();
        }
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  return (
    <div className="space-y-8 font-sans text-slate-100 max-w-[1400px] mx-auto p-4 sm:p-6">
      
      {/* 🟢 Top Header Banner */}
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div>
          <span className="text-xs font-black text-emerald-400 uppercase tracking-widest block">
            HERO SLIDER CONTROL
          </span>
          <h1 className="text-2xl font-black text-white">
            Home Page Hero Banner Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            হোম পেজের প্রধান স্লাইডারের ছবি, টাইটেল ও লিংক এখান থেকে সরাসরি পরিবর্তন করুন।
          </p>
        </div>
        <button
          onClick={loadBanners}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          🔄 রিফ্রেশ ব্যানার তালিকা ({banners.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 🟢 Upload New Banner Form (Left Column) */}
        <div className="lg:col-span-1 bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5 h-fit">
          <h2 className="text-base font-black text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <span>🖼️</span> নতুন স্লাইডার ব্যানার যোগ করুন
          </h2>

          <form onSubmit={handleAddBanner} className="space-y-4">
            
            {/* Banner Image Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                ব্যানার ইমেজ বেছে নিন * (Recommended 1400x520px)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-bold file:text-xs hover:file:bg-emerald-500"
                required
              />
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold">
                  ব্যানার প্রিভিউ:
                </span>
                <div className="w-full h-32 bg-[#0F172A] rounded-2xl overflow-hidden border border-emerald-500/50 p-1">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* Banner Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                ব্যানার টাইটেল (Optional)
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="যেমন: Big Eid Special Discount Offer"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Banner Subtitle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                সাব-টাইটেল / ক্যাপশন (Optional)
              </label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="যেমন: Up to 50% Cashback Rewards"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Target Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                ক্লিক করলে যে পেজে যাবে (Target Link)
              </label>
              <input
                type="text"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="/shop অথবা /offers"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={publishing}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {publishing ? "আপলোড হচ্ছে..." : "🚀 স্লাইডারে প্রকাশ করুন"}
            </button>
          </form>
        </div>

        {/* 🟢 Live Active Banners Grid (Right Column) */}
        <div className="lg:col-span-2 bg-[#1E293B] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>🎯</span> বর্তমানে যুক্ত স্লাইডার সমূহের তালিকা
            </h2>
            <span className="text-xs font-bold text-slate-400 bg-[#0F172A] px-3 py-1 rounded-xl border border-slate-700">
              মোট: {banners.length} টি
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs font-bold text-emerald-400 animate-pulse">
              ডাটাবেস থেকে ব্যানার লোড করা হচ্ছে...
            </div>
          ) : banners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((b, idx) => (
                <div
                  key={b._id || idx}
                  className={`bg-[#0F172A] p-4 rounded-2xl border ${
                    b.isActive ? "border-emerald-500/50" : "border-slate-800 opacity-60"
                  } shadow-md space-y-3 relative overflow-hidden flex flex-col justify-between`}
                >
                  {/* Banner Image Display */}
                  <div className="relative w-full h-36 bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                    <img
                      src={b.image}
                      alt={b.title || "Banner"}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Status Badge */}
                    <span
                      className={`absolute top-2 right-2 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        b.isActive
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {b.isActive ? "Active Live" : "Disabled"}
                    </span>
                  </div>

                  {/* Banner Meta Info */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-white line-clamp-1">
                      {idx + 1}. {b.title || "Untitled Banner"}
                    </h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1">
                      {b.subtitle || "No Subtitle"}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-mono">
                      🔗 {b.link || "/shop"}
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    {/* Status Toggle Button */}
                    <button
                      onClick={() => handleToggleStatus(b._id, b.isActive)}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        b.isActive
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                      }`}
                    >
                      {b.isActive ? "Pause / Off" : "Enable Live"}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteBanner(b._id)}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                    >
                      🗑️ Delete
                    </button>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center space-y-2 bg-[#0F172A] rounded-2xl border border-slate-800">
              <div className="text-4xl">🏜️</div>
              <p className="text-xs font-bold text-slate-400">
                এখনো কোনো স্লাইডার ব্যানার যোগ করা হয়নি। বামপাশের ফর্ম ব্যবহার করে নতুন ব্যানার যোগ করুন।
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}