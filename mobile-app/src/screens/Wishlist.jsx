import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { api, resolveImageUrl } from '../api/index.js'

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart, user } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('wishlist')

  const [requestData, setRequestData] = useState({
    productName: '',
    category: 'Grocery & Daily Essentials',
    estimatedBudget: '',
    description: '',
    contactNumber: user?.phone || user?.mobile || '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleRequestSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage({ type: '', text: '' })
    try {
      await api.requestProduct(requestData)
      setMessage({
        type: 'success',
        text: 'আপনার পণ্যের আবেদনটি সফলভাবে অ্যাডমিন প্যানেলে পাঠানো হয়েছে! ধন্যবাদ।',
      })
      setRequestData({
        productName: '',
        category: 'Grocery & Daily Essentials',
        estimatedBudget: '',
        description: '',
        contactNumber: user?.phone || user?.mobile || '',
      })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'আবেদন জমা দেওয়া যায়নি।' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-4 py-4 space-y-5 font-sans text-gray-800">
      {/* Top Header Banner (Matches Website src/app/wishlist/page.js) */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-5 rounded-3xl border border-emerald-500/20 shadow-md space-y-4">
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 inline-block">
            WISHLIST & REQUEST PORTAL
          </span>
          <h1 className="text-lg font-black">
            পছন্দের তালিকা ও নতুন পণ্যের আবেদন
          </h1>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            পছন্দের প্রোডাক্ট সেভ করে রাখুন অথবা শপে না থাকা প্রোডাক্টের জন্য অ্যাডমিনের কাছে আবেদন জানান।
          </p>
        </div>

        <div className="flex bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveTab('wishlist')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'wishlist' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            💖 My Wishlist ({wishlist.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('request')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'request' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            📝 Request Product
          </button>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* TAB 1: WISHLIST */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlist.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {wishlist.map((item) => {
                const img = resolveImageUrl(item.image) || 'https://brightsmartshop24.com/hero1.jpg'
                return (
                  <div
                    key={item._id || item.id}
                    className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-3 relative"
                  >
                    <button
                      onClick={() => toggleWishlist(item)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center z-10"
                      title="Remove from Wishlist"
                    >
                      ✕
                    </button>

                    <div className="flex items-center gap-3.5">
                      <img
                        src={img}
                        alt={item.title}
                        onClick={() => navigate(`/product/${item._id || item.id}`)}
                        className="w-20 h-20 rounded-2xl object-cover bg-gray-50 border border-gray-100 shrink-0 cursor-pointer"
                        onError={(e) => { e.target.src = 'https://placehold.co/100x100/E8F5E9/007A4D?text=BSS' }}
                      />
                      <div className="pr-6">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          {item.categoryName || item.category}
                        </span>
                        <h3
                          onClick={() => navigate(`/product/${item._id || item.id}`)}
                          className="font-extrabold text-sm text-gray-900 leading-snug mt-0.5 cursor-pointer"
                        >
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="text-base font-black text-gray-900">৳ {item.price}</div>
                        {Number(item.points) > 0 && (
                          <div className="text-[11px] text-amber-600 font-bold">
                            +{item.points} Points
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => { addToCart(item, 1); navigate('/cart') }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all"
                        >
                          🛒 Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white p-10 rounded-3xl border border-gray-100 text-center space-y-3">
              <div className="text-4xl">💔</div>
              <h3 className="font-extrabold text-base text-gray-900">
                আপনার উইশলিস্ট খালি!
              </h3>
              <div className="pt-1">
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl"
                >
                  শপে যান →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REQUEST PRODUCT */}
      {activeTab === 'request' && (
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">
              CUSTOM DEMAND
            </span>
            <h2 className="text-lg font-black text-gray-900">
              নতুন প্রোডাক্টের আবেদন করুন
            </h2>
          </div>

          <form onSubmit={handleRequestSubmit} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">পণ্যের নাম *</label>
              <input
                type="text"
                required
                placeholder="যেমন: Nestle Nido Milk Powder 1kg"
                value={requestData.productName}
                onChange={(e) => setRequestData({ ...requestData, productName: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">ক্যাটাগরি *</label>
                <select
                  value={requestData.category}
                  onChange={(e) => setRequestData({ ...requestData, category: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="Grocery & Daily Essentials">Grocery & Daily Essentials</option>
                  <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="Fashion & Accessories">Fashion & Accessories</option>
                  <option value="Health & Personal Care">Health & Personal Care</option>
                  <option value="Baby Care">Baby Care</option>
                  <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                  <option value="Dietary Supplement">Dietary Supplement</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">আনুমানিক বাজেট (৳)</label>
                <input
                  type="number"
                  placeholder="যেমন: 850"
                  value={requestData.estimatedBudget}
                  onChange={(e) => setRequestData({ ...requestData, estimatedBudget: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">যোগাযোগের মোবাইল নম্বর *</label>
              <input
                type="tel"
                required
                placeholder="যেমন: 017XXXXXXXX"
                value={requestData.contactNumber}
                onChange={(e) => setRequestData({ ...requestData, contactNumber: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">পণ্যের বিবরণ/লিংক (ঐচ্ছিক)</label>
              <textarea
                rows={3}
                placeholder="পণ্যটির সাইজ, ব্র্যান্ড বা অন্য বিবরণ..."
                value={requestData.description}
                onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-emerald-600 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all"
            >
              {submitting ? 'আবেদন পাঠানো হচ্ছে...' : 'আবেদন জমা দিন →'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}