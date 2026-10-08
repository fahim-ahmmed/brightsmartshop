'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import { useCart } from '@/features/cart/use-cart';
import { useCartUI } from '@/features/cart/CartUIProvider';

export default function AddToCartButtons({ product, qty = 1 }) {
  const router = useRouter();
  const { add } = useCart();
  const { openCart } = useCartUI();
  const out = product.stock <= 0;
  const item = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    image: product.image,
    pricePaisa: product.pricePaisa,
    pointsX100: product.pointsX100,
    stock: product.stock,
  };

  return (
    <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
      <Button
        variant="bordered"
        color="primary"
        isDisabled={out}
        onPress={() => {
          add(item, qty);
          openCart();
        }}
      >
        Add To Cart
      </Button>
      <Button
        color="primary"
        isDisabled={out}
        onPress={() => {
          add(item, qty);
          router.push('/checkout'); // লগইন না থাকলে middleware /login-এ পাঠাবে
        }}
      >
        Buy Now
      </Button>
    </div>
  );
}
