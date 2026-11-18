import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Star, MessageSquarePlus, X } from 'lucide-react'
import { api } from '../api/index.js'
import { useApp } from '../context/AppContext.jsx'

export default function Reviews() {
  const navigate = useNavigate()
  const { user } = useApp()

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState({ type: '', text: '' })

  const [form, setForm] = useState({
    name: user?.name || '',
    address: user?.address || '',
    topic: 'পণ্য ও সার্ভিস',
    rating: 5,
    comment: '',
  })

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await api.getReviews()
        if (active && Array.isArray(data.reviews)) {
          setReviews(data.reviews)
        }
      } catch (err) {
        console.error('Failed to load reviews:', err)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.comment.trim()) return

    setSubmitting(true)
    setNotice({ type: '', text: '' })
    try {
      const data = await api.submitReview({ ...form, source: 'App' })
      if (data.review) {
        setReviews((prev) => [data.review, ...prev])
      }
      setNotice({
        type: 'success',
        text: data.message || 'আপনার রিভিউটি সফলভাবে যুক্ত হয়েছে!',
      })
      setForm((prev) => ({
        ...prev,
        topic: 'পণ্য ও সার্ভিস',
        rating: 5,
        comment: '',
      }))
      setShowForm(false)
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.message || 'রিভিউ সেভ করতে সমস্যা হয়েছে।',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / reviews.length).toFixed(1)
      : '5.0'

  return (
    <div className="px-4 py-3 space-y-4 font-sans text-gray-800">
      {/* Top Back Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm font-black text-gray-900"
        >
          <ChevronLeft size={18} /> গ্রাহকদের রিভিউ
        </button>

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#00875A] text-white text-xs font-black rounded-xl shadow-xs active:scale-95 transition"
        >
          {showForm ? <X size={14} /> : <MessageSquarePlus size={14} />}
          <span>{showForm ? 'বন্ধ করুন' : 'রিভিউ দিন'}</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-900 text-white rounded-3xl p-5 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block">
            CUSTOMER FEEDBACK
          </span>
          <h1 className="text-lg font-black">ব্রাইট স্মার্ট শপ রিভিউ</h1>
          <p className="text-[11px] text-emerald-100">
            মোট {reviews.length} জন গ্রাহকের যাচাইকৃত মতামত
          </p>
        </div>

        <div className="bg-white/15 border border-white/20 rounded-2xl px-4 py-2.5 text-center shrink-0">
          <div className="text-amber-300 font-black text-lg leading-none">
            ★ {avgRating}
          </div>
          <span className="text-[10px] text-emerald-100 font-bold">Out of 5.0</span>
        </div>
      </div>

      {/* Status Notice */}
      {notice.text && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold ${
            notice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}
        >
          {notice.type === 'success' ? '✅ ' : '⚠️ '}
          {notice.text}
        </div>
      )}

      {/* Add Review Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-emerald-200 p-5 shadow-sm space-y-3.5 text-xs"
        >
          <h2 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2">
            ✍️ আপনার অভিজ্ঞতা শেয়ার করুন
          </h2>

          <div>
            <label className="font-bold text-gray-700 block mb-1">আপনার নাম *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="আপনার পূর্ণ নাম"
              className="input-field py-2.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">ঠিকানা / শহর</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="যেমন: কুষ্টিয়া / ঢাকা"
                className="input-field py-2.5"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">বিষয়</label>
              <input
                type="text"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="যেমন: প্যাকেজ / ডেলিভারি"
                className="input-field py-2.5"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">রেটিং নির্বাচন করুন *</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, rating: s })}
                  className="p-1 active:scale-125 transition"
                >
                  <Star
                    size={22}
                    className={
                      s <= form.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }
                  />
                </button>
              ))}
              <span className="ml-auto text-xs font-black text-amber-600">
                {form.rating} / 5 Stars
              </span>
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">আপনার মতামত *</label>
            <textarea
              rows={3}
              required
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="পণ্য বা সার্ভিস সম্পর্কে আপনার মতামত লিখুন..."
              className="input-field py-2.5 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#00875A] hover:bg-[#00704A] text-white font-black rounded-2xl shadow-sm disabled:opacity-50"
          >
            {submitting ? 'সেভ হচ্ছে...' : '✅ রিভিউ প্রকাশ করুন'}
          </button>
        </form>
      )}

      {/* All Reviews List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100"
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center text-xs text-gray-500">
          এখনো কোনো রিভিউ নেই। প্রথম রিভিউটি আপনিই দিন!
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div
              key={rev._id}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00875A] to-teal-400 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {(rev.name || 'U')[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-gray-900 truncate">
                      {rev.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 truncate">
                      📍 {rev.address || 'বাংলাদেশ'}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold bg-emerald-50 text-[#00875A] px-2.5 py-0.5 rounded-full border border-emerald-100 shrink-0">
                  {rev.topic || 'রিভিউ'}
                </span>
              </div>

              <div className="text-amber-400 text-xs tracking-tight">
                {'★'.repeat(Number(rev.rating || 5))}
                <span className="text-gray-200">
                  {'★'.repeat(5 - Number(rev.rating || 5))}
                </span>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                “{rev.comment}”
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}