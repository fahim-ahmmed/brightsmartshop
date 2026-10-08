import AuthCard from '@/components/layout/AuthCard';
import RegisterForm from '@/features/auth/components/RegisterForm';

export const metadata = { title: 'Create your client account' };

export default function RegisterPage() {
  return (
    <AuthCard title="Create your client account" subtitle="Register in a few seconds and start shopping with more value.">
      <RegisterForm />
    </AuthCard>
  );
}
