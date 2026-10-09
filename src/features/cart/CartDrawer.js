'use client';

import Link from 'next/link';
import { formatPoints, formatTaka } from '@/lib/format';
import { useCart } from './use-cart';

export default function CartDrawer({ isOpen, onOpenChange }) {
  const { items, count, totalPaisa, pointsX100, setQty, remove } = useCart();
  const closeCart = () => onOpenChange(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <button
        type="button"
        onClick={closeCart}
        aria-label="Close shopping cart"
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
      />
      <aside className="fixed inset-y-0 right-0 flex w-screen max-w-md flex-col justify-between bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-5">
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
              Your cart
            </span>
            <h2 className="text-xl font-bold text-gray-900">Shopping Cart ({count})</h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-red-200 hover:text-red-600"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 divide-y divide-gray-100 overflow-y-auto p-5">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.productId} className="flex items-center gap-4 pt-4 first:pt-0">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                  {item.image ? (
                    <img src={item.image} alt="" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span aria-hidden="true">🛍️</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="truncate text-sm font-bold text-gray-800">{item.name}</h3>
                  <p className="text-xs text-gray-500">{formatTaka(item.pricePaisa)} each</p>
                  <p className="text-xs font-semibold text-purple-700">
                    {formatPoints(item.pointsX100 * item.qty)} Points
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setQty(item.productId, item.qty - 1)}
                        aria-label={`Decrease ${item.name} quantity`}
                        className="px-2 py-1 font-bold text-gray-600 hover:bg-gray-100"
                      >
                        −
                      </button>
                      <span className="px-3 font-bold text-gray-800">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(item.productId, item.qty + 1)}
                        aria-label={`Increase ${item.name} quantity`}
                        className="px-2 py-1 font-bold text-gray-600 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.productId)}
                      className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-full flex-col items-center justify-center space-y-3 py-12 text-center">
              <div className="text-5xl" aria-hidden="true">🛒</div>
              <h3 className="text-base font-bold text-gray-800">Your cart is empty</h3>
              <p className="max-w-xs text-xs text-gray-500">
                Looks like you have not added any products to your cart yet.
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="mt-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Start shopping
              </button>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-4 border-t border-gray-100 bg-white p-5 shadow-lg">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>Total amount</span>
                <strong className="text-base text-gray-900">{formatTaka(totalPaisa)}</strong>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-purple-800">
                <span>Total points earned</span>
                <span>{formatPoints(pointsX100, { fixed: true })} Points</span>
              </div>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-center text-sm font-extrabold text-white hover:bg-emerald-700"
            >
              Checkout now <span aria-hidden="true">→</span>
            </Link>
            <button
              type="button"
              onClick={closeCart}
              className="w-full py-2.5 text-center text-xs font-bold text-gray-500 hover:text-gray-800"
            >
              Continue shopping
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
