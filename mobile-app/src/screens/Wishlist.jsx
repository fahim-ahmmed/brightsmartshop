import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

export default function Wishlist() {
  const { wishlist, addToCart } = useApp()
  const navigate = useNavigate()

  if (wishlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-brand-green-light flex items-center justify-center mb-4">
          <Heart size={40} className="text-brand-green" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Your wishlist is empty</h2>
        <p className="text-sm text-slate-500 mt-1">Tap the heart icon on a product to save it here.</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-6">Browse products</button>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 space-y-3">
      <h1 className="text-base font-semibold text-slate-800">My Wishlist ({wishlist.length})</h1>
      {wishlist.map(item => {
        const img = item.image
          ? String(item.image).startsWith('http') ? item.image : `https://brightsmartshop24.com${item.image.startsWith('/') ? '' : '/'}${item.image}`
          : 'https://placehold.co/100x100/E8F5E9/007A4D?text=BSS'
        return (
          <div key={item._id} className="card p-3 flex gap-3">
            <img src={img} alt={item.title} className="w-24 h-24 rounded-xl object-cover bg-slate-100" onClick={() => navigate(`/product/${item._id}`)} onError={(e) => { e.target.src = 'https://placehold.co/100x100/E8F5E9/007A4D?text=BSS' }} />
            <div className="flex-1 flex flex-col">
              <p className="text-sm font-semibold text-slate-800 line-clamp-2" onClick={() => navigate(`/product/${item._id}`)}>{item.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-brand-green">৳{item.price}</span>
                {item.points > 0 && <span className="badge bg-orange-100 text-brand-orange">+{item.points} Pts</span>}
              </div>
              <div className="flex gap-2 mt-auto">
                <button onClick={() => { addToCart(item); navigate('/cart') }} className="flex-1 bg-brand-green-light text-brand-green rounded-lg py-2 text-xs font-semibold">Add to cart</button>
                <button onClick={() => { addToCart(item); navigate('/checkout') }} className="flex-1 bg-brand-green text-white rounded-lg py-2 text-xs font-semibold">Buy now</button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
