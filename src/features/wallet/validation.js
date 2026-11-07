import { z } from 'zod';
import { mobileField } from '@/features/auth/validation';
import { MIN_WITHDRAW_PAISA } from './config';

export const withdrawSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: 'Enter an amount' })
    .min(MIN_WITHDRAW_PAISA / 100, `Minimum withdrawal is ৳${MIN_WITHDRAW_PAISA / 100}`)
    .max(10_000_000)
    .transform((v) => Math.round(v * 100)),
  method: z.enum(['bkash', 'nagad'], { errorMap: () => ({ message: 'Choose bKash or Nagad' }) }),
  accountNumber: mobileField,
});
