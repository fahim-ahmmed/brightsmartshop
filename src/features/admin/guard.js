import { getCurrentUser } from '@/lib/session';

// প্রতিটি অ্যাডমিন Server Action-এর প্রথম লাইনে এটা ডাকতে হবে। পেজ লুকানোই যথেষ্ট না,
// কারণ Server Action সরাসরি ডাকা যায়।
export async function assertAdmin() {
  const user = await getCurrentUser();
  return user && user.role === 'admin' ? user : null;
}
