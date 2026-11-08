import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/index.js'
import Header, { BssLogo } from '../components/Header.jsx'

const normalizeSponsorCode = (val) => {
  if (!val) return ''
  const s = String(val).trim()
  if (!s) return ''
  return s.toUpperCase().startsWith('BSS-')
    ? s.toUpperCase()
    : s.toUpperCase().startsWith('BSS')
    ? `BSS-${s.slice(3)}`
    : `BSS-${s}`
}

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const redirectTo = params.get('redirect') || '/me'

  const { setUser } = useApp()
  const [formData, setFormData] = useState({
    sponsorId: '',
    name: '',
    mobile: '',
    address: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const urlSponsor =
      params.get('sponsor') || params.get('ref') || params.get('referral') || ''
    if (urlSponsor) {
      setFormData(prev => ({
        ...prev,
        sponsorId: normalizeSponsorCode(urlSponsor),
      }))
    }
  }, [location.search]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!')
      return
    }

    setLoading(true)
    const cleanMobile = formData.mobile.trim()
    const cleanSponsor = formData.sponsorId.trim()
      ? normalizeSponsorCode(formData.sponsorId)
      : ''

    try {
      const res = await api.register({
        name: formData.name.trim(),
        mobile: cleanMobile,
        address: formData.address.trim(),
        sponsorId: cleanSponsor,
        password: formData.password,
      })

      let finalBssId = res?.user?.referralCode || res?.user?.id || ''
      if (!finalBssId) {
        try {
          const stats = await api.getDashboardStats('', cleanMobile, '')
          finalBssId = stats?.user?.referralCode || stats?.user?.id || ''
        } catch {}
      }

      const assignedId = finalBssId || 'BSS-20260011'
      alert(`🎉 রেজিস্ট্রেশন সফল হয়েছে! আপনার আইডি ও স্পন্সর কোড: ${assignedId}`)

      const userWithId = {
        ...(res?.user || {}),
        name: formData.name.trim(),
        phone: cleanMobile,
        mobile: cleanMobile,
        address: formData.address.trim(),
        id: assignedId,
        customerId: assignedId,
        referralCode: assignedId,
        sponsorCode: cleanSponsor,
        sponsorId: cleanSponsor,
      }
      setUser(userWithId)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setErrorMsg(err.message || 'এই মোবাইল নম্বর দিয়ে আগেই অ্যাকাউন্ট করা রয়েছে!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-800">
      <Header />

      <div className="flex-1 flex items-center justify-center p-4 py-6">
        <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xl space-y-5">
          <div className="text-center space-y-1.5">
            <Link to="/" className="inline-flex items-center justify-center gap-2.5">
              <BssLogo size="lg" />
              <span className="font-serif font-black text-xl text-[#00875A] tracking-tight">
                Bright Smart Shop
              </span>
            </Link>
            <h1 className="text-lg font-black text-gray-900 pt-1">
              নতুন অ্যাকাউন্ট তৈরি করুন
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              স্পন্সর আইডি ও আপনার সঠিক তথ্য দিয়ে রেজিস্ট্রেশন সম্পন্ন করুন
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold p-3.5 rounded-2xl text-center">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">
                আপনার পূর্ণ নাম *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="আপনার নাম লিখুন"
                className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00875A]"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                মোবাইল নম্বর *
              </label>
              <input
                type="tel"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="017XXXXXXXX"
                className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00875A]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  পাসওয়ার্ড *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="•••••••• (সর্বনিম্ন ৬-৮ অক্ষর)"
                  className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00875A]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  কনফার্ম পাসওয়ার্ড *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="আবার পাসওয়ার্ড দিন"
                  className={`w-full bg-gray-50/80 border rounded-xl px-4 py-3 text-xs focus:outline-none ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-gray-200 focus:border-[#00875A]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                সম্পূর্ণ ঠিকানা *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="বাসা নং, রোড, থানা, জেলা..."
                className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00875A]"
              />
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl space-y-1">
              <label className="font-black text-amber-900 flex items-center gap-1.5 text-xs">
                <span>🤝 রেফার / স্পন্সর আইডি (Sponsor ID)</span>
              </label>
              <input
                type="text"
                value={formData.sponsorId}
                onChange={(e) => setFormData({ ...formData, sponsorId: e.target.value })}
                placeholder="উদাহরণ: BSS-20260001 (যদি থাকে)"
                className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 font-bold font-mono focus:outline-none focus:border-[#00875A]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#F25C05] hover:bg-[#D95000] text-white font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer mt-2"
            >
              {loading ? 'প্রসেস হচ্ছে...' : '🚀 রেজিস্টার সম্পূর্ণ করুন'}
            </button>
          </form>

          <div className="border-t border-gray-100 pt-4 text-center text-xs">
            <p className="text-gray-500 font-medium">
              অলরেডি অ্যাকাউন্ট আছে?{' '}
              <Link to={`/login${location.search}`} className="font-black text-[#00875A] hover:underline">
                লগইন করুন
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}