// লেভেল হিসাবের একমাত্র উৎস। dashboard-stats, orders, rebuild-chain সবাই এটাই ব্যবহার করবে।
// relative import ব্যবহার হয়েছে যাতে scripts/*.mjs থেকেও কাজ করে।
import { LEVEL_CONFIG } from "./level-config.js";

// ধাপে ধাপে রিসেট নিয়ম: আগের লেভেলের প্যাকেজ বাদ দিয়ে নতুন করে গোনা হয়
export function getStepByStepProgress(totalPackagesAfter) {
  let remaining = Math.max(0, Number(totalPackagesAfter || 0));
  let level = 0;
  let earnedTaka = 0;

  for (const c of LEVEL_CONFIG) {
    if (remaining >= c.requiredPackages) {
      remaining -= c.requiredPackages;
      level = c.level;
      earnedTaka += Number(c.taka || 0);
    } else {
      break;
    }
  }

  const nextCfg = LEVEL_CONFIG.find((c) => c.level === level + 1) || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
  return {
    level,
    currentStepPackages: remaining,
    nextLevelTarget: nextCfg ? nextCfg.requiredPackages : 0,
    earnedTaka,
  };
}

// "আসল" নোড = ফাউন্ডার প্লেসহোল্ডার নয় এবং অর্ডার নম্বর বা আইডি আছে।
// দুটোই ফাঁকা থাকলে সেটা অনাথ নোড, কোনো গণনায় ধরা হবে না।
export function isRealNode(n) {
  return !n.isSystemFounder && Boolean(n.orderNo || n.chainAccountId);
}

// একই শর্ত MongoDB ফিল্টার হিসেবে
export const REAL_NODE_FILTER = {
  isSystemFounder: { $ne: true },
  $or: [
    { orderNo: { $exists: true, $nin: [null, ""] } },
    { chainAccountId: { $exists: true, $nin: [null, ""] } },
  ],
};

// sorted sequenceNo অ্যারেতে seq-এর পরে কতগুলো আছে (binary search)
export function countAfter(sortedSeqs, seq) {
  let lo = 0;
  let hi = sortedSeqs.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedSeqs[mid] <= seq) lo = mid + 1;
    else hi = mid;
  }
  return sortedSeqs.length - lo;
}