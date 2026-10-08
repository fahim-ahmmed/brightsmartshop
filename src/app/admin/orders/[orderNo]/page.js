import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import { formatPoints, formatTaka } from '@/lib/format';
import { getOrderDetail } from '@/features/admin/queries';
import OrderStatusForm from '@/features/admin/components/OrderStatusForm';
import StatusBadge from '@/features/admin/components/StatusBadge';

export const metadata = { title: 'Order' };

export default async function AdminOrderPage({ params }) {
  const { orderNo } = await params;
  const detail = await getOrderDetail(orderNo);
  if (!detail) notFound();
  const { order, customer } = detail;

  return (
    <main className="max-w-3xl space-y-6">
      <NextLink href="/admin/orders" className="text-sm text-primary hover:underline">← All orders</NextLink>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Order {order.orderNo}</h1>
        <StatusBadge status={order.status} />
      </div>

      <section className="rounded-2xl border border-divider bg-content1 p-6">
        <h2 className="mb-3 text-lg font-bold">Update status</h2>
        <OrderStatusForm orderNo={order.orderNo} status={order.status} rewardsApplied={!!order.rewardsApplied} />
      </section>

      <ul className="divide-y divide-divider rounded-2xl border border-divider bg-content1">
        {order.items.map((i) => (
          <li key={i.product} className="flex justify-between gap-4 p-4">
            <span>{i.name} × {i.qty}<span className="block text-sm text-default-600">{formatPoints(i.pointsX100 * i.qty)} Point</span></span>
            <span>{formatTaka(i.pricePaisa * i.qty)}</span>
          </li>
        ))}
        <li className="flex justify-between p-4 font-semibold"><span>Total ({formatPoints(order.totalPointsX100, { fixed: true })} Point)</span><span>{formatTaka(order.totalPaisa)}</span></li>
      </ul>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-divider bg-content1 p-4">
          <h2 className="font-semibold">Delivery</h2>
          <p>{order.shipping.name} · {order.shipping.mobile}</p>
          <p className="text-default-700">{order.shipping.address}</p>
          <p className="mt-2 text-sm text-default-600">Payment: cash on delivery</p>
        </section>
        <section className="rounded-2xl border border-divider bg-content1 p-4">
          <h2 className="font-semibold">Account</h2>
          {customer ? <p>{customer.name}<span className="block text-default-600">{customer.email}</span><span className="block text-default-600">{customer.mobile}</span></p> : <p className="text-default-600">Account not found.</p>}
        </section>
      </div>
    </main>
  );
}
