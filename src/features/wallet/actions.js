'use server';

import { connectDB } from '@/lib/db';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { getCurrentUser } from '@/lib/session';
import Withdrawal from '@/models/Withdrawal';
import { postLedger } from './ledger';
import { withdrawSchema } from './validation';

export async function requestWithdrawalAction(_prev, formData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Please log in again.' };
  if (!rateLimit(`withdraw:${user.id}:${await clientIp()}`, 5, 60 * 60 * 1000)) {
    return { error: 'Too many requests. Please try again later.' };
  }
  const parsed = withdrawSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { amount, method, accountNumber } = parsed.data;

  await connectDB();
  let withdrawal;
  try {
    withdrawal = await Withdrawal.create({ userId: user.id, amountPaisa: amount, method, accountNumber, status: 'pending' });
  } catch (err) {
    if (err?.code === 11000) return { error: 'You already have a pending withdrawal request.' };
    throw err;
  }

  // টাকা আগে আটকানো (hold) হয়; ব্যালেন্স কম হলে রিকোয়েস্ট বাতিল
  const res = await postLedger({
    userId: user.id,
    type: 'hold',
    reason: 'withdraw_request',
    amountPaisa: amount,
    refType: 'withdrawal',
    refId: String(withdrawal._id),
    note: `${method} ${accountNumber}`,
  });
  if (!res.ok) {
    await Withdrawal.deleteOne({ _id: withdrawal._id });
    return { error: res.reason === 'insufficient' ? 'Your wallet balance is not enough.' : 'Could not submit your request. Please try again.' };
  }
  return { success: true };
}
