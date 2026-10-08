'use client';

import { useActionState, useEffect } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@heroui/react';
import { registerAction } from '../actions';

export default function RegisterForm({ onSuccess }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(registerAction, {});
  const err = (name) => state?.fieldErrors?.[name]?.[0];
  const val = (name) => state?.values?.[name] ?? '';

  useEffect(() => {
    if (state?.success) {
      onSuccess?.();
      router.replace('/'); // রেজিস্টারের পর সরাসরি Home
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="name" label="Name" isRequired autoComplete="name" defaultValue={val('name')} isInvalid={!!err('name')} errorMessage={err('name')} />
        <Input name="mobile" label="Mobile" type="tel" isRequired autoComplete="tel" placeholder="01XXXXXXXXX" defaultValue={val('mobile')} isInvalid={!!err('mobile')} errorMessage={err('mobile')} />
      </div>
      <Input name="email" label="Email address" type="email" isRequired autoComplete="email" defaultValue={val('email')} isInvalid={!!err('email')} errorMessage={err('email')} />
      <Input name="address" label="Address" isRequired autoComplete="street-address" defaultValue={val('address')} isInvalid={!!err('address')} errorMessage={err('address')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="password" label="Password" type="password" isRequired autoComplete="new-password" isInvalid={!!err('password')} errorMessage={err('password')} />
        <Input name="confirmPassword" label="Confirm password" type="password" isRequired autoComplete="new-password" isInvalid={!!err('confirmPassword')} errorMessage={err('confirmPassword')} />
      </div>
      <Button type="submit" color="primary" size="lg" isLoading={pending}>
        Create Client Account →
      </Button>
      <p className="text-center text-sm text-default-600">
        Already have an account?{' '}
        <NextLink href="/login" onClick={onSuccess} className="font-semibold text-primary hover:underline">
          Log in
        </NextLink>
      </p>
    </form>
  );
}
