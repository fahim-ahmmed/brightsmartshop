'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import CartDrawer from './CartDrawer';

const CartUIContext = createContext({ openCart: () => {} });
export const useCartUI = () => useContext(CartUIContext);

export default function CartUIProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openCart = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ openCart }), [openCart]);
  return (
    <CartUIContext.Provider value={value}>
      {children}
      <CartDrawer isOpen={open} onOpenChange={setOpen} />
    </CartUIContext.Provider>
  );
}
