'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@heroui/react';
import { updateProfileAction } from '../actions';

export default function ProfileForm({ user }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfileAction, {});
  const err = (name) => state?.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      {state?.error && <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state?.success && <p role="status" className="rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700">Profile saved.</p>}
      <Input name="name" label="Name" isRequired defaultValue={user.name} isInvalid={!!err('name')} errorMessage={err('name')} />
      <Input label="Email address" value={user.email} isReadOnly description="Email cannot be changed." />
      <Input name="mobile" label="Mobile" type="tel" isRequired defaultValue={user.mobile ?? ''} isInvalid={!!err('mobile')} errorMessage={err('mobile')} />
      <Input name="address" label="Address" isRequired defaultValue={user.address ?? ''} isInvalid={!!err('address')} errorMessage={err('address')} />
      <Button type="submit" color="primary" isLoading={pending} className="w-fit">
        Save changes
      </Button>
    </form>
  );
}
