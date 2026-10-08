import AuthCard from '@/components/layout/AuthCard';
import ForgotPasswordForm from '@/features/auth/components/ForgotPasswordForm';

export const metadata = { title: 'Forgot password' };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Forgot your password?" subtitle="Enter your email and we will send you a reset link.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
