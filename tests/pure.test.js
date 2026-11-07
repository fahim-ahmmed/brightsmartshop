import { describe, expect, it } from 'vitest';
import { computeLevelInfo } from '../src/features/wallet/levels.js';
import { changePasswordSchema, normalizeMobile, registerSchema } from '../src/features/auth/validation.js';
import { formatPoints, formatTaka } from '../src/lib/format.js';
import { rateLimit } from '../src/lib/rate-limit.js';
import { slugify } from '../src/lib/slug.js';

const PACKAGES = [3, 5, 9, 16, 33, 65, 129, 257, 513, 1025];
const TAKA = [0, 3, 4, 8, 15, 32, 60, 100, 250, 510];
const levels = PACKAGES.map((t, i) => ({ level: i + 1, threshold: t, rewardPaisa: TAKA[i] * 100, designation: { 1: 'Preferred Customer', 5: 'General Customer', 10: 'Regular Customer' }[i + 1] || '' }));

describe('levels', () => {
  it('starts with no level', () => {
    const info = computeLevelInfo(levels, 0);
    expect(info.current).toBeNull();
    expect(info.next.level).toBe(1);
  });
  it('reaches level 5 at 33 Points and inherits designation', () => {
    expect(computeLevelInfo(levels, 3300).current.level).toBe(5);
    expect(computeLevelInfo(levels, 3300).designation).toBe('General Customer');
    expect(computeLevelInfo(levels, 2000).designation).toBe('Preferred Customer'); // level 4
  });
  it('reports 100% at the top', () => {
    const info = computeLevelInfo(levels, 10_000_000);
    expect(info.next).toBeNull();
    expect(info.percent).toBe(100);
  });
  it('rewards never exceed the Points needed (self-funding invariant)', () => {
    let cumulative = 0;
    for (const l of levels) {
      cumulative += l.rewardPaisa / 100;
      expect(cumulative).toBeLessThanOrEqual(l.threshold);
    }
  });
});

describe('validation', () => {
  it('normalizes Bangladeshi mobile numbers', () => {
    expect(normalizeMobile('+880 1712-345678')).toBe('01712345678');
    expect(normalizeMobile('8801712345678')).toBe('01712345678');
    expect(normalizeMobile('01712345678')).toBe('01712345678');
  });
  const base = { name: 'Test User', mobile: '01712345678', email: 'TEST@Example.com', address: 'Kushtia, Khulna', password: 'password123', confirmPassword: 'password123' };
  it('accepts a valid registration and lowercases the email', () => {
    const r = registerSchema.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.data.email).toBe('test@example.com');
  });
  it('rejects mismatched passwords, short passwords and bad mobiles', () => {
    expect(registerSchema.safeParse({ ...base, confirmPassword: 'other' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: 'short', confirmPassword: 'short' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, mobile: '12345' }).success).toBe(false);
  });
  it('requires the current password to change it', () => {
    expect(changePasswordSchema.safeParse({ currentPassword: '', newPassword: 'password123', confirmPassword: 'password123' }).success).toBe(false);
  });
});

describe('helpers', () => {
  it('formats money and points', () => {
    expect(formatTaka(34000)).toBe('৳340.00');
    expect(formatPoints(4000)).toBe('40');
    expect(formatPoints(4050)).toBe('40.50');
    expect(formatPoints(0, { fixed: true })).toBe('0.00');
  });
  it('slugifies', () => {
    expect(slugify('Harpic Toilet Cleaner – 750 ml')).toBe('harpic-toilet-cleaner-750-ml');
    expect(slugify('Tom & Jerry')).toBe('tom-and-jerry');
  });
  it('rate limiter blocks after the limit and separates keys', () => {
    const key = `t-${Math.random()}`;
    expect([1, 2, 3, 4].map(() => rateLimit(key, 3, 60000))).toEqual([true, true, true, false]);
    expect(rateLimit(`${key}-other`, 3, 60000)).toBe(true);
  });
});
