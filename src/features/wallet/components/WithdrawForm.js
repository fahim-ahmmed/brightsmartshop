'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@heroui/react';
import { formatTaka } from '@/lib/format';
import { MIN_WITHDRAW_PAISA } from '../config';
import { requestWithdrawalAction } from '../actions';

export default function WithdrawForm({ balancePaisa, hasPending }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(requestWithdrawalAction, {});
  const err = (name) => state?.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state]);

  const blocked = hasPending || balancePaisa < MIN_WITHDRAW_PAISA;
  return (
    <form action={formAction} key={state?.success ? 'done' : 'form'} className="grid gap-4">
      {state?.error && <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state?.success && <p role="status" className="rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700">Request submitted. It will be reviewed shortly.</p>}
      {hasPending && <p className="text-sm text-default-600">You have a pending request. You can send another after it is processed.</p>}
      {!hasPending && balancePaisa < MIN_WITHDRAW_PAISA && (
        <p className="text-sm text-default-600">Minimum withdrawal is {formatTaka(MIN_WITHDRAW_PAISA)}. Your wallet has {formatTaka(balancePaisa)}.</p>
      )}
      <Input name="amount" label="Amount (৳)" type="number" inputMode="decimal" min={MIN_WITHDRAW_PAISA / 100} step="0.01" isRequired isDisabled={blocked} isInvalid={!!err('amount')} errorMessage={err('amount')} />
      <div>
        <label htmlFor="method" className="mb-1 block text-sm">Method</label>
        <select id="method" name="method" defaultValue="bkash" disabled={blocked} className="h-12 w-full rounded-xl border border-divider bg-content1 px-3 disabled:opacity-50">
          <option value="bkash">bKash</option>
          <option value="nagad">Nagad</option>
        </select>
        {err('method') && <p className="mt-1 text-sm text-danger">{err('method')}</p>}
      </div>
      <Input name="accountNumber" label="bKash / Nagad number" type="tel" placeholder="01XXXXXXXXX" isRequired isDisabled={blocked} isInvalid={!!err('accountNumber')} errorMessage={err('accountNumber')} />
      <Button type="submit" color="primary" isLoading={pending} isDisabled={blocked} className="w-fit">
        Request withdrawal
      </Button>
    </form>
  );
}
