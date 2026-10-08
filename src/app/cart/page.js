'use client';

import NextLink from 'next/link';
import { Button } from '@heroui/react';
import { formatPoints, formatTaka } from '@/lib/format';
import CartLines from '@/features/cart/CartLines';
import { useCart } from '@/features/cart/use-cart';

export default function CartPage() {
  const { items, totalPaisa, pointsX100 } = useCart();
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-4 text-3xl font-bold">Shopping cart</h1>
      <div className="rounded-2xl border border-divider bg-content1 p-6">
        <CartLines />
        {items.length > 0 && (
          <div className="mt-4 grid gap-3 border-t border-divider pt-4">
            <div className="flex justify-between">
              <span>Total amount</span>
              <strong>{formatTaka(totalPaisa)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Total Points</span>
              <strong>{formatPoints(pointsX100, { fixed: true })}</strong>
            </div>
            <Button as={NextLink} href="/checkout" color="primary" size="lg">
              Continue to checkout →
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
