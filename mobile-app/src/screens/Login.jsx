import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import Header, { BssLogo } from '../components/Header.jsx'

export default function Login() {
  const { login } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const redirectTo = params.get('redirect') || '/'

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      await login(identifier, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setErrorMsg('⚠️ মোবাইল নম্বর/ইমেইল অথবা পাসওয়ার্ড সঠিক নয়!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-800">
      <Header />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xl space-y-5">
          {/* Website Logo & Title */}
          <div className="flex flex-col items-center text-center space-y-2">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <BssLogo size="lg" />
              <span className="font-serif font-black text-xl text-[#00875A] tracking-tight">
                Bright Smart Shop
              </span>
            </Link>
            <p className="text-xs text-gray-500 font-medium">
              আপনার মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে লগইন করুন
            </p>
          </div>

          {/* Toggle Pills */}
          <div className="bg-slate-100 p-1 rounded-2xl flex">
            <Link
              to={`/login${location.search}`}
              className="flex-1 py-2.5 rounded-xl bg-[#00875A] text-white text-center font-black text-xs shadow-xs"
            >
              লগইন (Log in)
            </Link>
            <Link
              to={`/register${location.search}`}
              className="flex-1 py-2.5 rounded-xl text-gray-600 text-center font-bold text-xs"
            >
              রেজিস্টার (Register)
            </Link>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold p-3.5 rounded-2xl text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1.5">
                মোবাইল নম্বর *
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00875A] font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1.5">
                পাসওয়ার্ড *
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-11 text-xs focus:outline-none focus:border-[#00875A] font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#00875A] hover:bg-[#00704A] text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer mt-2"
            >
              {loading ? 'প্রসেস হচ্ছে...' : 'লগইন করুন'}
            </button>
          </form>

          <div className="border-t border-gray-100 pt-4 text-center space-y-2 text-xs">
            <p className="text-gray-500 font-medium">
              অ্যাকাউন্ট নেই?{' '}
              <Link
                to={`/register${location.search}`}
                className="font-black text-[#F25C05] hover:underline"
              >
                নতুন অ্যাকাউন্ট তৈরি করুন
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}