'use client';

import NextLink from 'next/link';
import Image from 'next/image';
import { Button } from '@heroui/react';
import { formatPoints, formatTaka } from '@/lib/format';
import { useCart } from './use-cart';

export default function CartLines({ onNavigate }) {
  const { items, setQty, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-default-600">
        <p>Your cart is empty.</p>
        <NextLink href="/shop" onClick={onNavigate} className="mt-3 inline-block font-semibold text-primary hover:underline">
          Browse products
        </NextLink>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-divider">
      {items.map((x) => (
        <li key={x.productId} className="flex gap-3 py-4">
          <NextLink href={`/product/${x.slug}`} onClick={onNavigate} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-content2">
            {x.image && <Image src={x.image} alt={x.name} fill sizes="64px" className="object-cover" />}
          </NextLink>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{x.name}</p>
            <p className="text-sm text-default-600">
              {formatTaka(x.pricePaisa)} · {formatPoints(x.pointsX100)} Point
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" isIconOnly variant="bordered" aria-label="Decrease quantity" onPress={() => setQty(x.productId, x.qty - 1)}>
                −
              </Button>
              <span className="w-6 text-center" aria-live="polite">
                {x.qty}
              </span>
              <Button size="sm" isIconOnly variant="bordered" aria-label="Increase quantity" onPress={() => setQty(x.productId, x.qty + 1)}>
                +
              </Button>
              <button type="button" onClick={() => remove(x.productId)} className="ml-auto text-sm text-danger hover:underline">
                Remove
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
