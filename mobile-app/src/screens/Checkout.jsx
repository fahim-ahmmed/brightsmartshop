import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, CreditCard, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/index.js'

export default function Checkout() {
  const { cart, cartTotal, cartPoints, user, clearCart } = useApp()
  const navigate = useNavigate()
  const delivery = 60
  const total = cartTotal + delivery

  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
  })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setAddress(a => ({ ...a, [k]: e.target.value }))

  const placeOrder = async () => {
    if (!address.name || !address.phone || !address.address) {
      setError('Please fill in all delivery details.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const body = {
        userId: user?._id || user?.id || '',
        customerName: address.name,
        phone: address.phone,
        deliveryAddress: address.address,
        items: cart.map(i => ({
          productId: i._id,
          title: i.title,
          price: i.price,
          quantity: i.quantity,
          points: i.points || 0,
          unit: i.unit || '1 Pcs',
          image: i.image || '',
        })),
        subtotal: cartTotal,
        deliveryCharge: delivery,
        totalAmount: total,
        totalPoints: cartPoints,
        paymentMethod: 'Cash on Delivery',
        status: 'Pending',
      }
      const res = await api.placeOrder(body)
      if (res.success) {
        clearCart()
        navigate(`/track/${res.orderNo || res.orderId}`)
      } else {
        setError(res.message || 'Order failed. Try again.')
      }
    } catch (e) {
      setError('Could not place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 py-3 border-b border-slate-100 bg-white">
        <h1 className="text-base font-semibold text-slate-800">Checkout</h1>
      </header>

      <div className="flex-1 px-4 py-3 space-y-4">
        {/* Delivery address */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <MapPin size={16} className="text-brand-green" /> Delivery address
            </div>
            <button onClick={() => setEditing(e => !e)} className="text-xs text-brand-green font-medium">
              {editing ? 'Done' : 'Edit'}
            </button>
          </div>
          {editing ? (
            <div className="space-y-2">
              <input value={address.name} onChange={set('name')} placeholder="Full name" className="input-field text-sm" />
              <input value={address.phone} onChange={set('phone')} placeholder="Phone" className="input-field text-sm" />
              <textarea value={address.address} onChange={set('address')} placeholder="Full address" rows={2} className="input-field text-sm" />
            </div>
          ) : (
            <div className="text-sm text-slate-600 space-y-0.5">
              <p className="font-medium text-slate-800">{address.name || '—'}</p>
              <p>{address.phone || '—'}</p>
              <p>{address.address || <span className="text-slate-400 italic">No address added</span>}</p>
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="card p-4 flex items-center gap-3">
          <CreditCard size={18} className="text-brand-green" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Payment method</p>
            <p className="text-xs text-slate-500">Cash on Delivery</p>
          </div>
          <CheckCircle size={18} className="text-brand-green ml-auto" />
        </div>

        {/* Items */}
        <div className="card p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-800">Order items ({cart.length})</p>
          {cart.map(item => (
            <div key={item._id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">{item.quantity}×</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">{item.title}</p>
                <p className="text-xs text-slate-500">{item.unit || '1 Pcs'}</p>
              </div>
              <p className="text-sm font-bold text-brand-green shrink-0">৳{item.price * item.quantity}</p>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card p-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>৳{cartTotal}</span></div>
          <div className="flex justify-between text-sm text-slate-600"><span>Delivery</span><span>৳{delivery}</span></div>
          <div className="flex justify-between text-sm text-slate-600"><span>Earn points</span><span className="text-brand-orange">+{cartPoints} Pts</span></div>
          <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-800"><span>Total</span><span>৳{total}</span></div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 z-20">
        <button onClick={placeOrder} disabled={loading || cart.length === 0} className="btn-primary w-full">
          {loading ? 'Placing order…' : `Place order · ৳${total}`}
        </button>
      </div>
    </div>
  )
}
