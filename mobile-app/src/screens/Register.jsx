import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/index.js'

export default function Register() {
  const navigate = useNavigate()
  const { setUser } = useApp()
  const [form, setForm] = useState({ name: '', phone: '', sponsorCode: '', address: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.register(form)
      if (data?.user) {
        setUser(data.user)
        localStorage.setItem('bss_user', JSON.stringify(data.user))
        navigate('/')
      } else {
        navigate('/login')
      }
    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-brand-green text-white px-6 pt-16 pb-10 rounded-b-3xl">
        <div className="w-14 h-14 rounded-2xl bg-white text-brand-green font-extrabold flex items-center justify-center text-xl mb-3">bss</div>
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-white/80 text-sm">Join Bright Smart Shop today</p>
      </div>

      <div className="px-6 -mt-4">
        <div className="card p-1 flex">
          <Link to="/login" className="flex-1 py-2.5 rounded-xl text-slate-500 text-center font-semibold text-sm">Log in</Link>
          <Link to="/register" className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-center font-semibold text-sm">Register</Link>
        </div>
      </div>

      <form onSubmit={submit} className="px-6 mt-6 flex flex-col gap-4 flex-1">
        <div>
          <label className="text-sm font-medium text-slate-700">Full name</label>
          <input value={form.name} onChange={set('name')} className="input-field mt-1.5" placeholder="Your full name" required />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Phone number</label>
          <input type="tel" value={form.phone} onChange={set('phone')} className="input-field mt-1.5" placeholder="01XXXXXXXXX" required />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Sponsor Code <span className="text-slate-400">(optional)</span></label>
          <input value={form.sponsorCode} onChange={set('sponsorCode')} className="input-field mt-1.5" placeholder="BSS-XXXX" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Address</label>
          <textarea value={form.address} onChange={set('address')} className="input-field mt-1.5" rows={2} placeholder="Your address" required />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Password</label>
          <input type="password" value={form.password} onChange={set('password')} className="input-field mt-1.5" placeholder="••••••••" required />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? 'Creating…' : 'Register'}
        </button>
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-green font-semibold">Log in</Link>
        </p>
      </form>
    </div>
  )
}
