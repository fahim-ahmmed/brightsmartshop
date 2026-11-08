import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { resolveImageUrl } from '../api/index.js'

export default function CartPopulated() {
  const { user, cart, updateCartQty, removeFromCart, clearCart, cartTotal, cartPoints } = useApp()
  const navigate = useNavigate()

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=/checkout')
    } else {
      navigate('/checkout')
    }
  }

  return (
    <div className="px-4 py-5 space-y-5 font-sans text-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <span className="text-[10px] font-black text-[#00875A] uppercase tracking-widest block">
            CHECKOUT READY
          </span>
          <h1 className="text-xl font-black text-gray-900">Shopping Cart</h1>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs font-extrabold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="space-y-3.5">
        {cart.map(item => {
          const itemId = item._id || item.id
          const itemPrice = Number(item.price || 0)
          const itemPoints = Number(item.points || item.point || 0)
          const totalItemPoints = Math.round(itemPoints * item.quantity * 100) / 100
          const totalItemPrice = itemPrice * item.quantity
          const img = resolveImageUrl(item.image) || 'https://brightsmartshop24.com/hero1.jpg'

          return (
            <div
              key={itemId}
              className="bg-white rounded-3xl p-4 border border-gray-200 shadow-xs space-y-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-18 h-18 bg-gray-50 rounded-2xl border border-gray-100 p-1.5 flex items-center justify-center shrink-0">
                  <img
                    src={img}
                    alt={item.title}
                    className="w-16 h-16 object-contain rounded-xl"
                    onError={(e) => { e.target.src = 'https://placehold.co/80x80/E8F5E9/007A4D?text=BSS' }}
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-extrabold text-xs text-gray-900 line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-black text-gray-900">৳{itemPrice}</span>
                    {itemPoints > 0 && (
                      <span className="text-[11px] font-bold text-[#00875A] bg-emerald-50 px-2 py-0.5 rounded-full">
                        (+{totalItemPoints} Points)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity & Delete Controls */}
              <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200">
                  <button
                    type="button"
                    onClick={() => updateCartQty(itemId, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center font-black text-gray-700 bg-white rounded-lg shadow-2xs"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-black text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCartQty(itemId, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center font-black text-gray-700 bg-white rounded-lg shadow-2xs"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-[#00875A]">
                    ৳{totalItemPrice}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(itemId)}
                    className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center"
                    title="Remove Item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Order Summary Card (Matches Website src/app/cart/page.js) */}
      <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h2 className="text-base font-black text-gray-900 border-b border-gray-100 pb-2.5">
          Order Summary
        </h2>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center text-gray-700">
            <span className="font-bold">Total Amount</span>
            <span className="text-base font-black text-gray-900">৳{cartTotal}</span>
          </div>

          <div className="flex justify-between items-center text-gray-700 pt-2 border-t border-gray-100">
            <span className="font-bold">Total Points Earned</span>
            <span className="text-xs font-black text-[#00875A]">+{cartPoints} Points</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          className="block w-full py-3.5 bg-[#00875A] hover:bg-[#00704A] text-white font-black text-xs text-center rounded-2xl shadow-md transition-all active:scale-98"
        >
          Continue to checkout →
        </button>

        <p className="text-[10px] text-gray-400 text-center font-medium">
          🔒 Safe & Secure Checkout Guaranteed
        </p>
      </div>
    </div>
  )
}