import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { nextCookies } from 'better-auth/next-js';
import { db } from './mongo-client';
import { sendEmail } from './email';

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true, // রেজিস্টারের পরপরই লগইন
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your Bright Smart Shop password',
        html: `<p>Hi ${user.name},</p><p>Use the link below to set a new password. It expires in 1 hour.</p><p><a href="${url}">Reset password</a></p><p>If you did not ask for this, you can ignore this email.</p>`,
      });
    },
  },
  user: {
    additionalFields: {
      mobile: { type: 'string', required: true },
      address: { type: 'string', required: true },
      // input:false = ইউজার নিজে role বদলাতে পারবে না
      role: { type: 'string', required: false, defaultValue: 'user', input: false },
    },
  },
  plugins: [nextCookies()], // সবসময় শেষে থাকবে
});
