'use client';

import { useActionState, useEffect } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@heroui/react';
import { formatPoints, formatTaka } from '@/lib/format';
import { useCart } from '@/features/cart/use-cart';
import { createOrderAction } from '../actions';

export default function CheckoutForm({ user }) {
  const router = useRouter();
  const { items, totalPaisa, pointsX100, clear } = useCart();
  const [state, formAction, pending] = useActionState(createOrderAction, {});
  const err = (name) => state?.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state?.success) {
      clear();
      router.push(`/orders/${state.orderNo}`);
    }
  }, [state]);

  if (items.length === 0 && !state?.success) {
    return (
      <div className="py-10 text-center text-default-600">
        <p>Your cart is empty.</p>
        <NextLink href="/shop" className="mt-3 inline-block font-semibold text-primary hover:underline">
          Browse products
        </NextLink>
      </div>
    );
  }

  const cartPayload = JSON.stringify(items.map((x) => ({ productId: x.productId, qty: x.qty })));

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <input type="hidden" name="cart" value={cartPayload} />
      <section className="grid content-start gap-4 rounded-2xl border border-divider bg-content1 p-6">
        <h2 className="text-xl font-bold">Delivery details</h2>
        {state?.error && (
          <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}
        <Input name="name" label="Name" isRequired defaultValue={user.name} isInvalid={!!err('name')} errorMessage={err('name')} />
        <Input name="mobile" label="Mobile" type="tel" isRequired defaultValue={user.mobile ?? ''} isInvalid={!!err('mobile')} errorMessage={err('mobile')} />
        <Input name="address" label="Delivery address" isRequired defaultValue={user.address ?? ''} isInvalid={!!err('address')} errorMessage={err('address')} />
        <p className="rounded-lg bg-content2 px-3 py-2 text-sm">
          <strong>Cash on delivery</strong> — pay safely when you receive your order.
        </p>
      </section>

      <aside className="grid content-start gap-3 rounded-2xl border border-divider bg-content1 p-6">
        <h2 className="text-xl font-bold">Order summary</h2>
        <ul className="divide-y divide-divider text-sm">
          {items.map((x) => (
            <li key={x.productId} className="flex justify-between gap-3 py-2">
              <span>
                {x.name} × {x.qty}
              </span>
              <span className="shrink-0">{formatTaka(x.pricePaisa * x.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between">
          <span>Total amount</span>
          <strong>{formatTaka(totalPaisa)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Total Points</span>
          <strong>{formatPoints(pointsX100, { fixed: true })}</strong>
        </div>
        <p className="text-xs text-default-500">Final prices and stock are confirmed when you place the order.</p>
        <Button type="submit" color="primary" size="lg" isLoading={pending}>
          Place order
        </Button>
      </aside>
    </form>
  );
}
