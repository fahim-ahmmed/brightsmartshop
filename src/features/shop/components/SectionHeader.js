import NextLink from 'next/link';

export default function SectionHeader({ eyebrow, title, subtitle, href, hrefLabel = 'View All', as: Tag = 'h2' }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-xs font-semibold tracking-wide text-primary">{eyebrow}</p>}
        <Tag className="text-2xl font-bold sm:text-3xl">{title}</Tag>
        {subtitle && <p className="mt-1 text-default-600">{subtitle}</p>}
      </div>
      {href && (
        <NextLink href={href} className="shrink-0 font-semibold text-primary hover:underline">
          {hrefLabel}
        </NextLink>
      )}
    </div>
  );
}
