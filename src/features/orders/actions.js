'use server';

import { connectDB } from '@/lib/db';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { getCurrentUser } from '@/lib/session';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { cartSchema, shippingSchema } from './validation';

class StockError extends Error {}

function makeOrderNo() {
  return `BSS-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export async function createOrderAction(_prev, formData) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Please log in to place your order.' };
  if (!rateLimit(`order:${user.id}:${await clientIp()}`, 10, 10 * 60 * 1000)) {
    return { error: 'Too many orders in a short time. Please wait a few minutes.' };
  }

  const shipping = shippingSchema.safeParse(Object.fromEntries(formData));
  if (!shipping.success) return { fieldErrors: shipping.error.flatten().fieldErrors };

  let cart;
  try {
    cart = cartSchema.parse(JSON.parse(formData.get('cart') || '[]'));
  } catch {
    return { error: 'Your cart is empty or invalid.' };
  }

  // একই পণ্য দুবার থাকলে qty যোগ হবে
  const qtyById = new Map();
  for (const { productId, qty } of cart) qtyById.set(productId, Math.min(20, (qtyById.get(productId) || 0) + qty));

  await connectDB();
  // দাম, Point ও স্টক সবসময় ডেটাবেস থেকে — ব্রাউজারের পাঠানো দাম বিশ্বাস করা হয় না
  const products = await Product.find({ _id: { $in: [...qtyById.keys()] }, isActive: true }).lean();
  if (products.length !== qtyById.size) {
    return { error: 'Some items in your cart are no longer available. Please review your cart.' };
  }

  const reserved = [];
  try {
    for (const p of products) {
      const qty = qtyById.get(String(p._id));
      const res = await Product.updateOne({ _id: p._id, stock: { $gte: qty } }, { $inc: { stock: -qty } });
      if (res.modifiedCount !== 1) throw new StockError(p.name);
      reserved.push({ id: p._id, qty });
    }

    const items = products.map((p) => ({
      product: p._id,
      name: p.name,
      image: p.images?.[0] || '',
      pricePaisa: p.pricePaisa,
      pointsX100: p.pointsX100 || 0,
      qty: qtyById.get(String(p._id)),
    }));
    const totalPaisa = items.reduce((n, i) => n + i.pricePaisa * i.qty, 0);
    const totalPointsX100 = items.reduce((n, i) => n + i.pointsX100 * i.qty, 0);

    let order;
    for (let attempt = 0; attempt < 3 && !order; attempt++) {
      try {
        order = await Order.create({
          orderNo: makeOrderNo(),
          userId: user.id,
          items,
          totalPaisa,
          totalPointsX100,
          shipping: shipping.data,
        });
      } catch (err) {
        if (err?.code !== 11000) throw err; // orderNo সংঘর্ষ হলে আবার চেষ্টা
      }
    }
    if (!order) throw new Error('orderNo generation failed');
    return { success: true, orderNo: order.orderNo };
  } catch (err) {
    // স্টক ফেরত দিই (ডেটাবেসে transaction না থাকলেও হিসাব ঠিক থাকে)
    for (const r of reserved) await Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty } });
    if (err instanceof StockError) return { error: `"${err.message}" does not have enough stock right now.` };
    console.error('[order]', err);
    return { error: 'Could not place your order. Please try again.' };
  }
}
