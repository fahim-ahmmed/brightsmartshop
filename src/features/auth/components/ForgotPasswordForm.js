'use client';

import { useActionState } from 'react';
import { Button, Input } from '@heroui/react';
import { forgotPasswordAction } from '../actions';

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, {});

  if (state?.success) {
    return (
      <p role="status" className="rounded-lg bg-success-50 px-3 py-3 text-success-700">
        If an account exists for that email, we have sent a link to reset the password. Check your inbox.
      </p>
    );
  }
  return (
    <form action={formAction} className="grid gap-4">
      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <Input name="email" label="Email address" type="email" isRequired autoComplete="email" isInvalid={!!state?.fieldErrors?.email} errorMessage={state?.fieldErrors?.email?.[0]} />
      <Button type="submit" color="primary" size="lg" isLoading={pending}>
        Send reset link
      </Button>
    </form>
  );
}
