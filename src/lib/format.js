// টাকা সংরক্ষণ হয় পয়সায় (পূর্ণসংখ্যা): ৳340.00 = 34000
export function formatTaka(paisa = 0) {
  return '৳' + (paisa / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Point সংরক্ষণ হয় ×100 পূর্ণসংখ্যায়: 40 Point = 4000
export function formatPoints(x100 = 0, { fixed = false } = {}) {
  const n = x100 / 100;
  return fixed || !Number.isInteger(n) ? n.toFixed(2) : String(n);
}
