'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

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
  const active = (href) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));
  return (
    <nav aria-label="Admin" className="shrink-0 lg:w-56">
      <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
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
