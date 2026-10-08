'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { cartStore } from './cart-store';

export function useCart() {
  const { items } = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const totals = useMemo(
    () => ({
      count: items.reduce((n, x) => n + x.qty, 0),
      totalPaisa: items.reduce((n, x) => n + x.pricePaisa * x.qty, 0),
      pointsX100: items.reduce((n, x) => n + x.pointsX100 * x.qty, 0),
    }),
    [items]
  );
  return { items, ...totals, add: cartStore.add, setQty: cartStore.setQty, remove: cartStore.remove, clear: cartStore.clear };
}
