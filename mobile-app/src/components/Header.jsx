import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingCart } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { resolveImageUrl } from '../api/index.js'

export function BssLogo({ size = 'md' }) {
  const sizeClass =
    size === 'lg' ? 'h-14 w-auto' : size === 'sm' ? 'h-8 w-auto' : 'h-10 w-auto'

  return (
    <img
      src="/logo.jpg"
      alt="Bright Smart Shop"
      className={`${sizeClass} object-contain rounded-lg`}
      onError={(e) => {
        if (e.target.src !== 'https://brightsmartshop24.com/logo.jpg') {
          e.target.src = 'https://brightsmartshop24.com/logo.jpg'
        }
      }}
    />
  )
}

export default function Header() {
  const { user, cartCount, wishlist } = useApp()
  const avatarUrl = resolveImageUrl(user?.profileImage || user?.image)

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-2.5 flex items-center justify-between shadow-2xs">
      <Link to="/" className="flex items-center gap-2.5 min-w-0">
        <BssLogo size="md" />
        <div className="leading-tight truncate">
          <p className="font-serif font-black text-base text-[#00875A] tracking-tight truncate">
            Bright Smart Shop
          </p>
          <p className="text-[10px] text-slate-500 font-medium">Smart Shopping, Better Living</p>
        </div>
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/wishlist"
          className="relative w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 active:scale-95 transition"
          aria-label="Wishlist"
        >
          <Heart size={18} strokeWidth={2.2} />
          <span className="absolute -top-1.5 -right-1.5 bg-[#E11D48] text-white text-[10px] font-bold rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center">
            {wishlist.length}
          </span>
        </Link>

        <Link
          to="/cart"
          className="relative w-9 h-9 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#00875A] active:scale-95 transition"
          aria-label="Cart"
        >
          <ShoppingCart size={18} strokeWidth={2.2} />
          <span className="absolute -top-1.5 -right-1.5 bg-[#F97316] text-white text-[10px] font-bold rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center">
            {cartCount}
          </span>
        </Link>

        {user && (
          <Link
            to="/me"
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#00875A] bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0"
            title={user.name}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            ) : (
              <span>{(user.name || 'U')[0].toUpperCase()}</span>
            )}
          </Link>
        )}
      </div>
    </header>
  )
}