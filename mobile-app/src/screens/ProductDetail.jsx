import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Minus, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import QuantitySelector from '../components/QuantitySelector.jsx'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products, addToCart, toggleWishlist, isWishlisted } = useApp()
  const product = products.find(p => String(p._id) === String(id))
  const [qty, setQty] = useState(1)

  if (!product) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-slate-500">Product not found.</p>
        <button onClick={() => navigate('/')} className="btn-outline mt-4 inline-block">Back to home</button>
      </div>
    )
  }

  const wished = isWishlisted(product._id)
  const imageUrl = product.image
    ? String(product.image).startsWith('http')
      ? product.image
      : `https://brightsmartshop24.com${product.image.startsWith('/') ? '' : '/'}${product.image}`
    : 'https://placehold.co/400x400/E8F5E9/007A4D?text=BSS'

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={22} /></button>
        <h1 className="text-sm font-semibold text-slate-800 flex-1 truncate">Product details</h1>
      </header>

      <div className="flex-1 px-4 py-4 space-y-4">
        <div className="relative">
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full aspect-square object-cover rounded-2xl bg-slate-100"
            onError={(e) => { e.target.src = 'https://placehold.co/400x400/E8F5E9/007A4D?text=BSS' }}
          />
          <button
            onClick={() => toggleWishlist(product)}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
            aria-label="Toggle wishlist"
          >
            <Heart size={20} className={wished ? 'fill-brand-orange text-brand-orange' : 'text-slate-400'} />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge bg-brand-green-light text-brand-green">{product.categoryName || product.category}</span>
          <span className="badge bg-emerald-100 text-emerald-700">In stock</span>
          <span className="text-xs text-slate-400">{product.unit || '1 Pcs'}</span>
        </div>

        <h2 className="text-lg font-bold text-slate-800 leading-tight">{product.title}</h2>

        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-brand-green">৳{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-slate-400 line-through">৳{product.originalPrice}</span>
          )}
          {product.points > 0 && (
            <span className="badge bg-orange-100 text-brand-orange ml-1">+{product.points} Pts</span>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Quantity</p>
          <QuantitySelector value={qty} onChange={setQty} />
        </div>

        {product.description && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">Description</p>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 flex gap-3 z-20">
        <button
          onClick={() => { addToCart(product, qty); navigate('/cart') }}
          className="flex-1 btn-outline"
        >
          Add to cart
        </button>
        <button
          onClick={() => { addToCart(product, qty); navigate('/checkout') }}
          className="flex-1 btn-primary"
        >
          Buy now
        </button>
      </div>
    </div>
  )
}
