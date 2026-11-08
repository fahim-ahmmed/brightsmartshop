import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, ChevronLeft } from 'lucide-react'

export default function CartEmpty() {
  const navigate = useNavigate()
  return (
    <div className="px-4 py-3 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm font-extrabold text-slate-800"
        >
          <ChevronLeft size={18} /> My Cart
        </button>
        <span className="text-xs text-slate-400 font-semibold">0 items</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-6 text-center flex flex-col items-center shadow-2xs my-4">
        <div className="w-16 h-16 rounded-2xl bg-[#E8F5E9] flex items-center justify-center mb-4">
          <ShoppingCart size={30} className="text-[#006E32]" />
        </div>
        <h2 className="text-base font-extrabold text-slate-900">Your cart is empty</h2>
        <p className="text-xs text-slate-500 mt-1 mb-5 max-w-xs leading-relaxed">
          Find everyday essentials you love and add them to your cart.
        </p>
        <div className="flex flex-col gap-2.5 w-full">
          <button onClick={() => navigate('/')} className="btn-primary w-full">
            Start shopping
          </button>
          <button onClick={() => navigate('/wishlist')} className="btn-soft w-full">
            View my wishlist
          </button>
        </div>
      </div>
    </div>
  )
}