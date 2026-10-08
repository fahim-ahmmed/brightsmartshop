'use client';

import NextLink from 'next/link';
import { Button, Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader } from '@heroui/react';
import { formatPoints, formatTaka } from '@/lib/format';
import CartLines from './CartLines';
import { useCart } from './use-cart';

export default function CartDrawer({ isOpen, onOpenChange }) {
  const { items, totalPaisa, pointsX100 } = useCart();

  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange} placement="right" size="md">
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1">
              <span className="text-xs font-semibold tracking-wide text-primary">YOUR CART</span>
              <span className="text-2xl">Shopping cart</span>
            </DrawerHeader>
            <DrawerBody>
              <CartLines onNavigate={onClose} />
            </DrawerBody>
            <DrawerFooter className="flex-col items-stretch gap-3 border-t border-divider">
              <div className="flex justify-between">
                <span>Total amount</span>
                <strong>{formatTaka(totalPaisa)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Points</span>
                <strong>{formatPoints(pointsX100, { fixed: true })}</strong>
              </div>
              <Button as={NextLink} href="/checkout" color="primary" size="lg" isDisabled={items.length === 0} onPress={onClose}>
                Continue to checkout →
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
