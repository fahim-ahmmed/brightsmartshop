import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

export default function ProductCard({ product, compact = false }) {
  const { addToCart, toggleWishlist, isWishlisted } = useApp()
  const navigate = useNavigate()
  const wished = isWishlisted(product._id)

  const go = () => navigate(`/product/${product._id}`)

  const imageUrl = product.image
    ? String(product.image).startsWith('http')
      ? product.image
      : `https://brightsmartshop24.com${product.image.startsWith('/') ? '' : '/'}${product.image}`
    : 'https://placehold.co/200x200/E8F5E9/007A4D?text=BSS'

  return (
    <div className={`card overflow-hidden flex flex-col ${compact ? '' : ''}`}>
      <div className="relative" onClick={go}>
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full aspect-square object-cover bg-slate-100"
          loading="lazy"
          onError={(e) => { e.target.src = 'https://placehold.co/200x200/E8F5E9/007A4D?text=BSS' }}
        />
        <button
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product) }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
          aria-label="Toggle wishlist"
        >
          <Heart size={16} className={wished ? 'fill-brand-orange text-brand-orange' : 'text-slate-400'} />
        </button>
      </div>
      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-1 text-[10px]">
          <span className="badge bg-brand-green-light text-brand-green">{product.categoryName || product.category}</span>
          <span className="text-slate-400">{product.unit || '1 Pcs'}</span>
        </div>
        <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight" onClick={go}>{product.title}</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-brand-green">৳{product.price}</span>
          {(product.points > 0) && (
            <span className="badge bg-orange-100 text-brand-orange">+{product.points} Pts</span>
          )}
        </div>
        <div className="flex gap-1.5 mt-auto">
          <button
            onClick={() => addToCart(product)}
            className="flex-1 bg-brand-green-light text-brand-green rounded-lg py-1.5 text-xs font-semibold active:opacity-80"
          >
            Add to cart
          </button>
          <button
            onClick={() => { addToCart(product); navigate('/checkout') }}
            className="flex-1 bg-brand-green text-white rounded-lg py-1.5 text-xs font-semibold active:opacity-90"
          >
            Buy now
          </button>
        </div>
      </div>
    </div>
  )
}
