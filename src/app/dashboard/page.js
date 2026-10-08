import NextLink from 'next/link';
import { formatPoints, formatTaka } from '@/lib/format';
import { requireUser } from '@/lib/session';
import { WITHDRAW_METHODS } from '@/features/wallet/config';
import { getDashboardData } from '@/features/wallet/queries';
import LevelProgress from '@/features/wallet/components/LevelProgress';
import WithdrawForm from '@/features/wallet/components/WithdrawForm';
import OrderStatusBadge from '@/features/orders/components/OrderStatusBadge';

export const metadata = { title: 'Dashboard' };

const REASONS = {
  level_reward: 'Level reward',
  order_reward: 'Order reward',
  withdraw_request: 'Withdrawal requested',
  withdraw_paid: 'Withdrawal paid',
  withdraw_rejected: 'Withdrawal returned',
  adjustment: 'Adjustment',
};
const date = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const Card = ({ title, children, className = '' }) => (
  <section className={`rounded-2xl border border-divider bg-content1 p-6 ${className}`}>
    <h2 className="mb-4 text-xl font-bold">{title}</h2>
    {children}
  </section>
);
const Stat = ({ label, value }) => (
  <div className="rounded-2xl border border-divider bg-content1 p-5">
    <p className="text-sm text-default-600">{label}</p>
    <p className="mt-1 text-2xl font-bold">{value}</p>
  </div>
);

export default async function DashboardPage() {
  const user = await requireUser();
  const d = await getDashboardData(user.id);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
          <p className="text-default-600">Your Level, Wallet and orders in one place.</p>
        </div>
        <div className="flex gap-4 text-sm font-semibold">
          <NextLink href="/orders" className="text-primary hover:underline">My orders</NextLink>
          <NextLink href="/levels" className="text-primary hover:underline">All levels</NextLink>
          <NextLink href="/profile" className="text-primary hover:underline">Profile</NextLink>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Wallet balance" value={formatTaka(d.balancePaisa)} />
        <Stat label="Total Points" value={formatPoints(d.pointsX100, { fixed: true })} />
        <Stat label="Orders placed" value={d.orderCount} />
        <Stat label="Orders delivered" value={d.deliveredCount} />
      </div>

      <LevelProgress info={d.levelInfo} pointsX100={d.pointsX100} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Withdraw money">
          <WithdrawForm balancePaisa={d.balancePaisa} hasPending={d.hasPendingWithdrawal} />
        </Card>

        <Card title="Withdrawal history">
          {d.withdrawals.length === 0 ? (
            <p className="text-default-600">No withdrawal requests yet.</p>
          ) : (
            <ul className="divide-y divide-divider text-sm">
              {d.withdrawals.map((w) => (
                <li key={w._id} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    <strong>{formatTaka(w.amountPaisa)}</strong> · {WITHDRAW_METHODS[w.method]} {w.accountNumber}
                    <span className="block text-default-500">{date(w.createdAt)}</span>
                  </span>
                  <span className="rounded-full bg-content2 px-3 py-1 text-xs font-semibold capitalize">{w.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Wallet activity">
          {d.ledger.length === 0 ? (
            <p className="text-default-600">Nothing yet. Level rewards will appear here after your orders are delivered.</p>
          ) : (
            <ul className="divide-y divide-divider text-sm">
              {d.ledger.map((e) => {
                const plus = e.type === 'credit' || e.type === 'release';
                return (
                  <li key={e._id} className="flex items-center justify-between gap-3 py-2">
                    <span>
                      {REASONS[e.reason] || e.reason}
                      <span className="block text-default-500">{e.note || date(e.createdAt)}</span>
                    </span>
                    <strong className={plus ? 'text-success-700' : 'text-danger'}>
                      {plus ? '+' : '−'}
                      {formatTaka(e.amountPaisa)}
                    </strong>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Recent orders">
          {d.recentOrders.length === 0 ? (
            <p className="text-default-600">
              No orders yet.{' '}
              <NextLink href="/shop" className="font-semibold text-primary hover:underline">Start shopping</NextLink>
            </p>
          ) : (
            <ul className="divide-y divide-divider text-sm">
              {d.recentOrders.map((o) => (
                <li key={o.orderNo} className="flex items-center justify-between gap-3 py-2">
                  <NextLink href={`/orders/${o.orderNo}`} className="hover:text-primary">
                    <strong>{o.orderNo}</strong>
                    <span className="block text-default-500">{date(o.createdAt)} · {formatTaka(o.totalPaisa)}</span>
                  </NextLink>
                  <OrderStatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}
