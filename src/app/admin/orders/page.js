import NextLink from 'next/link';
import { formatPoints, formatTaka } from '@/lib/format';
import { getOrdersPage } from '@/features/admin/queries';
import AdminTable from '@/components/layout/AdminTable';
import StatusBadge from '@/features/admin/components/StatusBadge';
import Pagination from '@/features/shop/components/Pagination';

export const metadata = { title: 'Orders' };
const STATUSES = ['', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default async function AdminOrdersPage({ searchParams }) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status) ? sp.status : '';
  const { orders, total, page, pages } = await getOrdersPage({ status, page: parseInt(sp.page, 10) || 1 });

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Orders <span className="text-base font-normal text-default-500">({total})</span></h1>
      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <NextLink key={s || 'all'} href={s ? `/admin/orders?status=${s}` : '/admin/orders'} aria-current={s === status ? 'true' : undefined} className={`rounded-full border px-3 py-1 text-sm capitalize ${s === status ? 'border-primary bg-primary text-primary-foreground' : 'border-divider hover:border-primary'}`}>
            {s || 'All'}
          </NextLink>
        ))}
      </nav>
      <AdminTable caption="Orders" headers={['Order', 'Customer', 'Total', 'Status', 'Date']} empty="No orders found.">
        {orders.map((o) => (
          <tr key={o.orderNo} className="border-b border-divider last:border-0">
            <td className="px-4 py-3"><NextLink href={`/admin/orders/${o.orderNo}`} className="font-semibold text-primary hover:underline">{o.orderNo}</NextLink></td>
            <td className="px-4 py-3">{o.shipping?.name}<span className="block text-default-500">{o.shipping?.mobile}</span></td>
            <td className="px-4 py-3">{formatTaka(o.totalPaisa)}<span className="block text-default-500">{formatPoints(o.totalPointsX100)} Point</span></td>
            <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
            <td className="px-4 py-3">{new Date(o.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka' })}</td>
          </tr>
        ))}
      </AdminTable>
      <Pagination page={page} pages={pages} basePath="/admin/orders" params={{ status }} />
    </main>
  );
}
