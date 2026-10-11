import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { nextCookies } from 'better-auth/next-js';
import { db } from './mongo-client';
import { sendEmail } from './email';

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
  ],

  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
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
      sponsorId: { type: 'string', required: false },
      role: { type: 'string', required: false, defaultValue: 'user', input: false },
    },
  },
  plugins: [nextCookies()],
});