'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { ensureUserIndexes, getUserCollection } from '@/lib/mongo-client';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { forgotSchema, loginSchema, normalizeMobile, registerSchema, resetSchema } from './validation';

const MIN = 60 * 1000;
const LOGIN_ERROR = 'Incorrect email, mobile number or password.';

export async function registerAction(_prev, formData) {
  const raw = Object.fromEntries(formData);
  const values = { name: raw.name, mobile: raw.mobile, email: raw.email, address: raw.address };

  if (!rateLimit(`register:${await clientIp()}`, 5, 60 * MIN)) {
    return { error: 'Too many attempts. Please try again later.', values };
  }
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values };

  const { name, mobile, email, address, password } = parsed.data;
  await ensureUserIndexes();
  if (await getUserCollection().findOne({ mobile }, { projection: { _id: 1 } })) {
    return { fieldErrors: { mobile: ['This mobile number is already registered'] }, values };
  }

  try {
    await auth.api.signUpEmail({ body: { name, email, password, mobile, address }, headers: await headers() });
  } catch (err) {
    if (/exist|already/i.test(err?.message || '')) {
      return { fieldErrors: { email: ['This email is already registered'] }, values };
    }
    console.error('[register]', err?.message);
    return { error: 'Could not create your account. Please try again.', values };
  }
  return { success: true };
}

export async function loginAction(_prev, formData) {
  const raw = Object.fromEntries(formData);
  const values = { identifier: raw.identifier };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values };
  const { identifier, password } = parsed.data;

  if (!rateLimit(`login:${await clientIp()}:${identifier.toLowerCase()}`, 8, 10 * MIN)) {
    return { error: 'Too many attempts. Please wait a few minutes and try again.', values };
  }

  // ইমেইল বা মোবাইল — দুটোতেই লগইন
  let email = identifier.includes('@') ? identifier.toLowerCase() : null;
  if (!email) {
    const user = await getUserCollection().findOne({ mobile: normalizeMobile(identifier) }, { projection: { email: 1 } });
    email = user?.email || null;
  }
  if (!email) return { error: LOGIN_ERROR, values };

  try {
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
  } catch {
    return { error: LOGIN_ERROR, values };
  }
  return { success: true };
}

export async function forgotPasswordAction(_prev, formData) {
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  if (!rateLimit(`forgot:${await clientIp()}`, 5, 60 * MIN)) {
    return { error: 'Too many requests. Please try again later.' };
  }
  try {
    const request = auth.api.requestPasswordReset ?? auth.api.forgetPassword; // Better Auth ভার্সনভেদে নাম আলাদা
    await request({ body: { email: parsed.data.email, redirectTo: '/reset-password' } });
  } catch (err) {
    console.error('[forgot]', err?.message);
  }
  // অ্যাকাউন্ট আছে কিনা বোঝা যাবে না — সবসময় একই বার্তা
  return { success: true };
}

export async function resetPasswordAction(_prev, formData) {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await auth.api.resetPassword({ body: { newPassword: parsed.data.newPassword, token: parsed.data.token } });
  } catch {
    return { error: 'This reset link is invalid or has expired. Please request a new one.' };
  }
  return { success: true };
}
