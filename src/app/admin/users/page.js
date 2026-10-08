import { requireAdmin } from '@/lib/session';
import { getUsers } from '@/features/admin/queries';
import AdminTable from '@/components/layout/AdminTable';
import StatusBadge from '@/features/admin/components/StatusBadge';
import RoleButton from '@/features/admin/components/RoleButton';
import Pagination from '@/features/shop/components/Pagination';

export const metadata = { title: 'Users' };

export default async function AdminUsersPage({ searchParams }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const q = String(sp.q || '').slice(0, 80);
  const { users, total, page, pages } = await getUsers({ q, page: parseInt(sp.page, 10) || 1 });

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Users <span className="text-base font-normal text-default-500">({total})</span></h1>
      <form role="search" className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search name, email or mobile" aria-label="Search users" className="h-10 w-full max-w-sm rounded-lg border border-divider bg-content1 px-3" />
        <button type="submit" className="rounded-lg border border-divider px-4 hover:border-primary">Search</button>
      </form>
      <AdminTable caption="Users" headers={['Name', 'Email', 'Mobile', 'Role', 'Joined', '']} empty="No users found.">
        {users.map((u) => (
          <tr key={u.id} className="border-b border-divider last:border-0">
            <td className="px-4 py-3">{u.name}</td>
            <td className="px-4 py-3">{u.email}</td>
            <td className="px-4 py-3">{u.mobile}</td>
            <td className="px-4 py-3"><StatusBadge status={u.role} /></td>
            <td className="px-4 py-3">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : ''}</td>
            <td className="px-4 py-3"><RoleButton userId={u.id} role={u.role} isSelf={u.id === me.id} /></td>
          </tr>
        ))}
      </AdminTable>
      <Pagination page={page} pages={pages} basePath="/admin/users" params={{ q }} />
    </main>
  );
}
