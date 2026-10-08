'use client';

import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const LINKS = [
  ['/admin', 'Dashboard'],
  ['/admin/orders', 'Orders'],
  ['/admin/withdrawals', 'Withdrawals'],
  ['/admin/products', 'Products'],
  ['/admin/categories', 'Categories'],
  ['/admin/banners', 'Hero banners'],
  ['/admin/team', 'Management team'],
  ['/admin/levels', 'Levels'],
  ['/admin/notifications', 'Notification bar'],
  ['/admin/users', 'Users'],
  ['/admin/audit', 'Audit log'],
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const active = (href) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));
  const activeHref = LINKS.find(([href]) => active(href))?.[0] ?? '/admin';

  return (
    <nav aria-label="Admin" className="shrink-0 lg:w-56">
      <div className="mb-2 lg:hidden">
        <label htmlFor="admin-mobile-menu" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-default-500">
          Dashboard menu
        </label>
        <div className="relative">
          <select
            id="admin-mobile-menu"
            value={activeHref}
            onChange={(event) => router.push(event.target.value)}
            className="h-12 w-full appearance-none rounded-xl border border-divider bg-content1 px-4 pr-10 text-sm font-semibold text-foreground shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {LINKS.map(([href, label]) => (
              <option key={href} value={href}>
                {label}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-default-500"
          >
            <path fillRule="evenodd" d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      <ul className="hidden gap-1 pb-2 lg:flex lg:flex-col lg:overflow-visible">
        {LINKS.map(([href, label]) => (
          <li key={href}>
            <NextLink href={href} aria-current={active(href) ? 'page' : undefined} className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm ${active(href) ? 'bg-primary font-semibold text-primary-foreground' : 'hover:bg-content2'}`}>
              {label}
            </NextLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
