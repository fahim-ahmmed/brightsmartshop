import '@gravity-ui/uikit/styles/styles.css';
import { requireAdmin } from '@/lib/session';
import AdminProviders from '@/features/admin/components/AdminProviders';
import AdminNav from '@/features/admin/components/AdminNav';

export const metadata = { title: { default: 'Admin', template: '%s | Admin' }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }) {
  await requireAdmin(); // admin ছাড়া কেউ ঢুকতে পারবে না (middleware শুধু প্রাথমিক পরীক্ষা)
  return (
    <AdminProviders>
      <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-4 py-6 lg:flex-row">
        <AdminNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AdminProviders>
  );
}
