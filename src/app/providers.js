'use client';

import { useRouter } from 'next/navigation';
import { HeroUIProvider } from '@heroui/react';
import AuthModalProvider from '@/features/auth/components/AuthModalProvider';
import CartUIProvider from '@/features/cart/CartUIProvider';

export default function Providers({ children }) {
  const router = useRouter();
  return (
    <HeroUIProvider navigate={router.push}>
      <AuthModalProvider>
        <CartUIProvider>{children}</CartUIProvider>
      </AuthModalProvider>
    </HeroUIProvider>
  );
}
