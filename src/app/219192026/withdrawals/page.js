import NextLink from 'next/link';
import { formatTaka } from '@/lib/format';
import { WITHDRAW_METHODS } from '@/features/wallet/config';
import { getWithdrawals } from '@/features/admin/queries';
import AdminTable from '@/components/layout/AdminTable';
import StatusBadge from '@/features/admin/components/StatusBadge';
import WithdrawalActions from '@/features/admin/components/WithdrawalActions';

export const metadata = { title: 'Withdrawals' };
const STATUSES = ['pending', 'approved', 'paid', 'rejected', ''];

export default async function AdminWithdrawalsPage({ searchParams }) {
  const sp = await searchParams;
  const status = sp.status === undefined ? 'pending' : STATUSES.includes(sp.status) ? sp.status : 'pending';
  const rows = await getWithdrawals(status);

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Withdrawals</h1>
      <p className="text-sm text-default-600">The money is already held in the customer's wallet when they ask. Approve, send it by bKash/Nagad, then mark it paid. Reject returns the money to the wallet.</p>
      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <NextLink key={s || 'all'} href={`/admin/withdrawals?status=${s}`} aria-current={s === status ? 'true' : undefined} className={`rounded-full border px-3 py-1 text-sm capitalize ${s === status ? 'border-primary bg-primary text-primary-foreground' : 'border-divider hover:border-primary'}`}>
            {s || 'All'}
          </NextLink>
        ))}
      </nav>
      <AdminTable caption="Withdrawal requests" headers={['Customer', 'Amount', 'Send to', 'Status', 'Actions']} empty="No requests in this list.">
        {rows.map((w) => (
          <tr key={w._id} className="border-b border-divider align-top last:border-0">
            <td className="px-4 py-3">{w.user?.name || 'Unknown'}<span className="block text-default-500">{w.user?.email}</span><span className="block text-xs text-default-500">{new Date(w.createdAt).toLocaleDateString('en-GB')}</span></td>
            <td className="px-4 py-3 font-semibold">{formatTaka(w.amountPaisa)}</td>
            <td className="px-4 py-3">{WITHDRAW_METHODS[w.method]}<span className="block">{w.accountNumber}</span></td>
            <td className="px-4 py-3"><StatusBadge status={w.status} />{w.adminNote && <span className="mt-1 block text-xs text-default-500">{w.adminNote}</span>}</td>
            <td className="px-4 py-3"><WithdrawalActions id={w._id} status={w.status} /></td>
          </tr>
        ))}
      </AdminTable>
    </main>
  );
}
