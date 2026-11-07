import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

export default function Header() {
  const { cartCount, wishlist } = useApp()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 bg-brand-green text-white px-4 py-3 flex items-center justify-between shadow-sm">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-white text-brand-green font-extrabold flex items-center justify-center text-sm">bss</div>
        <div className="leading-tight">
          <p className="font-bold text-sm">bright smart shop</p>
          <p className="text-[10px] text-white/80">Smart Shopping, Better Living</p>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <Link to="/wishlist" className="relative" aria-label="Wishlist">
          <Heart size={22} />
          {wishlist.length > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-brand-orange text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
              {wishlist.length}
            </span>
          )}
        </Link>
        <Link to="/cart" className="relative" aria-label="Cart">
          <ShoppingCart size={22} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-brand-orange text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
