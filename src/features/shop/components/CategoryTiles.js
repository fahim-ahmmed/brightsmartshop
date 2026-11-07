import NextLink from 'next/link';
import Image from 'next/image';

export default function CategoryTiles({ categories = [], allImage }) {
  const visibleCategories = Array.isArray(categories) ? categories.slice(0, 4) : [];

  const tiles = visibleCategories.map((c) => ({
    key: c.id || c.slug || c.name,
    href: `/category/${c.slug}`,
    name: c.name,
    image: c.image,
  }));

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <li key={t.key}>
          <NextLink href={t.href} className="flex items-center gap-3 rounded-xl border border-divider bg-content1 p-3 hover:border-primary">
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-content2">
              {t.image && <Image src={t.image} alt="" fill sizes="48px" className="object-cover" />}
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium leading-tight">{t.name}</span>
            <span aria-hidden="true" className="text-default-400">
              ›
            </span>
          </NextLink>
        </li>
      ))}
    </ul>
  );
}
