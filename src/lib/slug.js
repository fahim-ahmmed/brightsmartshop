export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// স্লাগ ফাঁকা বা (বাংলা নামের কারণে) খালি হলে এলোমেলো কিছু বসে; সংঘর্ষ হলে সংখ্যা যোগ হয়
export async function uniqueSlug(Model, base, excludeId) {
  const root = slugify(base) || `item-${Math.random().toString(36).slice(2, 7)}`;
  let slug = root;
  for (let i = 2; i < 50; i++) {
    const clash = await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!clash) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}
