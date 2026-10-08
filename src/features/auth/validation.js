import { z } from 'zod';

export function normalizeMobile(value) {
  let s = String(value || '').replace(/[\s-]/g, '');
  if (s.startsWith('+88')) s = s.slice(3);
  else if (s.startsWith('88') && s.length === 13) s = s.slice(2);
  return s;
}

const mobile = z
  .string()
  .trim()
  .transform(normalizeMobile)
  .refine((v) => /^01[3-9]\d{8}$/.test(v), 'Enter a valid mobile number (01XXXXXXXXX)');

const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const password = z.string().min(8, 'Use at least 8 characters').max(128);
const sameAs = (a, b, label = 'Passwords do not match') => ({
  check: (d) => d[a] === d[b],
  opts: { path: [b], message: label },
});

const reg = sameAs('password', 'confirmPassword');
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(80),
    mobile,
    email,
    address: z.string().trim().min(5, 'Enter your full address').max(300),
    password,
    confirmPassword: z.string(),
  })
  .refine(reg.check, reg.opts);

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or mobile number'),
  password: z.string().min(1, 'Enter your password'),
});

export const forgotSchema = z.object({ email });

const rst = sameAs('newPassword', 'confirmPassword');
export const resetSchema = z
  .object({ token: z.string().min(1), newPassword: password, confirmPassword: z.string() })
  .refine(rst.check, rst.opts);

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80),
  mobile,
  address: z.string().trim().min(5, 'Enter your full address').max(300),
});

const chg = sameAs('newPassword', 'confirmPassword');
export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, 'Enter your current password'), newPassword: password, confirmPassword: z.string() })
  .refine(chg.check, chg.opts);
export { mobile as mobileField };
