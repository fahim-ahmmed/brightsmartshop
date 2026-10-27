import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { db } from "@/lib/mongo-client";

const STAFF_ROLE = /^(admin|super admin|sub-?admin)$/i;
const PHONE_DOMAIN = "@brightsmartshop.local";

// 🟢 আপনার Top 10 Founder Accounts (১ থেকে ১০)
export const TOP_10_FOUNDERS = [
  { seq: 1, name: "BRIGHT SMART SHOP 1", phone: "01727629513", password: "uz0Bic5Y1HZ5", referralCode: "20260001" },
  { seq: 2, name: "BRIGHT SMART SHOP 2", phone: "017276295132", password: "dNVVjFIjTwEe", referralCode: "20260002" },
  { seq: 3, name: "BRIGHT SMART SHOP 3", phone: "017276295133", password: "U60nX1SXm41p", referralCode: "20260003" },
  { seq: 4, name: "BRIGHT SMART SHOP 4", phone: "017276295134", password: "Ak01c4oS2Vq4", referralCode: "20260004" },
  { seq: 5, name: "BRIGHT SMART SHOP 5", phone: "017276295135", password: "SAE0yReks7II", referralCode: "20260005" },
  { seq: 6, name: "BRIGHT SMART SHOP 6", phone: "017276295136", password: "iM9tWQMCJzkp", referralCode: "20260006" },
  { seq: 7, name: "BRIGHT SMART SHOP 7", phone: "017276295137", password: "cjj4FzJo0Ek6", referralCode: "20260007" },
  { seq: 8, name: "BRIGHT SMART SHOP 8", phone: "017276295138", password: "1b1J1XUdEWyp", referralCode: "20260008" },
  { seq: 9, name: "BRIGHT SMART SHOP 9", phone: "017276295139", password: "hwT5g8CzbTfi", referralCode: "20260009" },
  { seq: 10, name: "BRIGHT SMART SHOP 10", phone: "0172762951310", password: "wHLpVzl_o3mS", referralCode: "20260010" },
];

function generateReferralCode() {
  return `2026${Math.floor(1000 + Math.random() * 9000)}`;
}

function buildProfile(authDoc) {
  const rawEmail = String(authDoc.email || "").trim();
  const fake = rawEmail.endsWith(PHONE_DOMAIN);
  const phone = authDoc.mobile || authDoc.phone || (fake ? rawEmail.slice(0, -PHONE_DOMAIN.length) : "");
  // 🟢 কখনোই ফাঁকা স্ট্রিং ("") দেওয়া যাবে না, নাহলে MongoDB Unique Index এ ডুপ্লিকেট এরর খেয়ে নতুন ইউজার ব্লক হয়ে যাবে
  const safeEmail = rawEmail || `${phone || String(authDoc._id)}${PHONE_DOMAIN}`;

  return {
    name: authDoc.name || "Customer",
    phone: phone,
    mobile: phone,
    email: safeEmail,
    address: authDoc.address || "",
    role: "user",
    level: authDoc.level || 0,
    walletBalance: authDoc.walletBalance || 0,
    reservePoints: authDoc.reservePoints || 0,
    totalPackages: authDoc.totalPackages || 0,
    referralCode: authDoc.referralCode || generateReferralCode(),
    sponsorCode: authDoc.sponsorCode || authDoc.referredBy || "",
    authUserId: String(authDoc._id),
    createdAt: authDoc.createdAt || new Date(),
    updatedAt: new Date(),
  };
}

let _idx = null;
async function ensureProfileIndexes() {
  if (!_idx) {
    _idx = (async () => {
      try {
        const usersCol = db.collection("users");
        // আগে যেসব ইউজারের email: "" হয়ে আটকে ছিল সেগুলো ঠিক করা
        const emptyEmailUsers = await usersCol.find({ email: "" }).toArray();
        for (const u of emptyEmailUsers) {
          const fixedEmail = `${u.phone || String(u._id)}${PHONE_DOMAIN}`;
          await usersCol.updateOne({ _id: u._id }, { $set: { email: fixedEmail } }).catch(() => null);
        }

        await usersCol.createIndex(
          { authUserId: 1 },
          { unique: true, partialFilterExpression: { authUserId: { $type: "string" } } }
        );
      } catch (err) {
        console.error("[users index]", err?.message);
      }
    })();
  }
  return _idx;
}

// users প্রোফাইল খোঁজা: Better Auth আইডি, users._id অথবা ফোন নাম্বার দিয়ে মিলবে
export async function findProfile(id) {
  const key = String(id || "").trim();
  if (!key) return null;
  const or = [{ authUserId: key }, { referralCode: key }, { phone: key }];
  if (ObjectId.isValid(key)) or.unshift({ _id: new ObjectId(key) });
  return db.collection("users").findOne({ $or: or });
}

// প্রোফাইল না থাকলে user ডকুমেন্ট থেকে বানিয়ে দেয়
export async function ensureProfile(id) {
  await ensureProfileIndexes();
  const existing = await findProfile(id);
  if (existing) return existing;

  const key = String(id || "").trim();
  let authDoc = null;
  if (ObjectId.isValid(key)) {
    authDoc = await db.collection("user").findOne({ _id: new ObjectId(key) });
  }
  if (!authDoc) {
    authDoc = await db.collection("user").findOne({
      $or: [{ id: key }, { mobile: key }, { email: key }, { email: `${key}${PHONE_DOMAIN}` }],
    });
  }

  if (!authDoc || STAFF_ROLE.test(String(authDoc.role || ""))) return null;

  // যদি ফোন নাম্বার দিয়ে আগে থেকেই users কালেকশনে প্রোফাইল থাকে, তবে authUserId যুক্ত করে দেওয়া
  const phone = authDoc.mobile || (String(authDoc.email || "").endsWith(PHONE_DOMAIN) ? String(authDoc.email).slice(0, -PHONE_DOMAIN.length) : "");
  if (phone) {
    const byPhone = await db.collection("users").findOne({ $or: [{ phone }, { mobile: phone }] });
    if (byPhone) {
      await db.collection("users").updateOne(
        { _id: byPhone._id },
        { $set: { authUserId: String(authDoc._id), updatedAt: new Date() } }
      );
      return { ...byPhone, authUserId: String(authDoc._id) };
    }
  }

  const doc = buildProfile(authDoc);
  try {
    const res = await db.collection("users").insertOne(doc);
    return { _id: res.insertedId, ...doc };
  } catch (err) {
    if (err?.code === 11000) {
      // যদি অন্য কোনো ফিল্ডে ডুপ্লিকেট হয়, তবে ইউনিক ইমেইল দিয়ে আবার চেষ্টা করা
      doc.email = `${ String(authDoc._id) }_${Date.now()}${PHONE_DOMAIN}`;
      const retry = await db.collection("users").insertOne(doc).catch(() => null);
      if (retry?.insertedId) return { _id: retry.insertedId, ...doc };
      return findProfile(key);
    }
    throw err;
  }
}

// 🟢 টপ ১০টি আইডি (১-১০) এবং নতুন সাইন-আপ করা সকল ইউজারকে স্বয়ংক্রিয়ভাবে সিঙ্ক করা
export async function syncMissingProfiles() {
  await ensureProfileIndexes();
  const authCol = db.collection("user");
  const usersCol = db.collection("users");
  const chainCol = db.collection("global_chain");

  // ১. টপ ১০টি ফাউন্ডার আইডি নিশ্চিত করা
  const baseDate = new Date("2026-10-22T00:00:00.000Z");
  for (const f of TOP_10_FOUNDERS) {
    const email = `${f.phone}${PHONE_DOMAIN}`;
    let authDoc = await authCol.findOne({ $or: [{ email }, { mobile: f.phone }, { name: f.name }] });

    // যদি লগইন অ্যাকাউন্ট ডিলিট হয়ে গিয়ে থাকে, তবে Better Auth দিয়ে পুনরায় তৈরি করা যাতে লগইন কাজ করে
    if (!authDoc) {
      try {
        await auth.api.signUpEmail({
          body: {
            email,
            password: f.password,
            name: f.name,
            mobile: f.phone,
            address: "Bright Smart Shop HQ",
          },
        });
        authDoc = await authCol.findOne({ email });
      } catch (e) {
        // Fallback direct insert if signUpEmail fails
        const ins = await authCol.insertOne({
          name: f.name,
          email,
          emailVerified: false,
          mobile: f.phone,
          address: "Bright Smart Shop HQ",
          role: "user",
          createdAt: new Date(baseDate.getTime() + f.seq * 1000),
          updatedAt: new Date(),
        }).catch(() => null);
        if (ins?.insertedId) authDoc = await authCol.findOne({ _id: ins.insertedId });
      }
    }

    const authUserId = authDoc ? String(authDoc._id) : undefined;
    let profile = await usersCol.findOne({
      $or: [
        ...(authUserId ? [{ authUserId }] : []),
        { phone: f.phone },
        { name: f.name },
      ],
    });

    if (!profile) {
      const newProfile = {
        name: f.name,
        phone: f.phone,
        mobile: f.phone,
        email,
        password: f.password,
        rawPassword: f.password,
        address: "Bright Smart Shop HQ",
        role: "user",
        isSystemFounder: true,
        founderOrder: f.seq,
        referralCode: f.referralCode,
        sponsorCode: "SYSTEM-TOP",
        level: 0,
        walletBalance: 0,
        reservePoints: 0,
        totalPackages: 1,
         ...(authUserId ? { authUserId } : {}),
        createdAt: new Date(baseDate.getTime() + f.seq * 1000),
        updatedAt: new Date(),
      };
      const ins = await usersCol.insertOne(newProfile).catch(() => null);
      if (ins?.insertedId) profile = { _id: ins.insertedId, ...newProfile };
    } else {
      await usersCol.updateOne(
        { _id: profile._id },
        {
          $set: {
            name: f.name,
            phone: f.phone,
            isSystemFounder: true,
            founderOrder: f.seq,
            password: profile.password || f.password,
            rawPassword: profile.rawPassword || f.password,
            referralCode: profile.referralCode || f.referralCode,
            ...(authUserId ? { authUserId } : {}),
          },
        }
      ).catch(() => null);
    }

    // গ্লোবাল চেইনে ১ থেকে ১০ পজিশন নিশ্চিত করা
    if (profile) {
      const agg = await chainCol
        .aggregate([
          { $match: { sequenceNo: {$gt: f.seq } } },
          { $group: { _id: null, count: {$sum: 1 } } },
        ])
        .toArray();
      const accumulated = agg[0]?.count || 0;

      await chainCol.updateOne(
        { sequenceNo: f.seq },
        {
          $set: {
            userId: String(profile._id),
            ...(authUserId ? { authUserId } : {}),
            userName: f.name,
            phone: f.phone,
            chainAccountId: `M-${f.referralCode}`,
            isManId: true,
            isSystemFounder: true,
          },
          $setOnInsert: {
            points: 40,
            packages: 1,
            accumulatedPackages: accumulated,
            currentLevel: profile.level || 0,
            createdAt: new Date(baseDate.getTime() + f.seq * 1000),
          },
        },
        { upsert: true }
      ).catch(() => null);
    }
  }

  // ২. সাধারণ যেসব ইউজার সাইন-আপ করেছে কিন্তু users কালেকশনে নেই, তাদের প্রোফাইল তৈরি করা
  const authUsers = await authCol.find({ role: { $not: STAFF_ROLE } }).toArray();
  let syncedCount = 0;

  for (const u of authUsers) {
    const uid = String(u._id);
    const phone = u.mobile || (String(u.email || "").endsWith(PHONE_DOMAIN) ? String(u.email).slice(0, -PHONE_DOMAIN.length) : "");

    const existing = await usersCol.findOne({
      $or: [
        { authUserId: uid },
        ...(phone ? [{ phone }, { mobile: phone }] : []),
        ...(u.email ? [{ email: u.email }] : []),
      ],
    });

    if (!existing) {
      const doc = buildProfile(u);
      await usersCol.insertOne(doc).catch(() => null);
      syncedCount++;
    } else if (!existing.authUserId) {
      await usersCol.updateOne({ _id: existing._id }, { $set: { authUserId: uid } }).catch(() => null);
    }
  }

  return syncedCount;
}

export async function getCurrentUser(req) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) return null;
    const legacy = await ensureProfile(String(session.user.id));
    return { authUser: session.user, legacy };
  } catch (e) {
    return null;
  }
}

// 🟢 অ্যাডমিন যাচাইকরণ: সেশন অথবা admin_session কুকি যেকোনোটি থাকলেই কাজ করবে
export async function requireAdmin(req, { allowSub = true } = {}) {
  try {
    // ১. কুকি চেক (/219192026/login থেকে লগইন করলে এই কুকি সেট হয়)
    const cookieHeader = req?.headers?.get?.("cookie") || "";
    const hasAdminCookie =
      req?.cookies?.get?.("admin_session")?.value === "active" ||
      cookieHeader.includes("admin_session=active");

    if (hasAdminCookie) {
      return { id: "admin", role: "admin" };
    }

    // ২. Better Auth সেশন চেক
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) return null;

    const uid = String(session.user.id);
    const authDoc = ObjectId.isValid(uid)
      ? await db.collection("user").findOne({ _id: new ObjectId(uid) })
      : null;
    const userDoc = await findProfile(uid);

    const role = String(authDoc?.role || userDoc?.role || session.user.role || "").toLowerCase();
    if (role === "admin" || role === "super admin") return session.user;
    if (allowSub && (role === "sub-admin" || role === "subadmin")) return session.user;

    return null;
  } catch (e) {
    return null;
  }
}