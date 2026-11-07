'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  Button,
} from '@heroui/react';
import { NAV_LINKS, SITE } from '@/lib/site';
import CartSummary from './CartSummary';
import { authClient } from '@/lib/auth-client';

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export default function SiteNavbar({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const logout = () =>
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          setMenuOpen(false);
          router.push('/');
          router.refresh();
        },
      },
    });
  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <Navbar
      position="static" // sticky কাজটা করে বাইরের <header>, যাতে নোটিফিকেশন বারসহ একসাথে আটকে থাকে
      maxWidth="xl"
      isBordered
      isMenuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      classNames={{ base: 'bg-background', wrapper: 'h-16 px-4' }}
    >
      <NavbarContent justify="start" className="gap-2">
        <NavbarMenuToggle aria-label={menuOpen ? 'Close menu' : 'Open menu'} className="md:hidden" />
        <NavbarBrand>
          <NextLink href="/" aria-label={SITE.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SITE.logoUrl} alt={`${SITE.name} logo`} className="h-10 w-auto" />
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent justify="center" className="hidden gap-6 md:flex">
        {NAV_LINKS.map((l) => (
          <NavbarItem key={l.href} isActive={isActive(l.href)}>
            <NextLink
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={isActive(l.href) ? 'font-semibold text-primary' : 'text-foreground hover:text-primary'}
            >
              {l.label}
            </NextLink>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end" className="gap-2 sm:gap-3">
        <NavbarItem>
          <Button as={NextLink} href="/shop?focus=1" isIconOnly variant="light" aria-label="Search products">
            <SearchIcon />
          </Button>
        </NavbarItem>
        <NavbarItem>
          <CartSummary />
        </NavbarItem>
        {user ? (
          <>
            <NavbarItem className="hidden md:flex">
              <Button as={NextLink} href="/dashboard" color="primary">
                Dashboard
              </Button>
            </NavbarItem>
            <NavbarItem className="hidden md:flex">
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Button variant="light">{user.name.split(' ')[0]}</Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Account" onAction={(key) => key === 'logout' && logout()}>
                  <DropdownItem key="profile" href="/profile">
                    Profile
                  </DropdownItem>
                  {user.role === 'admin' ? (
                    <DropdownItem key="admin" href="/admin">
                      Admin panel
                    </DropdownItem>
                  ) : null}
                  <DropdownItem key="logout" color="danger" className="text-danger">
                    Log out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          </>
        ) : (
          <>
            <NavbarItem className="hidden md:flex">
              <Button as={NextLink} href="/register" variant="bordered" color="primary">
                Register
              </Button>
            </NavbarItem>
            <NavbarItem className="hidden md:flex">
              <Button as={NextLink} href="/login" color="primary">
                Log In
              </Button>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      <NavbarMenu>
        {NAV_LINKS.map((l) => (
          <NavbarMenuItem key={l.href} isActive={isActive(l.href)}>
            <NextLink href={l.href} onClick={() => setMenuOpen(false)} className="block w-full py-2 text-lg">
              {l.label}
            </NextLink>
          </NavbarMenuItem>
        ))}
        {user ? (
          <>
            <NavbarMenuItem>
              <NextLink href="/dashboard" onClick={() => setMenuOpen(false)} className="block w-full py-2 text-lg font-semibold text-primary">
                Dashboard
              </NextLink>
            </NavbarMenuItem>
            <NavbarMenuItem>
              <NextLink href="/profile" onClick={() => setMenuOpen(false)} className="block w-full py-2 text-lg">
                Profile
              </NextLink>
            </NavbarMenuItem>
            {user.role === 'admin' && (
              <NavbarMenuItem>
                <NextLink href="/admin" onClick={() => setMenuOpen(false)} className="block w-full py-2 text-lg">
                  Admin panel
                </NextLink>
              </NavbarMenuItem>
            )}
            <NavbarMenuItem>
              <button type="button" onClick={logout} className="block w-full py-2 text-left text-lg text-danger">
                Log out
              </button>
            </NavbarMenuItem>
          </>
        ) : (
          <>
            <NavbarMenuItem>
              <NextLink
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="block w-full py-2 text-lg"
              >
                Register
              </NextLink>
            </NavbarMenuItem>
            <NavbarMenuItem>
              <NextLink href="/login" onClick={() => setMenuOpen(false)} className="block w-full py-2 text-lg font-semibold text-primary">
                Log In
              </NextLink>
            </NavbarMenuItem>
          </>
        )}
      </NavbarMenu>
    </Navbar>
  );
}
