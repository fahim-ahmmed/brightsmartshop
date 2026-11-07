import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Truck } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/index.js'

const TABS = ['All', 'Processing', 'Delivered', 'Cancelled']

const STEP_BAR = ['Confirmed', 'Packed', 'Delivered']

function statusOf(o) {
  const s = String(o.status || '').toLowerCase()
  if (s === 'cancelled') return 'Cancelled'
  if (s === 'delivered') return 'Delivered'
  if (s === 'paid') return 'Paid'
  return 'Processing'
}

export default function MyOrders() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('All')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await api.getOrders(user?._id || user?.id || '', user?.phone || '')
        if (active) setOrders(res.orders || [])
      } catch (e) {
        if (active) setOrders([])
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [user])

  const filtered = useMemo(() => {
    if (tab === 'All') return orders
    return orders.filter(o => statusOf(o) === tab)
  }, [orders, tab])

  const stepIndex = (o) => {
    const s = String(o.status || '').toLowerCase()
    if (s === 'delivered') return 3
    if (s === 'packed') return 2
    if (s === 'confirmed' || s === 'paid') return 1
    return 0
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="px-4 py-3 border-b border-slate-100 bg-white flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate('/me')} aria-label="Back"><ArrowLeft size={22} /></button>
        <h1 className="text-sm font-semibold text-slate-800">My Orders</h1>
      </header>

      <div className="px-4 py-3 sticky top-[49px] bg-slate-50 z-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium ${tab === t ? 'bg-brand-green text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {loading ? (
          [0, 1].map(i => <div key={i} className="card h-40 animate-pulse bg-slate-100" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">No orders found.</p>
            <button onClick={() => navigate('/')} className="btn-outline mt-4">Start shopping</button>
          </div>
        ) : (
          filtered.map(o => {
            const status = statusOf(o)
            const items = o.items || []
            const total = o.totalAmount || o.subtotal || 0
            const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''
            const step = stepIndex(o)
            return (
              <div key={o._id} className="card p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">#{o.orderNo || o.orderId || 'BSS'}</p>
                    <p className="text-[11px] text-slate-400">{date}</p>
                  </div>
                  <span className={`badge ${
                    status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                    status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                    status === 'Paid' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{status}</span>
                </div>

                <div className="flex items-center gap-2">
                  {items.slice(0, 3).map((it, i) => (
                    <img
                      key={i}
                      src={it.image && String(it.image).startsWith('http') ? it.image : 'https://placehold.co/48x48/E8F5E9/007A4D?text=BSS'}
                      alt={it.title}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                      onError={(e) => { e.target.src = 'https://placehold.co/48x48/E8F5E9/007A4D?text=BSS' }}
                    />
                  ))}
                  <div className="text-xs text-slate-500">
                    {items.length} item{items.length !== 1 ? 's' : ''} · ৳{total}
                  </div>
                </div>

                {/* Step bar */}
                <div className="flex items-center">
                  {STEP_BAR.map((s, i) => (
                    <React.Fragment key={s}>
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${i < step ? 'bg-brand-green text-white' : 'bg-slate-200 text-slate-400'}`}>
                          {i < step ? '✓' : i + 1}
                        </div>
                        <span className="text-[9px] text-slate-500 mt-0.5">{s}</span>
                      </div>
                      {i < STEP_BAR.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-brand-green' : 'bg-slate-200'}`} />}
                    </React.Fragment>
                  ))}
                </div>

                <button
                  onClick={() => navigate(`/track/${o.orderNo || o.orderId}`)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-brand-green border border-brand-green rounded-lg py-2"
                >
                  <Truck size={14} /> Track order
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
