'use client';

import { useActionState } from 'react';
import { Button, Input } from '@heroui/react';
import { changePasswordAction } from '../actions';

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, {});
  const err = (name) => state?.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} key={state?.success ? 'done' : 'form'} className="grid gap-4">
      {state?.error && <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state?.success && <p role="status" className="rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700">Password changed. Other devices have been logged out.</p>}
      <Input name="currentPassword" label="Current password" type="password" isRequired autoComplete="current-password" isInvalid={!!err('currentPassword')} errorMessage={err('currentPassword')} />
      <Input name="newPassword" label="New password" type="password" isRequired autoComplete="new-password" isInvalid={!!err('newPassword')} errorMessage={err('newPassword')} />
      <Input name="confirmPassword" label="Confirm new password" type="password" isRequired autoComplete="new-password" isInvalid={!!err('confirmPassword')} errorMessage={err('confirmPassword')} />
      <Button type="submit" color="primary" isLoading={pending} className="w-fit">
        Change password
      </Button>
    </form>
  );
}
