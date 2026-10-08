import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import { formatPoints, formatTaka } from '@/lib/format';
import { requireUser } from '@/lib/session';
import { getOrderForUser } from '@/features/orders/queries';
import OrderStatusBadge from '@/features/orders/components/OrderStatusBadge';

export const metadata = { title: 'Order details' };

export default async function OrderPage({ params }) {
  const user = await requireUser();
  const { orderNo } = await params;
  const order = await getOrderForUser(user.id, orderNo);
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <NextLink href="/orders" className="text-sm text-primary hover:underline">
        ← All orders
      </NextLink>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Order {order.orderNo}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-default-600">Thank you for shopping with Bright Smart Shop. Payment: cash on delivery.</p>

      <ul className="mt-6 divide-y divide-divider rounded-2xl border border-divider bg-content1">
        {order.items.map((i) => (
          <li key={i.product} className="flex justify-between gap-4 p-4">
            <span>
              {i.name} × {i.qty}
              <span className="block text-sm text-default-600">{formatPoints(i.pointsX100 * i.qty)} Point</span>
            </span>
            <span>{formatTaka(i.pricePaisa * i.qty)}</span>
          </li>
        ))}
        <li className="flex justify-between p-4 font-semibold">
          <span>Total ({formatPoints(order.totalPointsX100, { fixed: true })} Point)</span>
          <span>{formatTaka(order.totalPaisa)}</span>
        </li>
      </ul>

      <section className="mt-6 rounded-2xl border border-divider bg-content1 p-4">
        <h2 className="font-semibold">Delivery details</h2>
        <p className="mt-1 text-default-700">
          {order.shipping.name} · {order.shipping.mobile}
        </p>
        <p className="text-default-700">{order.shipping.address}</p>
      </section>
    </main>
  );
}
