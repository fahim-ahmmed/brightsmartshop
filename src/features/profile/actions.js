'use server';

import { headers } from 'next/headers';
import { ObjectId } from 'mongodb';
import { auth } from '@/lib/auth';
import { getUserCollection } from '@/lib/mongo-client';
import { getCurrentUser } from '@/lib/session';
import { changePasswordSchema, profileSchema } from '@/features/auth/validation';

export async function updateProfileAction(_prev, formData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Please log in again.' };

  const raw = Object.fromEntries(formData);
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { name, mobile, address } = parsed.data;

  const taken = await getUserCollection().findOne(
    { mobile, _id: { $ne: new ObjectId(user.id) } },
    { projection: { _id: 1 } }
  );
  if (taken) return { fieldErrors: { mobile: ['This mobile number is already used by another account'] } };

  try {
    await auth.api.updateUser({ body: { name, mobile, address }, headers: await headers() });
  } catch (err) {
    console.error('[profile]', err?.message);
    return { error: 'Could not save your changes. Please try again.' };
  }
  return { success: true };
}

export async function changePasswordAction(_prev, formData) {
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch {
    return { fieldErrors: { currentPassword: ['Current password is incorrect'] } };
  }
  return { success: true };
}
