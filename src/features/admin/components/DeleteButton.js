'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@gravity-ui/uikit';
import { deleteEntityAction } from '../actions';

export default function DeleteButton({ entity, id, backHref }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function onClick() {
    if (!window.confirm('Delete this item permanently?')) return;
    setBusy(true);
    const res = await deleteEntityAction(entity, id);
    setBusy(false);
    if (res?.error) return setError(res.error);
    router.push(backHref);
    router.refresh();
  }
  return (
    <div>
      <Button view="outlined-danger" size="l" loading={busy} onClick={onClick}>Delete</Button>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
