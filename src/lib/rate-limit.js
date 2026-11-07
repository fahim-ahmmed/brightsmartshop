import { headers } from 'next/headers';

// সরল in-memory সীমা (এক সার্ভার ইনস্ট্যান্সের জন্য)। একাধিক সার্ভার/serverless হলে Redis-এ সরাতে হবে।
const store = globalThis._rateStore || (globalThis._rateStore = new Map());

export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  if (store.size > 5000) for (const [k, v] of store) if (v.reset < now) store.delete(k);
  const entry = store.get(key);
  if (!entry || entry.reset < now) {
    store.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

export async function clientIp() {
  const h = await headers();
  return (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
}
