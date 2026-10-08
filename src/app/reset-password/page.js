import NextLink from 'next/link';
import AuthCard from '@/components/layout/AuthCard';
import ResetPasswordForm from '@/features/auth/components/ResetPasswordForm';

export const metadata = { title: 'Reset password' };

export default async function ResetPasswordPage({ searchParams }) {
  const { token, error } = await searchParams;

  if (!token || error) {
    return (
      <AuthCard title="Link expired" subtitle="This reset link is invalid or has expired.">
        <NextLink href="/forgot-password" className="font-semibold text-primary hover:underline">
          Request a new link
        </NextLink>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Set a new password">
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
