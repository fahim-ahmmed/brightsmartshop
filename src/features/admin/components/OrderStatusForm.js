'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@gravity-ui/uikit';
import { retryRewardsAction, updateOrderStatusAction } from '../actions';
import { ORDER_FLOW } from '../flow';

export default function OrderStatusForm({ orderNo, status, rewardsApplied }) {
  const router = useRouter();
  const next = ORDER_FLOW[status] || [];
  const [state, formAction, pending] = useActionState(updateOrderStatusAction.bind(null, orderNo), {});
  const [retryMsg, setRetryMsg] = useState('');

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state]);

  return (
    <div className="grid gap-3">
      {state?.error && <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state?.warning && <p role="alert" className="rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700">{state.warning}</p>}
      {next.length > 0 ? (
        <form action={formAction} className="flex flex-wrap items-center gap-3">
          <label htmlFor="status" className="text-sm font-medium">Change status to</label>
          <select id="status" name="status" className="h-10 rounded-lg border border-divider bg-content1 px-3 capitalize">
            {next.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Button type="submit" view="action" loading={pending}>Update</Button>
        </form>
      ) : (
        <p className="text-sm text-default-600">This order is {status}; no further changes are possible.</p>
      )}
      {status === 'delivered' && !rewardsApplied && (
        <div>
          <Button view="outlined" onClick={async () => { const r = await retryRewardsAction(orderNo); setRetryMsg(r?.error || 'Rewards applied.'); router.refresh(); }}>
            Apply rewards again
          </Button>
          {retryMsg && <p className="mt-1 text-sm">{retryMsg}</p>}
        </div>
      )}
    </div>
  );
}
