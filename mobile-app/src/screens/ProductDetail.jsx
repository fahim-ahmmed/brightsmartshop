import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Heart } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import QuantitySelector from '../components/QuantitySelector.jsx'
import { resolveImageUrl } from '../api/index.js'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, products, addToCart, toggleWishlist, isWishlisted } = useApp()
  const product = products.find(p => String(p._id) === String(id))
  const [qty, setQty] = useState(1)

  if (!product) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-slate-500 text-sm">Product not found.</p>
        <button onClick={() => navigate('/')} className="btn-outline mt-4">Back to home</button>
      </div>
    )
  }

  const wished = isWishlisted(product._id)
  const imageUrl = resolveImageUrl(product.image) || 'https://placehold.co/400x320/E8F5E9/007A4D?text=Bright+Smart+Shop'

  const handleBuyNow = () => {
    addToCart(product, qty)
    if (!user) {
      navigate('/login?redirect=/checkout')
    } else {
      navigate('/checkout')
    }
  }

  return (
    <div className="px-4 py-3 space-y-4">
      {/* Sub-header */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm font-extrabold text-slate-800"
      >
        <ChevronLeft size={18} /> Product details
      </button>

      <div className="bg-white rounded-3xl border border-slate-100 p-3.5 shadow-xs space-y-4">
        {/* Product Image */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-50">
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full aspect-[4/3] object-cover"
            onError={(e) => { e.target.src = 'https://placehold.co/400x320/E8F5E9/007A4D?text=Bright+Smart+Shop' }}
          />
          <button
            onClick={() => toggleWishlist(product)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 flex items-center justify-center shadow-sm"
            aria-label="Toggle wishlist"
          >
            <Heart size={18} className={wished ? 'fill-rose-500 text-rose-500' : 'text-rose-500'} />
          </button>
          <span className="absolute bottom-2.5 right-3 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            1 / 1
          </span>
        </div>

        {/* Category & Stock Row */}
        <div className="flex items-center justify-between">
          <span className="bg-[#E8F5E9] text-[#006E32] text-[11px] font-extrabold uppercase px-3 py-1 rounded-full">
            {product.categoryName || product.category || 'PACKAGE'}
          </span>
          <span className="text-xs font-semibold text-[#006E32]">
            In stock · <span className="text-slate-400 font-normal">{product.stock || 100} available</span>
          </span>
        </div>

        {/* Title */}
        <h1 className="text-base font-extrabold text-slate-900 leading-snug">
          {product.title}
        </h1>

        {/* Price, Points & Unit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-black text-[#006E32]">৳{product.price}</span>
            {Number(product.points) > 0 && (
              <span className="bg-[#E8F5E9] text-[#006E32] text-xs font-extrabold px-3 py-1 rounded-full">
                +{product.points} Pts
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 font-semibold">{product.unit || '1 Pcs'}</span>
        </div>

        {/* Quantity Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-700">Quantity</span>
          <QuantitySelector value={qty} onChange={setQty} />
        </div>

        {/* About this package / product */}
        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-extrabold text-slate-800 mb-1">About this package</h3>
          <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
            {product.description || 'Everyday family essentials in one package with guaranteed quality and reward points.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={() => { addToCart(product, qty); navigate('/cart') }}
            className="btn-soft"
          >
            Add to cart
          </button>
          <button
            onClick={handleBuyNow}
            className="btn-primary"
          >
            Buy now
          </button>
        </div>
      </div>
    </div>
  )
}