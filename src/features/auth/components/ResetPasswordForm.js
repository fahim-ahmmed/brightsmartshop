'use client';

import { useActionState } from 'react';
import NextLink from 'next/link';
import { Button, Input } from '@heroui/react';
import { resetPasswordAction } from '../actions';

export default function ResetPasswordForm({ token }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, {});
  const err = (name) => state?.fieldErrors?.[name]?.[0];

  if (state?.success) {
    return (
      <div className="grid gap-4">
        <p role="status" className="rounded-lg bg-success-50 px-3 py-3 text-success-700">
          Your password has been changed.
        </p>
        <Button as={NextLink} href="/login" color="primary">
          Log In
        </Button>
      </div>
    );
  }
  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <Input name="newPassword" label="New password" type="password" isRequired autoComplete="new-password" isInvalid={!!err('newPassword')} errorMessage={err('newPassword')} />
      <Input name="confirmPassword" label="Confirm new password" type="password" isRequired autoComplete="new-password" isInvalid={!!err('confirmPassword')} errorMessage={err('confirmPassword')} />
      <Button type="submit" color="primary" size="lg" isLoading={pending}>
        Set new password
      </Button>
    </form>
  );
}
