'use client';

import { useRouter } from 'next/navigation';
import { HeroUIProvider } from '@heroui/react';
import AuthModalProvider from '@/features/auth/components/AuthModalProvider';
import CartUIProvider from '@/features/cart/CartUIProvider';
import { CartProvider } from '@/features/cart/use-cart';

export default function Providers({ children }) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <AuthModalProvider>
        <CartProvider>
          <CartUIProvider>{children}</CartUIProvider>
        </CartProvider>
      </AuthModalProvider>
    </HeroUIProvider>
  );
}