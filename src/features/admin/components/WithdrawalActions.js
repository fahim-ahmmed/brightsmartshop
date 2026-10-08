'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, TextInput } from '@gravity-ui/uikit';
import { processWithdrawalAction } from '../actions';

export default function WithdrawalActions({ id, status }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  if (status !== 'pending' && status !== 'approved') return <span className="text-sm text-default-500">—</span>;

  async function run(action) {
    if (action === 'reject' && !window.confirm('Reject this request and return the money to the customer\'s wallet?')) return;
    setBusy(action);
    setError('');
    const fd = new FormData();
    fd.set('note', note);
    const res = await processWithdrawalAction(id, action, {}, fd);
    setBusy('');
    if (res?.error) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <TextInput placeholder="Note (optional)" value={note} onUpdate={setNote} size="m" aria-label="Note" />
      <div className="flex flex-wrap gap-2">
        {status === 'pending' && <Button size="s" view="action" loading={busy === 'approve'} onClick={() => run('approve')}>Approve</Button>}
        {status === 'approved' && <Button size="s" view="action" loading={busy === 'paid'} onClick={() => run('paid')}>Mark paid</Button>}
        <Button size="s" view="outlined-danger" loading={busy === 'reject'} onClick={() => run('reject')}>Reject</Button>
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
