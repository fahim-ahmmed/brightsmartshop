'use client';

import { useCart } from '@/features/cart/use-cart';

// Navbar-এর কার্ট বাটন: চাপলে Cart drawer খোলে
export default function CartSummary() {
  const { cartItems, cartTotal, openCart } = useCart();
  const count = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);

  return (
    <button
      type="button"
      onClick={openCart}
      title={`Cart: ${count} items`}
      aria-label={`Open cart, ${count} items`}
      className="flex shrink-0 items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-left transition-colors hover:bg-emerald-100/80 active:scale-95"
    >
      <span className="text-emerald-700" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17" />
          <circle cx="10" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
        </svg>
      </span>
      <span className="text-xs leading-tight">
        <span className="block font-bold text-gray-900">{count} items</span>
        <span className="hidden text-[11px] font-semibold text-emerald-700 sm:block">
          ৳{cartTotal.toFixed(2)}
        </span>
      </span>
    </button>
  );
}
