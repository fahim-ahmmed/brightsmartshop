import NextLink from 'next/link';
import { formatPoints, formatTaka } from '@/lib/format';
import { requireUser } from '@/lib/session';
import { getUserOrders } from '@/features/orders/queries';
import OrderStatusBadge from '@/features/orders/components/OrderStatusBadge';

export const metadata = { title: 'My Orders' };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await getUserOrders(user.id);
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">My orders</h1>
      {orders.length === 0 ? (
        <p className="text-default-600">
          You have not placed any orders yet.{' '}
          <NextLink href="/shop" className="font-semibold text-primary hover:underline">
            Start shopping
          </NextLink>
        </p>
      ) : (
        <ul className="grid gap-3">
          {orders.map((o) => (
            <li key={o.orderNo}>
              <NextLink href={`/orders/${o.orderNo}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-divider bg-content1 p-4 hover:border-primary">
                <span>
                  <strong className="block">{o.orderNo}</strong>
                  <span className="text-sm text-default-600">{new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </span>
                <span className="text-sm">
                  {formatTaka(o.totalPaisa)} · {formatPoints(o.totalPointsX100)} Point
                </span>
                <OrderStatusBadge status={o.status} />
              </NextLink>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
