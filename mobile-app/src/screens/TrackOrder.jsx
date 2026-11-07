import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, CheckCircle, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/index.js'

const TIMELINE = [
  { label: 'Order placed', key: 'placed' },
  { label: 'Order confirmed', key: 'confirmed' },
  { label: 'Packed', key: 'packed' },
  { label: 'Out for delivery', key: 'out' },
  { label: 'Delivered', key: 'delivered' },
]

function stepFromStatus(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'delivered') return 5
  if (s === 'out for delivery') return 4
  if (s === 'packed') return 3
  if (s === 'confirmed' || s === 'paid') return 2
  if (s === 'pending') return 1
  return 1
}

export default function TrackOrder() {
  const { orderNo } = useParams()
  const navigate = useNavigate()
  const { user } = useApp()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await api.getOrders(user?._id || user?.id || '', user?.phone || '')
        const found = (res.orders || []).find(
          o => String(o.orderNo) === String(orderNo) || String(o.orderId) === String(orderNo)
        )
        if (active) setOrder(found || null)
      } catch {
        if (active) setError('Could not load order.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [orderNo, user])

  const fmt = (d) => d ? new Date(d).toLocaleString() : '—'

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="px-4 py-3 border-b border-slate-100 bg-white flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={22} /></button>
          <h1 className="text-sm font-semibold text-slate-800">Track Order</h1>
        </header>
        <div className="p-4 space-y-3">
          {[0, 1].map(i => <div key={i} className="card h-20 animate-pulse bg-slate-100" />)}
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="px-4 py-3 border-b border-slate-100 bg-white flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={22} /></button>
          <h1 className="text-sm font-semibold text-slate-800">Track Order</h1>
        </header>
        <div className="p-8 text-center">
          <p className="text-sm text-slate-500">{error || 'Order not found.'}</p>
          <button onClick={() => navigate('/orders')} className="btn-outline mt-4">Back to orders</button>
        </div>
      </div>
    )
  }

  const step = stepFromStatus(order.status)
  const items = order.items || []

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="px-4 py-3 border-b border-slate-100 bg-white flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={22} /></button>
        <h1 className="text-sm font-semibold text-slate-800">Track Order</h1>
      </header>

      <div className="px-4 py-3 space-y-4">
        {/* Order header */}
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">#{order.orderNo || order.orderId}</p>
              <p className="text-xs text-slate-400">Placed: {fmt(order.createdAt)}</p>
            </div>
            <span className={`badge ${
              step >= 5 ? 'bg-emerald-100 text-emerald-700' :
              order.status?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-600' :
              'bg-amber-100 text-amber-700'
            }`}>{order.status || 'Pending'}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="card p-4">
          <p className="text-sm font-semibold text-slate-800 mb-4">Order Status</p>
          <div className="relative">
            {TIMELINE.map((t, i) => {
              const done = i < step
              const active = i === step - 1
              return (
                <div key={t.key} className="flex gap-3">
                  {/* Dot + line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done || active ? 'bg-brand-green' : 'bg-slate-200'}`}>
                      {done ? <CheckCircle size={16} className="text-white" /> : active ? <Clock size={16} className="text-white" /> : <span className="text-[10px] text-slate-400">{i + 1}</span>}
                    </div>
                    {i < TIMELINE.length - 1 && (
                      <div className={`w-0.5 flex-1 min-h-[28px] ${done ? 'bg-brand-green' : 'bg-slate-200'}`} />
                    )}
                  </div>
                  {/* Label */}
                  <div className={`pb-6 ${i === TIMELINE.length - 1 ? 'pb-0' : ''}`}>
                    <p className={`text-sm font-medium ${done || active ? 'text-slate-800' : 'text-slate-400'}`}>{t.label}</p>
                    {active && <p className="text-xs text-brand-green">In progress</p>}
                    {done && i === 0 && <p className="text-xs text-slate-400">{fmt(order.createdAt)}</p>}
                    {done && i === 1 && <p className="text-xs text-slate-400">{fmt(order.confirmedAt || order.updatedAt)}</p>}
                    {done && i === 4 && <p className="text-xs text-slate-400">{fmt(order.deliveredAt || order.updatedAt)}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Items */}
        <div className="card p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-800">Items ({items.length})</p>
          {items.map((it, i) => {
            const img = it.image && String(it.image).startsWith('http') ? it.image : 'https://placehold.co/48x48/E8F5E9/007A4D?text=BSS'
            return (
              <div key={i} className="flex items-center gap-3">
                <img src={img} alt={it.title} className="w-12 h-12 rounded-lg object-cover bg-slate-100" onError={(e) => { e.target.src = 'https://placehold.co/48x48/E8F5E9/007A4D?text=BSS' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{it.title}</p>
                  <p className="text-xs text-slate-400">{it.unit || '1 Pcs'} × {it.quantity || 1}</p>
                </div>
                <p className="text-sm font-bold text-brand-green shrink-0">৳{it.price * (it.quantity || 1)}</p>
              </div>
            )
          })}
          <div className="border-t border-slate-100 pt-2 flex justify-between">
            <span className="text-sm font-bold text-slate-800">Total</span>
            <span className="text-sm font-bold text-brand-green">৳{order.totalAmount || order.subtotal || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
