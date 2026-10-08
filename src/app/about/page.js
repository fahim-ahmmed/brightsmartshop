import { getTeam } from '@/features/shop/queries';
import TeamSlider from '@/features/team/TeamSlider';
import SectionHeader from '@/features/shop/components/SectionHeader';

export const metadata = { title: 'About Us' };

export default async function AboutPage() {
  const members = await getTeam();
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <SectionHeader
        as="h1"
        eyebrow="THE PEOPLE BEHIND THE VALUE"
        title="Our Management Team"
        subtitle="Experienced people building a smarter, more trusted shopping experience."
      />
      <TeamSlider members={members} />
    </main>
  );
}
