'use client';

import { usePathname } from 'next/navigation';
import { formatPoints, formatTaka } from '@/lib/format';
import { useCart } from '@/features/cart/use-cart';
import { useCartUI } from '@/features/cart/CartUIProvider';

export default function FloatingCartButton() {
  const pathname = usePathname();
  const { count, totalPaisa, pointsX100 } = useCart();
  const { openCart } = useCartUI();

  if (pathname === '/dashboard' || pathname === '/client/dashboard' || pathname === '/levels') {
    return null;
  }

  return (
    <button
      type="button"
      onClick={openCart}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-full border border-emerald-200 bg-white/95 px-4 py-3 text-left shadow-[0_20px_45px_rgba(16,24,40,0.16)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_26px_55px_rgba(16,24,40,0.18)]"
      aria-label="Open shopping cart"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-lg text-white shadow-sm">
        🛒
      </span>
      <span className="hidden sm:block">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Cart</span>
        <span className="block text-sm font-bold text-slate-800">{count} items</span>
        <span className="block text-xs text-emerald-700">{formatTaka(totalPaisa)} · {formatPoints(pointsX100, { fixed: true })} pts</span>
      </span>
    </button>
  );
}
