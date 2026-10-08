import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { escapeRegex } from '@/lib/utils';
import Product from '@/models/Product';

const STOP = new Set(['i', 'me', 'my', 'a', 'an', 'the', 'is', 'are', 'do', 'you', 'have', 'any', 'want', 'need', 'find', 'show', 'looking', 'for', 'to', 'of', 'and', 'please', 'can', 'get', 'buy', 'some', 'with', 'in', 'on', 'help']);

const pick = (p) => ({ name: p.name, slug: p.slug, pricePaisa: p.pricePaisa, pointsX100: p.pointsX100 || 0 });

// নিয়মভিত্তিক সহকারী: পণ্য খোঁজে, প্যাকেজ দেখায়, অর্ডারের পথ বলে (বাইরের AI সেবা লাগে না)
export async function POST(request) {
  if (!rateLimit(`assistant:${await clientIp()}`, 20, 60 * 1000)) {
    return NextResponse.json({ reply: 'Please slow down a little and try again in a minute.', products: [] }, { status: 429 });
  }
  let message = '';
  try {
    message = String((await request.json()).message || '').slice(0, 200).trim();
  } catch {}
  if (!message) return NextResponse.json({ reply: 'Type what you are looking for, for example "shampoo" or "noodles".', products: [] });

  await connectDB();
  const text = message.toLowerCase();

  if (/\b(order|track|delivery status|my orders?)\b/.test(text)) {
    return NextResponse.json({ reply: 'You can see all your orders and their status on the My Orders page: /orders. Log in first if asked.', products: [] });
  }
  if (/\b(deal|offer|package|combo|discount)\b/.test(text)) {
    const docs = await Product.find({ isActive: true, isPackage: true }).sort({ pricePaisa: 1 }).limit(4).lean();
    return NextResponse.json({ reply: 'Here are our current packages.', products: docs.map(pick) });
  }

  const words = text.split(/[^a-z0-9\u0980-\u09ff]+/).filter((w) => w.length > 2 && !STOP.has(w)).slice(0, 5);
  if (!words.length) return NextResponse.json({ reply: 'Tell me a product name or category, and I will look for it.', products: [] });

  const docs = await Product.find({ isActive: true, $or: words.map((w) => ({ name: { $regex: escapeRegex(w), $options: 'i' } })) })
    .limit(4)
    .lean();
  if (!docs.length) {
    return NextResponse.json({ reply: 'I could not find a matching product. Try another word, or browse all products on the Shop page.', products: [] });
  }
  return NextResponse.json({ reply: 'Here is what I found.', products: docs.map(pick) });
}
