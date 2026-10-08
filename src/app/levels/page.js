import { getCurrentUser } from '@/lib/session';
import { getLevels, getUserLifetimePointsX100 } from '@/features/wallet/queries';
import { computeLevelInfo } from '@/features/wallet/levels';
import LevelTable from '@/features/wallet/components/LevelTable';
import SectionHeader from '@/features/shop/components/SectionHeader';

export const metadata = { title: 'Levels' };

export default async function LevelsPage() {
  const [levels, user] = await Promise.all([getLevels(), getCurrentUser()]);
  const currentLevel = user ? computeLevelInfo(levels, await getUserLifetimePointsX100(user.id)).current?.level || 0 : 0;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <SectionHeader
        as="h1"
        eyebrow="BRIGHT SMART SHOP"
        title="How Customers Benefit"
        subtitle="Every delivered order earns Points. When your total Points reach a level's Package, its Taka is added once to your Dashboard wallet."
      />
      {levels.length === 0 ? <p className="text-default-600">Levels are not set up yet.</p> : <LevelTable levels={levels} currentLevel={currentLevel} />}
    </main>
  );
}
