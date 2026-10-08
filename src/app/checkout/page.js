import { requireUser } from '@/lib/session';
import CheckoutForm from '@/features/orders/components/CheckoutForm';

export const metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const user = await requireUser();
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Checkout</h1>
      <CheckoutForm user={{ name: user.name, mobile: user.mobile, address: user.address }} />
    </main>
  );
}
