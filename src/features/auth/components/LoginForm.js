'use client';

import { useActionState, useEffect } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@heroui/react';
import { loginAction } from '../actions';
import { useAuthModal } from './AuthModalProvider';

export default function LoginForm() {
  const router = useRouter();
  const { openRegister } = useAuthModal();
  const [state, formAction, pending] = useActionState(loginAction, {});
  const err = (name) => state?.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state?.success) {
      router.replace('/'); // লগইনের পর সবসময় Home
      router.refresh();
    }
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <Input name="identifier" label="Email or mobile" isRequired autoComplete="username" defaultValue={state?.values?.identifier ?? ''} isInvalid={!!err('identifier')} errorMessage={err('identifier')} />
      <Input name="password" label="Password" type="password" isRequired autoComplete="current-password" isInvalid={!!err('password')} errorMessage={err('password')} />
      <div className="text-right text-sm">
        <NextLink href="/forgot-password" className="text-primary hover:underline">
          Forgot password?
        </NextLink>
      </div>
      <Button type="submit" color="primary" size="lg" isLoading={pending}>
        Log In
      </Button>
      <p className="text-center text-sm text-default-600">
        New here?{' '}
        <button type="button" onClick={openRegister} className="font-semibold text-primary hover:underline">
          Create an account
        </button>
      </p>
    </form>
  );
}
