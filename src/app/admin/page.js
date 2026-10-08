import { formatTaka } from '@/lib/format';
import { getAdminStats } from '@/features/admin/queries';
import BarChart from '@/features/admin/components/BarChart';

export const metadata = { title: 'Dashboard' };

const Stat = ({ label, value, note }) => (
  <div className="rounded-2xl border border-divider bg-content1 p-5">
    <p className="text-sm text-default-600">{label}</p>
    <p className="mt-1 text-2xl font-bold">{value}</p>
    {note && <p className="text-xs text-default-500">{note}</p>}
  </div>
);

export default async function AdminDashboard() {
  const s = await getAdminStats();
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Customers" value={s.users} />
        <Stat label="Orders" value={s.orders} note={`${s.pendingOrders} waiting to be confirmed`} />
        <Stat label="Delivered sales" value={formatTaka(s.revenuePaisa)} />
        <Stat label="Pending withdrawals" value={s.pendingWithdrawals} note={formatTaka(s.pendingWithdrawalPaisa)} />
        <Stat label="Low stock products" value={s.lowStock} note="5 or fewer left" />
      </div>
      <section className="rounded-2xl border border-divider bg-content1 p-6">
        <BarChart data={s.days} label="Orders in the last 14 days" />
      </section>
    </main>
  );
}
