import { z } from 'zod';
import { formatTaka } from '@/lib/format';
import { revalidateTag } from 'next/cache';
import Category from '@/models/Category';
import Product from '@/models/Product';
import HeroBanner from '@/models/HeroBanner';
import TeamMember from '@/models/TeamMember';
import LevelConfig from '@/models/LevelConfig';
import Notification from '@/models/Notification';

// এক জায়গায় সব "সাধারণ" ডেটার CRUD সংজ্ঞা। নতুন ধরন যোগ করতে এখানে একটা এন্ট্রি দিলেই চলে।
const url = z.string().trim().max(500).refine((v) => !v || /^https?:\/\//i.test(v), 'Enter a full link starting with https://');
const text = (min, max) => z.string().trim().min(min).max(max);
const objectId = z.string().regex(/^[a-f\d]{24}$/i);

export const ENTITIES = {
  products: {
    label: 'Product', plural: 'Products', model: Product, hasSlug: true, searchField: 'name', populate: 'category',
    canDelete: false, // অর্ডারে ব্যবহৃত হয়; মুছে না ফেলে "Hidden" করা হয়
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', hint: 'Which category this product belongs to' },
      { name: 'price', label: 'Price (৳)', type: 'number', step: '0.01', required: true },
      { name: 'points', label: 'Points', type: 'number', step: '0.01', hint: 'Points the customer earns per item' },
      { name: 'stock', label: 'Stock', type: 'number', step: '1', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'image', label: 'Image', type: 'image', required: true },
      { name: 'slug', label: 'URL slug', type: 'text', hint: 'Leave empty to generate from the name' },
      { name: 'isPackage', label: 'Show in "Our Packages"', type: 'checkbox' },
      { name: 'isFeatured', label: 'Show in "Featured picks"', type: 'checkbox' },
      { name: 'isActive', label: 'Visible in the shop', type: 'checkbox' },
    ],
    schema: z.object({
      name: text(2, 120), slug: z.string().trim().max(120), category: objectId.or(z.literal('')),
      price: z.coerce.number().min(0.01, 'Enter a price').max(10_000_000),
      points: z.coerce.number().min(0).max(1_000_000),
      stock: z.coerce.number().int().min(0).max(1_000_000),
      description: z.string().trim().max(3000), image: url,
      isPackage: z.boolean(), isFeatured: z.boolean(), isActive: z.boolean(),
    }),
    columns: [
      { label: 'Name', get: (d) => d.name },
      { label: 'Category', get: (d) => d.category?.name || '—' },
      { label: 'Price', get: (d) => formatTaka(d.pricePaisa) },
      { label: 'Stock', get: (d) => d.stock },
      { label: 'Status', get: (d) => (d.isActive ? 'Visible' : 'Hidden') },
    ],
    toForm: (d) => ({ name: d.name, slug: d.slug, category: d.category ? String(d.category._id || d.category) : '', price: d.pricePaisa / 100, points: (d.pointsX100 || 0) / 100, stock: d.stock, description: d.description || '', image: d.images?.[0] || '', isPackage: d.isPackage, isFeatured: d.isFeatured, isActive: d.isActive }),
    toDoc: (v) => ({ name: v.name, category: v.category || null, pricePaisa: Math.round(v.price * 100), pointsX100: Math.round(v.points * 100), stock: v.stock, description: v.description, images: v.image ? [v.image] : [], isPackage: v.isPackage, isFeatured: v.isFeatured, isActive: v.isActive }),
    defaults: { price: '', points: 0, stock: 100, isActive: true },
    loadOptions: async () => ({ category: [{ value: '', label: '— No category —' }, ...(await Category.find().sort({ order: 1 }).lean()).map((c) => ({ value: String(c._id), label: c.name }))] }),
  },

  categories: {
    label: 'Category', plural: 'Categories', model: Category, hasSlug: true, searchField: 'name', sort: { order: 1 }, canDelete: true,
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'order', label: 'Display order', type: 'number', step: '1', hint: 'Smaller numbers appear first' },
      { name: 'slug', label: 'URL slug', type: 'text', hint: 'Leave empty to generate from the name' },
      { name: 'isActive', label: 'Visible in the shop', type: 'checkbox' },
    ],
    schema: z.object({ name: text(2, 80), slug: z.string().trim().max(80), image: url, order: z.coerce.number().int().min(0).max(1000), isActive: z.boolean() }),
    columns: [{ label: 'Name', get: (d) => d.name }, { label: 'Order', get: (d) => d.order }, { label: 'Status', get: (d) => (d.isActive ? 'Visible' : 'Hidden') }],
    toForm: (d) => ({ name: d.name, slug: d.slug, image: d.image || '', order: d.order, isActive: d.isActive }),
    toDoc: (v) => ({ name: v.name, image: v.image, order: v.order, isActive: v.isActive }),
    defaults: { order: 0, isActive: true },
    beforeDelete: async (id) => ((await Product.exists({ category: id })) ? 'Move or hide the products in this category first.' : null),
  },

  banners: {
    label: 'Hero banner', plural: 'Hero banners', model: HeroBanner, sort: { order: 1 }, canDelete: true,
    fields: [
      { name: 'image', label: 'Banner image', type: 'image', required: true, hint: 'Wide image, about 1600×600' },
      { name: 'alt', label: 'Description (for screen readers)', type: 'text' },
      { name: 'linkUrl', label: 'Link when clicked', type: 'text', hint: 'Optional, e.g. /shop' },
      { name: 'order', label: 'Display order', type: 'number', step: '1' },
      { name: 'isActive', label: 'Visible', type: 'checkbox' },
    ],
    schema: z.object({ image: url, alt: z.string().trim().max(200), linkUrl: z.string().trim().max(300), order: z.coerce.number().int().min(0).max(1000), isActive: z.boolean() }),
    columns: [{ label: 'Image', get: (d) => d.image?.split('/').pop() }, { label: 'Order', get: (d) => d.order }, { label: 'Status', get: (d) => (d.isActive ? 'Visible' : 'Hidden') }],
    toForm: (d) => ({ image: d.image, alt: d.alt, linkUrl: d.linkUrl, order: d.order, isActive: d.isActive }),
    toDoc: (v) => v,
    defaults: { order: 0, isActive: true, alt: 'Bright Smart Shop banner' },
  },

  team: {
    label: 'Team member', plural: 'Management team', model: TeamMember, searchField: 'name', sort: { order: 1 }, canDelete: true,
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'text', required: true },
      { name: 'photo', label: 'Photo', type: 'image' },
      { name: 'facebook', label: 'Facebook link', type: 'text' },
      { name: 'linkedin', label: 'LinkedIn link', type: 'text' },
      { name: 'instagram', label: 'Instagram link', type: 'text' },
      { name: 'order', label: 'Display order', type: 'number', step: '1' },
      { name: 'isActive', label: 'Visible on About Us', type: 'checkbox' },
    ],
    schema: z.object({ name: text(2, 80), role: text(2, 80), photo: url, facebook: url, linkedin: url, instagram: url, order: z.coerce.number().int().min(0).max(1000), isActive: z.boolean() }),
    columns: [{ label: 'Name', get: (d) => d.name }, { label: 'Role', get: (d) => d.role }, { label: 'Status', get: (d) => (d.isActive ? 'Visible' : 'Hidden') }],
    toForm: (d) => ({ name: d.name, role: d.role, photo: d.photo, facebook: d.socials?.facebook || '', linkedin: d.socials?.linkedin || '', instagram: d.socials?.instagram || '', order: d.order, isActive: d.isActive }),
    toDoc: (v) => ({ name: v.name, role: v.role, photo: v.photo, socials: { facebook: v.facebook, linkedin: v.linkedin, instagram: v.instagram }, order: v.order, isActive: v.isActive }),
    defaults: { order: 0, isActive: true },
  },

  levels: {
    label: 'Level', plural: 'Levels', model: LevelConfig, sort: { level: 1 }, canDelete: false,
    fields: [
      { name: 'level', label: 'Level number', type: 'number', step: '1', required: true },
      { name: 'threshold', label: 'Package (Points needed)', type: 'number', step: '1', required: true, hint: 'Lifetime Points from the customer\'s own delivered orders' },
      { name: 'reward', label: 'Taka (credited once)', type: 'number', step: '0.01', required: true },
      { name: 'designation', label: 'Designation', type: 'text', hint: 'Fill only on the level where a new designation begins' },
    ],
    schema: z.object({ level: z.coerce.number().int().min(1).max(100), threshold: z.coerce.number().int().min(0), reward: z.coerce.number().min(0), designation: z.string().trim().max(60) }),
    columns: [{ label: 'Level', get: (d) => d.level }, { label: 'Package', get: (d) => d.threshold.toLocaleString('en-US') }, { label: 'Taka', get: (d) => (d.rewardPaisa / 100).toLocaleString('en-US') }, { label: 'Designation', get: (d) => d.designation || '' }],
    toForm: (d) => ({ level: d.level, threshold: d.threshold, reward: d.rewardPaisa / 100, designation: d.designation }),
    toDoc: (v) => ({ level: v.level, threshold: v.threshold, rewardPaisa: Math.round(v.reward * 100), designation: v.designation }),
    defaults: {},
  },

  notifications: {
    label: 'Notification', plural: 'Notification bar', model: Notification, canDelete: true,
    fields: [
      { name: 'message', label: 'Message', type: 'text', required: true },
      { name: 'linkUrl', label: 'Link (optional)', type: 'text', hint: 'e.g. /shop' },
      { name: 'linkLabel', label: 'Link text', type: 'text' },
      { name: 'isActive', label: 'Show on the site', type: 'checkbox', hint: 'Only one notification is shown: turning this on hides the others' },
    ],
    schema: z.object({ message: text(2, 240), linkUrl: z.string().trim().max(300), linkLabel: z.string().trim().max(60), isActive: z.boolean() }),
    columns: [{ label: 'Message', get: (d) => d.message }, { label: 'Status', get: (d) => (d.isActive ? 'Showing' : 'Hidden') }],
    toForm: (d) => ({ message: d.message, linkUrl: d.linkUrl, linkLabel: d.linkLabel, isActive: d.isActive }),
    toDoc: (v) => v,
    defaults: { isActive: true },
    afterSave: async (doc) => {
      if (doc.isActive) await Notification.updateMany({ _id: { $ne: doc._id } }, { $set: { isActive: false } });
      revalidateTag('notification');
    },
  },
};
