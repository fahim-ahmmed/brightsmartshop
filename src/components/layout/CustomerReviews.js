"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function CustomerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
    topic: "পণ্য ও সার্ভিস",
    rating: 5,
    comment: "",
  });

  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetch("/api/reviews", { cache: "no-store" });
        const data = await res.json();
        if (data.success && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();

    try {
      const saved = localStorage.getItem("bright_user");
      if (saved) {
        const u = JSON.parse(saved);
        setForm((prev) => ({
          ...prev,
          name: u.name || prev.name,
          address: u.address || prev.address,
        }));
      }
    } catch {}
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.comment.trim()) {
      toast.error("অনুগ্রহ করে আপনার নাম এবং রিভিউ লিখুন।");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "Website" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "রিভিউ সেভ করা যায়নি।");

      toast.success(data.message || "আপনার রিভিউ যুক্ত হয়েছে!");
      if (data.review) {
        setReviews((prev) => [data.review, ...prev]);
      }
      setForm((prev) => ({ ...prev, topic: "পণ্য ও সার্ভিস", rating: 5, comment: "" }));
      setShowForm(false);
    } catch (err) {
      toast.error(err.message || "সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / reviews.length).toFixed(1)
      : "5.0";

  // শুরুতে মাত্র ৪টি দেখাবে, More-এ ক্লিক করলে সব দেখাবে
  const visibleReviews = showAll ? reviews : reviews.slice(0, 4);

  return (
    <section className="w-full bg-white border-t border-gray-100 py-5 px-4 sm:px-8 font-sans text-gray-800">
      <div className="max-w-[1400px] mx-auto space-y-3.5">
        {/* Compact Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-sm sm:text-base font-black text-gray-900">
              ⭐ গ্রাহকদের রিভিউ ({reviews.length})
            </h2>
            <span className="text-[11px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
              ★ {avgRating} / 5.0
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="px-3.5 py-1.5 bg-[#00875A] hover:bg-[#00704A] text-white font-black text-[11px] rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
          >
            {showForm ? "✕ বন্ধ করুন" : "✍️ রিভিউ দিন"}
          </button>
        </div>

        {/* Compact Review Submit Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-slate-50 rounded-2xl border border-emerald-200 p-3.5 space-y-2.5 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="আপনার নাম *"
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-[#00875A]"
              />
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="ঠিকানা (যেমন: কুষ্টিয়া)"
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-[#00875A]"
              />
              <input
                type="text"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="বিষয় (প্যাকেজ / ডেলিভারি)"
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-[#00875A]"
              />
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-1.5">
                <span className="font-bold text-gray-600">রেটিং:</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setForm({ ...form, rating: star })}
                      className={`text-base cursor-pointer ${
                        star <= form.rating ? "text-amber-400" : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                required
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                placeholder="আপনার সংক্ষিপ্ত মতামত লিখুন... *"
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-[#00875A]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-[#00875A] hover:bg-[#00704A] text-white font-black rounded-xl cursor-pointer disabled:opacity-50 shrink-0"
              >
                {submitting ? "সেভ হচ্ছে..." : "✅ সাবমিট"}
              </button>
            </div>
          </form>
        )}

        {/* Compact Grid + More Button */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {visibleReviews.map((rev) => (
                <div
                  key={rev._id}
                  className="bg-slate-50/90 hover:bg-white rounded-2xl border border-gray-200/80 p-3 shadow-2xs transition-all flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-amber-400 text-xs leading-none">
                        {"★".repeat(Number(rev.rating || 5))}
                      </span>
                      <span className="text-[9px] font-bold bg-emerald-50 text-[#00875A] px-2 py-0.5 rounded-full border border-emerald-100 truncate max-w-[125px]">
                        {rev.topic || "রিভিউ"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-700 leading-snug line-clamp-2 font-medium">
                      “{rev.comment}”
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-200/60 text-[10px]">
                    <span className="font-black text-gray-900 truncate max-w-[135px]">
                      👤 {rev.name}
                    </span>
                    <span className="text-gray-500 truncate max-w-[100px]">
                      📍 {rev.address}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {reviews.length > 4 && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  className="px-5 py-1.5 bg-slate-100 hover:bg-emerald-50 text-gray-700 hover:text-[#00875A] border border-gray-200 hover:border-emerald-200 font-black text-xs rounded-xl transition-all cursor-pointer"
                >
                  {showAll
                    ? "▲ সংক্ষিপ্ত করুন (Show Less)"
                    : `▼ আরও রিভিউ দেখুন (${reviews.length - 4}+ More)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}