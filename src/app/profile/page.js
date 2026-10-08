import { requireUser } from '@/lib/session';
import ProfileForm from '@/features/profile/components/ProfileForm';
import PasswordForm from '@/features/profile/components/PasswordForm';

export const metadata = { title: 'My Profile' };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-2">
      <section className="rounded-2xl border border-divider bg-content1 p-6">
        <h1 className="mb-4 text-xl font-bold">My profile</h1>
        <ProfileForm user={{ name: user.name, email: user.email, mobile: user.mobile, address: user.address }} />
      </section>
      <section className="rounded-2xl border border-divider bg-content1 p-6">
        <h2 className="mb-4 text-xl font-bold">Change password</h2>
        <PasswordForm />
      </section>
    </main>
  );
}
