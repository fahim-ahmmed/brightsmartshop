import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/index.js'

export default function Checkout() {
  const { cart, cartTotal, cartPoints, cartCount, user, setUser, clearCart } = useApp()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || user?.mobile || '',
    address: user?.address || '',
    paymentMethod: 'office_receive',
    senderNumber: '',
    transactionId: '',
  })

  const [userCustomerId, setUserCustomerId] = useState(
    user?.referralCode || user?.customerId || user?.id || ''
  )
  const [userSponsor, setUserSponsor] = useState(
    user?.sponsorCode && user?.sponsorCode !== 'SYSTEM-TOP' ? user.sponsorCode : ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const uid = user?._id || user?.id || ''
        const uphone = user?.phone || user?.mobile || ''
        const data = await api.getDashboardStats(uid, uphone, user?.email || '')
        if (active && data?.user) {
          const myBssId = data.user.referralCode || data.user.id || ''
          const mySp = data.user.sponsorCode !== 'SYSTEM-TOP' ? (data.user.sponsorCode || '') : ''
          setUserCustomerId(myBssId)
          setUserSponsor(mySp)
          setFormData(prev => ({
            ...prev,
            name: data.user.name || prev.name,
            phone: data.user.mobile || data.user.phone || prev.phone,
            address: data.user.address || prev.address,
          }))
          setUser({
            ...user,
            ...data.user,
            id: myBssId,
            customerId: myBssId,
            referralCode: myBssId,
          })
        }
      } catch {}
    })()
    return () => { active = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isOfficeReceive = formData.paymentMethod === 'office_receive'
  const deliveryCharge = isOfficeReceive ? 0 : cartPoints >= 200 ? 0 : 120
  const totalAmount = cartTotal + deliveryCharge

  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    if (loading || cart.length === 0) return

    if (!formData.name || !formData.phone) {
      setError('অনুগ্রহ করে আপনার নাম ও মোবাইল নম্বর দিন।')
      return
    }

    if (!isOfficeReceive && !formData.address) {
      setError('অনুগ্রহ করে আপনার সম্পূর্ণ ঠিকানা দিন।')
      return
    }

    if (
      formData.paymentMethod !== 'cod' &&
      formData.paymentMethod !== 'office_receive' &&
      (!formData.senderNumber || !formData.transactionId)
    ) {
      setError('অনুগ্রহ করে সেন্ডার নম্বর এবং Transaction ID প্রদান করুন।')
      return
    }

    setError('')
    setLoading(true)

    try {
      const orderPayload = {
        userId: user?._id || user?.id || null,
        customerId: userCustomerId,
        referralCode: userCustomerId,
        customerName: formData.name,
        phone: formData.phone,
        address: isOfficeReceive
          ? formData.address
            ? `${formData.address} (অফিস রিসিভ)`
            : 'অফিস রিসিভ (Office Pickup)'
          : formData.address,
        paymentMethod: formData.paymentMethod,
        paymentDetails: {
          senderNumber: formData.senderNumber,
          transactionId: formData.transactionId,
          officialNumber: '01727629513',
        },
        items: cart,
        subtotalPrice: cartTotal,
        totalPoints: cartPoints,
        points: cartPoints,
        deliveryCharge,
        totalAmount,
        status: 'Pending',
        sponsorId: userSponsor || userCustomerId,
        sponsorCode: userSponsor || '',
        createdAt: new Date(),
      }

      await api.placeOrder(orderPayload)
      clearCart()
      alert('🎉 আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!')
      navigate('/orders')
    } catch (err) {
      setError(err.message || 'অর্ডার জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-4 font-sans text-gray-800 space-y-4">
      <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs">
        <h1 className="text-xl font-black text-[#00875A]">Checkout & Delivery</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          আপনার ঠিকানা ও পেমেন্ট সিলেক্ট করে অর্ডার নিশ্চিত করুন
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} className="space-y-4">
        {/* ১. শিপিং ঠিকানা */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-gray-900 border-b border-gray-100 pb-2.5">
            ১. শিপিং ঠিকানা
          </h2>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold block mb-1">আপনার নাম *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="আপনার নাম লিখুন"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#00875A]"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">ফোন নম্বর *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="017XXXXXXXX"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#00875A]"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">
                সম্পূর্ণ ঠিকানা {!isOfficeReceive && '*'}
              </label>
              <textarea
                required={!isOfficeReceive}
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={
                  isOfficeReceive
                    ? 'অফিস রিসিভ (প্রয়োজনে নোট বা ঠিকানা লিখতে পারেন - ঐচ্ছিক)'
                    : 'বাসা নং, রোড নং, এলাকা, জেলা...'
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#00875A]"
              />
            </div>

            {/* ইউজারের নিজের আইডি এবং স্পন্সর আইডি প্রদর্শন */}
            <div className="grid grid-cols-1 gap-2">
              {userCustomerId && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2">
                  <span className="text-emerald-900 font-bold text-xs">
                    🆔 আপনার আইডি: <span className="font-mono font-black">{userCustomerId}</span>
                  </span>
                </div>
              )}
              {userSponsor && (
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center gap-2">
                  <span className="text-amber-800 font-bold text-xs">
                    🤝 স্পন্সর আইডি: <span className="font-mono font-black">{userSponsor}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ২. ডেলিভারি ও পেমেন্ট সিলেক্ট করুন */}
          <h2 className="text-sm font-extrabold text-gray-900 border-b border-gray-100 pb-2.5 pt-2">
            ২. ডেলিভারি ও পেমেন্ট সিলেক্ট করুন
          </h2>

          <div className="space-y-2.5">
            <label
              className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer ${
                formData.paymentMethod === 'office_receive'
                  ? 'border-[#00875A] bg-emerald-50/50'
                  : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="office_receive"
                checked={formData.paymentMethod === 'office_receive'}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="accent-[#00875A]"
              />
              <span className="text-xs font-bold text-emerald-800">
                🏢 অফিস রিসিভ (Office Pickup - চার্জ ৳০) [Default]
              </span>
            </label>

            <label
              className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer ${
                formData.paymentMethod === 'cod'
                  ? 'border-[#00875A] bg-emerald-50/50'
                  : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={formData.paymentMethod === 'cod'}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="accent-[#00875A]"
              />
              <span className="text-xs font-bold text-gray-800">
                💵 ক্যাশ অন ডেলিভারি (Cash on Delivery)
              </span>
            </label>

            <label
              className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer ${
                formData.paymentMethod === 'bkash'
                  ? 'border-pink-500 bg-pink-50/50'
                  : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="bkash"
                checked={formData.paymentMethod === 'bkash'}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="accent-pink-600"
              />
              <span className="text-xs font-bold text-pink-700">
                💖 বিকাশ সেন্ড মানি
              </span>
            </label>

            <label
              className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer ${
                formData.paymentMethod === 'nagad'
                  ? 'border-orange-500 bg-orange-50/50'
                  : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="nagad"
                checked={formData.paymentMethod === 'nagad'}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="accent-orange-600"
              />
              <span className="text-xs font-bold text-orange-700">
                🟠 নগদ সেন্ড মানি
              </span>
            </label>
          </div>

          {(formData.paymentMethod === 'bkash' || formData.paymentMethod === 'nagad') && (
            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-3 text-xs border border-slate-800">
              <p className="font-bold text-emerald-400">
                📲 বিকাশ / নগদ সেন্ড মানি নম্বর:
              </p>
              <div className="bg-slate-800 p-2.5 rounded-xl text-center text-sm font-black text-amber-400 font-mono">
                01727629513
              </div>
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  placeholder="যে নম্বর থেকে সেন্ড করেছেন"
                  value={formData.senderNumber}
                  onChange={(e) => setFormData({ ...formData, senderNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Transaction ID (TrxID)"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white uppercase"
                />
              </div>
            </div>
          )}
        </div>

        {/* অর্ডার সামারি */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-gray-900 border-b border-gray-100 pb-2.5">
            অর্ডার সামারি
          </h2>

          <div className="space-y-2.5 text-xs font-bold">
            <div className="flex justify-between">
              <span>প্রোডাক্ট সাবটোটাল ({cartCount} টি)</span>
              <span>৳{cartTotal}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>মোট অর্জিত পয়েন্ট</span>
              <span className="text-[#00875A] font-black bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                🌟 {cartPoints} পয়েন্ট
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>ডেলিভারি চার্জ</span>
              {isOfficeReceive ? (
                <span className="text-emerald-600 font-black bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  🏢 ফ্রি (অফিস রিসিভ)
                </span>
              ) : deliveryCharge === 0 ? (
                <span className="text-emerald-600 font-black bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  🎉 ফ্রি (২০০+ পয়েন্ট অফার)
                </span>
              ) : (
                <span className="text-gray-900 font-bold">৳{deliveryCharge}</span>
              )}
            </div>

            {!isOfficeReceive && cartPoints < 200 && (
              <p className="text-[11px] text-amber-700 font-extrabold bg-amber-50 p-2.5 rounded-2xl border border-amber-200/80 leading-relaxed">
                💡 টিপস: আপনার অর্ডারে ২০০ পয়েন্ট বা তার বেশি থাকলে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি হয়ে যাবে! (বর্তমান পয়েন্ট: {cartPoints})
              </p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-black">
            <span>সর্বমোট বিল:</span>
            <span className="text-[#00875A] text-base">৳{totalAmount}</span>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold p-3 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || cart.length === 0}
            className={`w-full py-3.5 text-white font-black text-xs rounded-xl shadow-md transition-all ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#00875A] hover:bg-[#00704A] cursor-pointer'
            }`}
          >
            {loading ? 'প্রসেস হচ্ছে...' : '✅ কনফার্ম অর্ডার করুন'}
          </button>
        </div>
      </form>
    </div>
  )
}