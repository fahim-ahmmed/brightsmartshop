import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart } from 'lucide-react'

export default function CartEmpty() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-brand-green-light flex items-center justify-center mb-4">
        <ShoppingCart size={40} className="text-brand-green" />
      </div>
      <h2 className="text-lg font-bold text-slate-800">Your cart is empty</h2>
      <p className="text-sm text-slate-500 mt-1 mb-6">Looks like you haven't added anything yet.</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button onClick={() => navigate('/')} className="btn-primary">Start shopping</button>
        <button onClick={() => navigate('/wishlist')} className="btn-outline flex items-center justify-center gap-2">
          <Heart size={18} /> View my wishlist
        </button>
      </div>
    </div>
  )
}
