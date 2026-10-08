'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@gravity-ui/uikit';
import { setUserRoleAction } from '../actions';

export default function RoleButton({ userId, role, isSelf }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (isSelf) return <span className="text-sm text-default-500">You</span>;
  const target = role === 'admin' ? 'user' : 'admin';
  async function onClick() {
    if (!window.confirm(target === 'admin' ? 'Give this person full admin access?' : 'Remove admin access?')) return;
    setBusy(true);
    const res = await setUserRoleAction(userId, target);
    setBusy(false);
    if (res?.error) return setError(res.error);
    router.refresh();
  }
  return (
    <div>
      <Button size="s" view="outlined" loading={busy} onClick={onClick}>{target === 'admin' ? 'Make admin' : 'Remove admin'}</Button>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
