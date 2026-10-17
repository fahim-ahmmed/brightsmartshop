import { getAuditLog } from '@/features/admin/queries';
import AdminTable from '@/components/layout/AdminTable';

export const metadata = { title: 'Audit log' };

export default async function AuditPage() {
  const rows = await getAuditLog();
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Audit log</h1>
      <p className="text-sm text-default-600">The last 150 changes made by admins.</p>
      <AdminTable caption="Audit log" headers={['When', 'Admin', 'Action', 'What']} empty="No changes recorded yet.">
        {rows.map((r) => (
          <tr key={r._id} className="border-b border-divider last:border-0">
            <td className="px-4 py-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka' })}</td>
            <td className="px-4 py-3">{r.adminName}</td>
            <td className="px-4 py-3">{r.action} · {r.entity}</td>
            <td className="px-4 py-3">{r.summary}</td>
          </tr>
        ))}
      </AdminTable>
    </main>
  );
}
