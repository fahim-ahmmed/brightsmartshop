import { notFound } from 'next/navigation';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/db';
import { cloudinaryEnabled } from '@/lib/cloudinary';
import { ENTITIES } from '@/features/admin/entities';
import EntityForm from '@/features/admin/components/EntityForm';
import DeleteButton from '@/features/admin/components/DeleteButton';

export const metadata = { title: 'Edit' };

export default async function EntityEditPage({ params }) {
  const { entity, id } = await params;
  const ent = ENTITIES[entity];
  if (!ent) notFound();
  const isNew = id === 'new';
  if (!isNew && !ObjectId.isValid(id)) notFound();

  await connectDB();
  let values = { ...ent.defaults };
  if (!isNew) {
    const doc = await ent.model.findById(id).lean();
    if (!doc) notFound();
    values = ent.toForm(doc);
  }
  const options = (await ent.loadOptions?.()) || {};
  const fields = ent.fields.map((f) => (options[f.name] ? { ...f, options: options[f.name] } : f));
  const backHref = `/admin/${entity}`;

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">{isNew ? `New ${ent.label.toLowerCase()}` : `Edit ${ent.label.toLowerCase()}`}</h1>
      <EntityForm entity={entity} id={id} fields={fields} values={values} backHref={backHref} cloudinary={cloudinaryEnabled()} />
      {!isNew && ent.canDelete && <DeleteButton entity={entity} id={id} backHref={backHref} />}
    </main>
  );
}
