import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

export default function Login() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(phone, password)
      navigate('/')
    } catch (err) {
      setError('Login failed. Check your phone and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-brand-green text-white px-6 pt-16 pb-10 rounded-b-3xl">
        <div className="w-14 h-14 rounded-2xl bg-white text-brand-green font-extrabold flex items-center justify-center text-xl mb-3">bss</div>
        <h1 className="text-2xl font-bold">Bright Smart Shop</h1>
        <p className="text-white/80 text-sm">Smart Shopping, Better Living</p>
      </div>

      <div className="px-6 -mt-4">
        <div className="card p-1 flex">
          <Link to="/login" className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-center font-semibold text-sm">Log in</Link>
          <Link to="/register" className="flex-1 py-2.5 rounded-xl text-slate-500 text-center font-semibold text-sm">Register</Link>
        </div>
      </div>

      <form onSubmit={submit} className="px-6 mt-6 flex flex-col gap-4 flex-1">
        <div>
          <label className="text-sm font-medium text-slate-700">Phone number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="input-field mt-1.5"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Password</label>
          <div className="relative mt-1.5">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-label="Toggle password visibility"
            >
              {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 accent-brand-green" />
          Remember me
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-green font-semibold">Register</Link>
        </p>
      </form>
    </div>
  )
}
