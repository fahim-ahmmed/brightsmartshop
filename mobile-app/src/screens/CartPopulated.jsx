import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Gift } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import QuantitySelector from '../components/QuantitySelector.jsx'

export default function CartPopulated() {
  const { cart, updateCartQty, removeFromCart, cartTotal, cartPoints } = useApp()
  const navigate = useNavigate()
  const delivery = 60
  const total = cartTotal + delivery

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 py-3 border-b border-slate-100 bg-white">
        <h1 className="text-base font-semibold text-slate-800">My Cart ({cart.length})</h1>
      </header>

      <div className="flex-1 px-4 py-3 space-y-3">
        {cart.map(item => {
          const img = item.image
            ? String(item.image).startsWith('http') ? item.image : `https://brightsmartshop24.com${item.image.startsWith('/') ? '' : '/'}${item.image}`
            : 'https://placehold.co/100x100/E8F5E9/007A4D?text=BSS'
          return (
            <div key={item._id} className="card p-3 flex gap-3">
              <img src={img} alt={item.title} className="w-20 h-20 rounded-xl object-cover bg-slate-100" onError={(e) => { e.target.src = 'https://placehold.co/100x100/E8F5E9/007A4D?text=BSS' }} />
              <div className="flex-1 flex flex-col">
                <p className="text-sm font-semibold text-slate-800 line-clamp-2">{item.title}</p>
                <p className="text-sm font-bold text-brand-green mt-0.5">৳{item.price}</p>
                {item.points > 0 && <span className="badge bg-orange-100 text-brand-orange w-fit mt-1">+{item.points} Pts</span>}
                <div className="flex items-center justify-between mt-auto">
                  <QuantitySelector value={item.quantity} onChange={(q) => updateCartQty(item._id, q)} />
                  <button onClick={() => removeFromCart(item._id)} className="text-red-500 p-1.5" aria-label="Remove">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">
          <Gift size={18} className="text-brand-orange" />
          <p className="text-xs text-brand-orange font-medium">Earn +{cartPoints} Pts with this purchase</p>
        </div>

        <div className="card p-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>৳{cartTotal}</span></div>
          <div className="flex justify-between text-sm text-slate-600"><span>Delivery</span><span>৳{delivery}</span></div>
          <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-800"><span>Total</span><span>৳{total}</span></div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 flex items-center justify-between z-20">
        <div>
          <p className="text-xs text-slate-500">Total to pay</p>
          <p className="text-lg font-bold text-slate-800">৳{total}</p>
        </div>
        <button onClick={() => navigate('/checkout')} className="btn-primary px-8">Checkout</button>
      </div>
    </div>
  )
}
