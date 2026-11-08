import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { resolveImageUrl } from '../api/index.js'

export default function ProductCard({ product }) {
  const { user, addToCart, toggleWishlist, isWishlisted } = useApp()
  const navigate = useNavigate()
  const wished = isWishlisted(product._id)

  const goDetail = () => navigate(`/product/${product._id}`)

  const handleBuyNow = () => {
    addToCart(product, 1)
    if (!user) {
      navigate('/login?redirect=/checkout')
    } else {
      navigate('/checkout')
    }
  }

  const imageUrl = resolveImageUrl(product.image) || 'https://placehold.co/300x240/E8F5E9/007A4D?text=Bright+Smart+Shop'

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col p-2.5">
      <div className="relative rounded-xl overflow-hidden bg-slate-50 cursor-pointer" onClick={goDetail}>
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full aspect-[4/3] object-cover"
          loading="lazy"
          onError={(e) => { e.target.src = 'https://placehold.co/300x240/E8F5E9/007A4D?text=Bright+Smart+Shop' }}
        />
        <button
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product) }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center shadow-sm active:scale-90 transition"
          aria-label="Toggle wishlist"
        >
          <Heart
            size={16}
            className={wished ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}
          />
        </button>
      </div>

      <div className="pt-2.5 flex flex-col flex-1">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="font-extrabold uppercase tracking-wider text-[#007A4D] truncate max-w-[70%]">
            {product.categoryName || product.category || 'PACKAGE'}
          </span>
          <span className="text-slate-400 font-medium">{product.unit || '1 Pcs'}</span>
        </div>

        <h3
          onClick={goDetail}
          className="text-[13px] font-bold text-slate-900 line-clamp-2 leading-snug cursor-pointer mb-2"
        >
          {product.title}
        </h3>

        <div className="flex items-center justify-between mt-auto mb-2.5">
          <span className="text-base font-extrabold text-[#007A4D]">৳{product.price}</span>
          {Number(product.points) > 0 && (
            <span className="bg-[#E8F5E9] text-[#007A4D] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              +{product.points} Pts
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => addToCart(product, 1)}
            className="w-full bg-[#E8F5E9] hover:bg-[#d5eed7] text-[#006E32] rounded-full py-2 text-xs font-bold transition active:scale-[0.99]"
          >
            Add to cart
          </button>
          <button
            onClick={handleBuyNow}
            className="w-full bg-[#006E32] hover:bg-[#005a28] text-white rounded-full py-2 text-xs font-bold transition active:scale-[0.99]"
          >
            Buy now
          </button>
        </div>
      </div>
    </div>
  )
}