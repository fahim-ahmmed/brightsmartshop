import { unstable_cache } from 'next/cache';
import { connectDB } from '@/lib/db';
import Notification from '@/models/Notification';

// ত্রুটি cache-এর ভেতরে throw হয় যাতে ব্যর্থ ফলাফল cache না হয়
const fetchActive = unstable_cache(
  async () => {
    await connectDB();
    const doc = await Notification.findOne({ isActive: true }).sort({ updatedAt: -1 }).lean();
    if (!doc) return null;
    return {
      id: String(doc._id),
      message: doc.message,
      linkUrl: doc.linkUrl || '',
      linkLabel: doc.linkLabel || '',
      version: new Date(doc.updatedAt).getTime(),
    };
  },
  ['active-notification'],
  { revalidate: 60, tags: ['notification'] }
);

export async function getActiveNotification() {
  try {
    return await fetchActive();
  } catch (err) {
    console.error('[notification]', err.message);
    return null;
  }
}
