import NextLink from 'next/link';
import { formatPoints, formatTaka } from '@/lib/format';
import { requireUser } from '@/lib/session';
import { WITHDRAW_METHODS } from '@/features/wallet/config';
import { getDashboardData } from '@/features/wallet/queries';
import LevelProgress from '@/features/wallet/components/LevelProgress';
import WithdrawForm from '@/features/wallet/components/WithdrawForm';
import OrderStatusBadge from '@/features/orders/components/OrderStatusBadge';

const REASONS = {
  level_reward: 'Level reward',
  order_reward: 'Order reward',
  withdraw_request: 'Withdrawal requested',
  withdraw_paid: 'Withdrawal paid',
  withdraw_rejected: 'Withdrawal returned',
  adjustment: 'Adjustment',
};

const date = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function StatCard({ label, value, helper, accent = 'emerald' }) {
  const accentStyles = {
    emerald: 'from-emerald-500/15 to-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'from-amber-500/15 to-amber-50 text-amber-700 ring-amber-100',
    cyan: 'from-cyan-500/15 to-cyan-50 text-cyan-700 ring-cyan-100',
    violet: 'from-violet-500/15 to-violet-50 text-violet-700 ring-violet-100',
  };

  return (
    <div className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${accentStyles[accent]} p-5 shadow-sm ring-1`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-4 text-3xl font-black text-slate-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/75 p-2 shadow-sm">
          <span className="text-lg">{helper?.icon ?? '↗'}</span>
        </div>
      </div>
      {helper?.text ? <p className="mt-4 text-sm text-slate-600">{helper.text}</p> : null}
    </div>
  );
}

function SectionCard({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default async function ClientDashboard() {
  const user = await requireUser();
  const d = await getDashboardData(user.id);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-[28px] border border-emerald-100 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-6 text-white shadow-xl shadow-emerald-900/10 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">Client dashboard</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Welcome back, {user.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50/90 sm:text-base">
                Track your wallet, orders, rewards, and account health from one premium dashboard.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <NextLink href="/shop" className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20">
                Continue shopping
              </NextLink>
              <NextLink href="/orders" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50">
                My orders
              </NextLink>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Wallet balance"
            value={formatTaka(d.balancePaisa)}
            helper={{ icon: '💸', text: 'Available for withdrawal' }}
            accent="emerald"
          />
          <StatCard
            label="Points earned"
            value={formatPoints(d.pointsX100, { fixed: true })}
            helper={{ icon: '🎯', text: 'Reward points unlocked' }}
            accent="amber"
          />
          <StatCard
            label="Orders placed"
            value={String(d.orderCount)}
            helper={{ icon: '🛒', text: 'Total purchases ever' }}
            accent="cyan"
          />
          <StatCard
            label="Delivered"
            value={String(d.deliveredCount)}
            helper={{ icon: '✅', text: 'Orders completed successfully' }}
            accent="violet"
          />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <div className="space-y-6">
            <LevelProgress info={d.levelInfo} pointsX100={d.pointsX100} />

            <SectionCard
              title="Wallet activity"
              action={<NextLink href="/profile" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View profile</NextLink>}
            >
              {d.ledger.length === 0 ? (
                <p className="text-sm text-slate-600">Nothing here yet. Level rewards and order rewards will appear after your orders are delivered.</p>
              ) : (
                <ul className="space-y-3">
                  {d.ledger.slice(0, 5).map((e) => {
                    const plus = e.type === 'credit' || e.type === 'release';
                    return (
                      <li key={e._id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-800">{REASONS[e.reason] || e.reason}</p>
                          <p className="mt-1 text-xs text-slate-500">{e.note || date(e.createdAt)}</p>
                        </div>
                        <span className={`text-sm font-bold ${plus ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {plus ? '+' : '-'}{formatTaka(e.amountPaisa)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title="Quick actions">
              <div className="grid gap-3">
                <NextLink href="/orders" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100">
                  Track my orders
                </NextLink>
                <NextLink href="/profile" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200">
                  Update profile
                </NextLink>
                <NextLink href="/shop" className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 ring-1 ring-amber-100 transition hover:bg-amber-100">
                  Shop more products
                </NextLink>
              </div>
            </SectionCard>

            <SectionCard title="Withdrawal status">
              <WithdrawForm balancePaisa={d.balancePaisa} hasPending={d.hasPendingWithdrawal} />
            </SectionCard>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          <SectionCard
            title="Recent orders"
            action={<NextLink href="/orders" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">See all</NextLink>}
          >
            {d.recentOrders.length === 0 ? (
              <p className="text-sm text-slate-600">No orders yet. Start shopping to complete your first purchase.</p>
            ) : (
              <ul className="space-y-3">
                {d.recentOrders.map((o) => (
                  <li key={o.orderNo} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <NextLink href={`/orders/${o.orderNo}`} className="font-semibold text-slate-900 hover:text-emerald-700">
                        {o.orderNo}
                      </NextLink>
                      <p className="mt-1 text-xs text-slate-500">{date(o.createdAt)} · {formatTaka(o.totalPaisa)}</p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Withdrawal history"
            action={<span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Payments</span>}
          >
            {d.withdrawals.length === 0 ? (
              <p className="text-sm text-slate-600">No withdrawal requests yet. Move money from your wallet at any time.</p>
            ) : (
              <ul className="space-y-3">
                {d.withdrawals.slice(0, 5).map((w) => (
                  <li key={w._id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-800">{formatTaka(w.amountPaisa)}</p>
                      <p className="mt-1 text-xs text-slate-500">{WITHDRAW_METHODS[w.method]} · {w.accountNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700">{w.status}</span>
                      <p className="mt-2 text-[11px] text-slate-500">{date(w.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </section>
      </div>
    </main>
  );
}
