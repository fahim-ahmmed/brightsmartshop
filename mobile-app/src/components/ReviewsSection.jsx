import React, { useEffect, useState } from 'react'
import { api } from '../api/index.js'
import { useApp } from '../context/AppContext.jsx'

export default function ReviewsSection() {
  const { user } = useApp()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')

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
      } catch (e) {
        console.error(e)
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
    setMsg('')
    try {
      const data = await api.submitReview({ ...form, source: 'App' })
      if (data.review) {
        setReviews(prev => [data.review, ...prev])
      }
      setMsg('✅ আপনার রিভিউটি সফলভাবে যুক্ত হয়েছে!')
      setForm(prev => ({ ...prev, topic: 'পণ্য ও সার্ভিস', rating: 5, comment: '' }))
      setShowForm(false)
    } catch (err) {
      setMsg(`⚠️ ${err.message || 'রিভিউ সেভ করা যায়নি।'}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-slate-900 border-l-4 border-[#007A4D] pl-2.5 leading-none">
          গ্রাহকদের রিভিউ ({reviews.length})
        </h2>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="text-[11px] font-extrabold bg-[#E8F5E9] text-[#006E32] px-3 py-1.5 rounded-full"
        >
          {showForm ? '✕ বন্ধ করুন' : '✍️ রিভিউ দিন'}
        </button>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3.5 py-2.5 rounded-2xl">
          {msg}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-emerald-200 p-4 space-y-3 text-xs shadow-sm"
        >
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="আপনার নাম *"
            className="input-field py-2"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="ঠিকানা (যেমন: ঢাকা)"
              className="input-field py-2"
            />
            <input
              type="text"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="বিষয় (যেমন: ডেলিভারি)"
              className="input-field py-2"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600">রেটিং:</span>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm({ ...form, rating: s })}
                className={`text-lg ${s <= form.rating ? 'text-amber-400' : 'text-slate-300'}`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            required
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            placeholder="আপনার অভিজ্ঞতা লিখুন *"
            className="input-field py-2 resize-none"
          />

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-2.5 text-xs"
          >
            {submitting ? 'সেভ হচ্ছে...' : '✅ রিভিউ প্রকাশ করুন'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl h-28 animate-pulse border border-slate-100" />
      ) : (
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {reviews.slice(0, 10).map((rev) => (
            <div
              key={rev._id}
              className="shrink-0 w-[260px] bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col justify-between space-y-2.5"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 text-xs">
                    {'★'.repeat(Number(rev.rating || 5))}
                  </span>
                  <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#006E32] px-2 py-0.5 rounded-full truncate max-w-[125px]">
                    {rev.topic || 'সাধারণ রিভিউ'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed line-clamp-4">
                  “{rev.comment}”
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#006E32] text-white font-black text-[11px] flex items-center justify-center shrink-0">
                  {(rev.name || 'U')[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-900 truncate">{rev.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">📍 {rev.address}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}