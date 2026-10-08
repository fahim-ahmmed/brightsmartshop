'use client';

import { formatPoints, formatTaka } from '@/lib/format';
import { useCart } from '@/features/cart/use-cart';
import { useCartUI } from '@/features/cart/CartUIProvider';

// Navbar-এর কার্ট বাটন: চাপলে Cart drawer খোলে
export default function CartSummary() {
  const { count, totalPaisa, pointsX100 } = useCart();
  const { openCart } = useCartUI();

  return (
    <button
      type="button"
      onClick={openCart}
      title="Cart"
      className="flex items-center gap-2 rounded-full border border-divider px-3 py-1.5 text-sm hover:bg-default-100"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 7H6" />
      </svg>
      <span className="font-medium">{count} items</span>
      <span className="hidden lg:inline">{formatTaka(totalPaisa)}</span>
      <span className="hidden text-default-500 lg:inline">Point {formatPoints(pointsX100, { fixed: true })}</span>
    </button>
  );
}
