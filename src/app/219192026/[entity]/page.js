import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { escapeRegex } from '@/lib/utils';
import { ENTITIES } from '@/features/admin/entities';
import AdminTable from '@/components/layout/AdminTable';

export async function generateMetadata({ params }) {
  const ent = ENTITIES[(await params).entity];
  return { title: ent?.plural || 'Admin' };
}

export default async function EntityListPage({ params, searchParams }) {
  const { entity } = await params;
  const ent = ENTITIES[entity];
  if (!ent) notFound();
  const q = String((await searchParams).q || '').slice(0, 80);

  await connectDB();
  const filter = q && ent.searchField ? { [ent.searchField]: { $regex: escapeRegex(q), $options: 'i' } } : {};
  let query = ent.model.find(filter).sort(ent.sort || { createdAt: -1 }).limit(300);
  if (ent.populate) query = query.populate(ent.populate, 'name');
  const docs = await query.lean();

  return (
    <main className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{ent.plural}</h1>
        <NextLink href={`/admin/${entity}/new`} className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90">
          + New {ent.label.toLowerCase()}
        </NextLink>
      </div>
      {ent.searchField && (
        <form role="search" className="flex gap-2">
          <input name="q" defaultValue={q} placeholder={`Search ${ent.plural.toLowerCase()}`} aria-label="Search" className="h-10 w-full max-w-sm rounded-lg border border-divider bg-content1 px-3" />
          <button type="submit" className="rounded-lg border border-divider px-4 hover:border-primary">Search</button>
        </form>
      )}
      <AdminTable caption={ent.plural} headers={[...ent.columns.map((c) => c.label), '']} empty={`No ${ent.plural.toLowerCase()} yet.`}>
        {docs.map((d) => (
          <tr key={String(d._id)} className="border-b border-divider last:border-0">
            {ent.columns.map((c) => (
              <td key={c.label} className="px-4 py-3">{c.get(d)}</td>
            ))}
            <td className="px-4 py-3 text-right">
              <NextLink href={`/admin/${entity}/${d._id}`} className="font-semibold text-primary hover:underline">Edit</NextLink>
            </td>
          </tr>
        ))}
      </AdminTable>
    </main>
  );
}
