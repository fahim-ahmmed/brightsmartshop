import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './auth';

// একই রিকোয়েস্টে বারবার DB-তে যাবে না
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export async function getCurrentUser() {
  try {
    const session = await getSession();
    return session?.user ?? null;
  } catch (err) {
    console.error('[session]', err.message);
    return null;
  }
}

// পেজে ঢোকার আসল সুরক্ষা (middleware শুধু দ্রুত প্রাথমিক পরীক্ষা)
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') redirect('/');
  return user;
}
