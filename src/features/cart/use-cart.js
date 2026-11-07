'use client';

import { useSyncExternalStore } from 'react';
import { cartStore } from './cart-store';

export function CartProvider({ children }) {
  return children;
}

export function useCart() {
  const { items } = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );

  const totalPaisa = items.reduce((total, item) => total + item.pricePaisa * item.qty, 0);
  const pointsX100 = items.reduce((total, item) => total + item.pointsX100 * item.qty, 0);
  const count = items.reduce((total, item) => total + item.qty, 0);

  const add = (product, qty = 1) => {
    const id = product.id ?? product.productId ?? product._id ?? product.slug;
    cartStore.add({
      id: String(id),
      slug: product.slug ?? String(id),
      name: product.name ?? product.title ?? '',
      image: product.image ?? product.images?.[0] ?? '',
      pricePaisa: product.pricePaisa ?? Math.round((product.price ?? 0) * 100),
      pointsX100: product.pointsX100 ?? Math.round((product.points ?? 0) * 100),
      stock: product.stock,
    }, qty);
  };

  const cartItems = items.map((item) => ({
    _id: item.productId,
    slug: item.slug,
    name: item.name,
    image: item.image,
    price: item.pricePaisa / 100,
    points: item.pointsX100 / 100,
    quantity: item.qty,
  }));

  return {
    items,
    totalPaisa,
    pointsX100,
    count,
    add,
    addToCart: add,
    setQty: cartStore.setQty,
    remove: cartStore.remove,
    clear: cartStore.clear,
    cartItems,
    cartTotal: totalPaisa / 100,
  };
}
