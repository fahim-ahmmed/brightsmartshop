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

  // 🟢 স্পন্সর বা রেফারেল আইডি ধরার লজিক
  const sponsor = order.sponsorId || order.sponsorCode || order.referredBy || order.sponsor || order.refId || order.referral || "";
  const isMongoId = /^[a-fA-F0-9]{24}$/.test(sponsor);
  const isProductRef = sponsor && (isMongoId || sponsor.toUpperCase().includes("PROD") || sponsor.toUpperCase().includes("ITEM") || sponsor.toUpperCase().includes("BSS"));
  const isHumanRef = sponsor && !isProductRef;

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
        <li className="flex justify-between p-4 font-semibold">
          <span>Total ({formatPoints(order.totalPointsX100, { fixed: true })} Point)</span>
          <span>{formatTaka(order.totalPaisa)}</span>
        </li>
      </ul>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-divider bg-content1 p-4">
          <h2 className="font-semibold mb-2">Delivery</h2>
          <p>{order.shipping?.name} · {order.shipping?.mobile}</p>
          <p className="text-default-700">{order.shipping?.address}</p>
          <p className="mt-2 text-sm text-default-600">Payment: cash on delivery</p>
        </section>
        
        <section className="rounded-2xl border border-divider bg-content1 p-4">
          <h2 className="font-semibold mb-2">Account & Referral</h2>
          {customer ? (
            <div>
              <p>{customer.name}</p>
              <span className="block text-default-600">{customer.email}</span>
              <span className="block text-default-600">{customer.mobile}</span>
            </div>
          ) : (
            <p className="text-default-600">Account not found.</p>
          )}

          {/* 🟢 রেফারেল বা স্পন্সর আইডি দেখানোর অংশ */}
          {sponsor && (
            <div className="mt-3 pt-3 border-t border-divider">
              {isHumanRef && (
                <p className="text-sm font-bold text-purple-700 flex items-center gap-1.5">
                  <span>👤</span> Man ID: <span className="font-mono bg-purple-100 px-2 py-0.5 rounded border border-purple-200">{sponsor}</span>
                </p>
              )}
              {isProductRef && (
                <p className="text-sm font-bold text-blue-700 flex items-center gap-1.5">
                  <span>📦</span> Product ID: <span className="font-mono bg-blue-100 px-2 py-0.5 rounded border border-blue-200">{sponsor}</span>
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
export const dynamic = 'force-dynamic';
