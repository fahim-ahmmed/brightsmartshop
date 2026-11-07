import { z } from 'zod';
import { mobileField } from '@/features/auth/validation';

export const cartSchema = z
  .array(
    z.object({
      productId: z.string().regex(/^[a-f\d]{24}$/i),
      qty: z.coerce.number().int().min(1).max(20),
    })
  )
  .min(1)
  .max(30);

export const shippingSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80),
  mobile: mobileField,
  address: z.string().trim().min(5, 'Enter your full delivery address').max(300),
});
