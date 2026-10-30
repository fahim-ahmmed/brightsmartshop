import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { db } from "@/lib/mongo-client";

const STAFF_ROLE = /^(admin|super admin|sub-?admin)$/i;
const PHONE_DOMAIN = "@brightsmartshop.local";

// 🟢 আপনার Top 10 Founder Accounts (১ থেকে ১০) - সিকোয়েন্স অনুযায়ী BSS- আইডি সহ
export const TOP_10_FOUNDERS = [
  { seq: 1, name: "BRIGHT SMART SHOP 1", phone: "01727629513", password: "uz0Bic5Y1HZ5", referralCode: "BSS-20260001" },
  { seq: 2, name: "BRIGHT SMART SHOP 2", phone: "017276295132", password: "dNVVjFIjTwEe", referralCode: "BSS-20260002" },
  { seq: 3, name: "BRIGHT SMART SHOP 3", phone: "017276295133", password: "U60nX1SXm41p", referralCode: "BSS-20260003" },
  { seq: 4, name: "BRIGHT SMART SHOP 4", phone: "017276295134", password: "Ak01c4oS2Vq4", referralCode: "BSS-20260004" },
  { seq: 5, name: "BRIGHT SMART SHOP 5", phone: "017276295135", password: "SAE0yReks7II", referralCode: "BSS-20260005" },
  { seq: 6, name: "BRIGHT SMART SHOP 6", phone: "017276295136", password: "iM9tWQMCJzkp", referralCode: "BSS-20260006" },
  { seq: 7, name: "BRIGHT SMART SHOP 7", phone: "017276295137", password: "cjj4FzJo0Ek6", referralCode: "BSS-20260007" },
  { seq: 8, name: "BRIGHT SMART SHOP 8", phone: "017276295138", password: "1b1J1XUdEWyp", referralCode: "BSS-20260008" },
  { seq: 9, name: "BRIGHT SMART SHOP 9", phone: "017276295139", password: "hwT5g8CzbTfi", referralCode: "BSS-20260009" },
  { seq: 10, name: "BRIGHT SMART SHOP 10", phone: "0172762951310", password: "wHLpVzl_o3mS", referralCode: "BSS-20260010" },
];

export function formatBssId(seqNum) {
  return `BSS-2026${String(seqNum).padStart(4, "0")}`;
}

export async function generateNextBssId() {
  const usersCol = db.collection("users");
  const all = await usersCol
    .find({}, { projection: { referralCode: 1, customerId: 1, userSequence: 1 } })
    .toArray();

  let maxSeq = 10;
  for (const u of all) {
    if (typeof u.userSequence === "number" && u.userSequence > maxSeq) {
      maxSeq = u.userSequence;
    }
    const code = String(u.referralCode || u.customerId || "");
    const m = code.match(/2026(\d{4,})$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxSeq && n < 9000) maxSeq = n;
    }
  }
  const nextSeq = maxSeq + 1;
  return { seq: nextSeq, bssId: formatBssId(nextSeq) };
}

function buildProfile(authDoc, bssId, seq) {
  const rawEmail = String(authDoc.email || "").trim();
  const fake = rawEmail.endsWith(PHONE_DOMAIN);
  const phone = authDoc.mobile || authDoc.phone || (fake ? rawEmail.slice(0, -PHONE_DOMAIN.length) : "");
  const safeEmail = rawEmail || `${phone || String(authDoc._id)}${PHONE_DOMAIN}`;
  const sponsor =
    authDoc.sponsorCode ||
    authDoc.sponsorId ||
    authDoc.referredBy ||
    authDoc.referral ||
    "";

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
    userSequence: seq,
    id: bssId,
    customerId: bssId,
    referralCode: bssId,
    sponsorCode: sponsor,
    sponsorId: sponsor,
    referredBy: sponsor,
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

// users প্রোফাইল খোঁজা: BSS ID, পুরাতন কোড, Better Auth আইডি, users._id অথবা ফোন নাম্বার সবকিছু দিয়েই মিলবে
export async function findProfile(id) {
  const key = String(id || "").trim();
  if (!key) return null;
  const cleanDigits = key.replace(/^BSS-/i, "");
  const withBss = key.toUpperCase().startsWith("BSS-") ? key.toUpperCase() : `BSS-${cleanDigits}`;

  const or = [
    { authUserId: key },
    { referralCode: key },
    { referralCode: withBss },
    { referralCode: cleanDigits },
    { customerId: key },
    { customerId: withBss },
    { id: key },
    { id: withBss },
    { phone: key },
    { mobile: key },
  ];
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

  const phone =
    authDoc.mobile ||
    (String(authDoc.email || "").endsWith(PHONE_DOMAIN)
      ? String(authDoc.email).slice(0, -PHONE_DOMAIN.length)
      : "");

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

  const { seq, bssId } = await generateNextBssId();
  const doc = buildProfile(authDoc, bssId, seq);

  try {
    const res = await db.collection("users").insertOne(doc);
    await db
      .collection("user")
      .updateOne(
        { _id: authDoc._id },
        { $set: { referralCode: bssId, customerId: bssId } }
      )
      .catch(() => null);
    return { _id: res.insertedId, ...doc };
  } catch (err) {
    if (err?.code === 11000) {
      doc.email = `${String(authDoc._id)}_${Date.now()}${PHONE_DOMAIN}`;
      const retry = await db.collection("users").insertOne(doc).catch(() => null);
      if (retry?.insertedId) return { _id: retry.insertedId, ...doc };
      return findProfile(key);
    }
    throw err;
  }
}

// 🟢 টপ ১০টি আইডি, নতুন সাইন-আপ করা ইউজার এবং আগের সব টেস্ট ইউজারদের BSS- সিকোয়েন্স আইডি ও স্পন্সর লিংক অটো-ফিক্স করা
export async function syncMissingProfiles() {
  await ensureProfileIndexes();
  const authCol = db.collection("user");
  const usersCol = db.collection("users");
  const chainCol = db.collection("global_chain");

  // ১. টপ ১০টি ফাউন্ডার আইডি নিশ্চিত করা (BSS-20260001 থেকে BSS-20260010)
  const baseDate = new Date("2026-10-22T00:00:00.000Z");
  for (const f of TOP_10_FOUNDERS) {
    const email = `${f.phone}${PHONE_DOMAIN}`;
    let authDoc = await authCol.findOne({ $or: [{ email }, { mobile: f.phone }, { name: f.name }] });

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
        const ins = await authCol
          .insertOne({
            name: f.name,
            email,
            emailVerified: false,
            mobile: f.phone,
            address: "Bright Smart Shop HQ",
            role: "user",
            referralCode: f.referralCode,
            customerId: f.referralCode,
            createdAt: new Date(baseDate.getTime() + f.seq * 1000),
            updatedAt: new Date(),
          })
          .catch(() => null);
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
        userSequence: f.seq,
        id: f.referralCode,
        customerId: f.referralCode,
        referralCode: f.referralCode,
        sponsorCode: "SYSTEM-TOP",
        sponsorId: "SYSTEM-TOP",
        referredBy: "SYSTEM-TOP",
        level: 0,
        walletBalance: 0,
        reservePoints: 0,
        totalPackages: 0,
        ...(authUserId ? { authUserId } : {}),
        createdAt: new Date(baseDate.getTime() + f.seq * 1000),
        updatedAt: new Date(),
      };
      const ins = await usersCol.insertOne(newProfile).catch(() => null);
      if (ins?.insertedId) profile = { _id: ins.insertedId, ...newProfile };
    } else {
      await usersCol
        .updateOne(
          { _id: profile._id },
          {
            $set: {
              name: f.name,
              phone: f.phone,
              isSystemFounder: true,
              founderOrder: f.seq,
              userSequence: f.seq,
              id: f.referralCode,
              customerId: f.referralCode,
              referralCode: f.referralCode,
              password: profile.password || f.password,
              rawPassword: profile.rawPassword || f.password,
              ...(authUserId ? { authUserId } : {}),
            },
          }
        )
        .catch(() => null);
    }

    if (authDoc) {
      await authCol
        .updateOne(
          { _id: authDoc._id },
          { $set: { referralCode: f.referralCode, customerId: f.referralCode } }
        )
        .catch(() => null);
    }

    if (profile) {
      await chainCol
        .updateOne(
          { sequenceNo: f.seq },
          {
            $set: {
              userId: String(profile._id),
              ...(authUserId ? { authUserId } : {}),
              userName: f.name,
              phone: f.phone,
              chainAccountId: `M-${f.referralCode}`,
              isSystemFounder: true,
            },
            $setOnInsert: {
              isManId: true,
              points: 40,
              packages: 1,
              accumulatedPackages: 0,
              currentLevel: profile.level || 0,
              createdAt: new Date(baseDate.getTime() + f.seq * 1000),
            },
          },
          { upsert: true }
        )
        .catch(() => null);
    }
  }

  // ২. সাধারণ যেসব ইউজার সাইন-আপ করেছে কিন্তু users কালেকশনে নেই, তাদের প্রোফাইল তৈরি করা
  const authUsers = await authCol.find({ role: { $not: STAFF_ROLE } }).toArray();
  let syncedCount = 0;

  for (const u of authUsers) {
    const uid = String(u._id);
    const phone =
      u.mobile ||
      (String(u.email || "").endsWith(PHONE_DOMAIN)
        ? String(u.email).slice(0, -PHONE_DOMAIN.length)
        : "");

    const existing = await usersCol.findOne({
      $or: [
        { authUserId: uid },
        ...(phone ? [{ phone }, { mobile: phone }] : []),
        ...(u.email ? [{ email: u.email }] : []),
      ],
    });

    if (!existing) {
      const { seq, bssId } = await generateNextBssId();
      const doc = buildProfile(u, bssId, seq);
      await usersCol.insertOne(doc).catch(() => null);
      syncedCount++;
    } else {
      const updates = {};
      if (!existing.authUserId) updates.authUserId = uid;
      const authSponsor = u.sponsorCode || u.sponsorId || u.referredBy || "";
      if (authSponsor && !existing.sponsorCode) {
        updates.sponsorCode = authSponsor;
        updates.sponsorId = authSponsor;
        updates.referredBy = authSponsor;
      }
      if (Object.keys(updates).length > 0) {
        await usersCol.updateOne({ _id: existing._id }, { $set: updates }).catch(() => null);
      }
    }
  }

  // ৩. আগে খোলা সব ইউজারদের ক্রমানুসারে স্থায়ী BSS-2026xxxx আইডি দেওয়া এবং পুরাতন স্পন্সর কোডগুলোকে নতুন BSS- আইডিতে ম্যাপ করা
  const allNonFounders = await usersCol
    .find({ isSystemFounder: { $ne: true }, role: { $not: STAFF_ROLE } })
    .sort({ createdAt: 1, _id: 1 })
    .toArray();

  // পুরাতন যেকোনো আইডি (_id, authUserId, phone, পুরাতন 2026xxxx কোড) -> নতুন BSS-2026xxxx আইডির ম্যাপ
  const oldToNewBssMap = new Map();
  const founderDocs = await usersCol.find({ isSystemFounder: true }).toArray();
  for (const fd of founderDocs) {
    const bss = fd.referralCode;
    oldToNewBssMap.set(String(fd._id), bss);
    if (fd.authUserId) oldToNewBssMap.set(String(fd.authUserId), bss);
    if (fd.phone) oldToNewBssMap.set(String(fd.phone), bss);
    oldToNewBssMap.set(bss, bss);
    oldToNewBssMap.set(bss.replace(/^BSS-/i, ""), bss);
  }

  let seqCounter = 10;
  for (const u of allNonFounders) {
    seqCounter++;
    const expectedBssId = formatBssId(seqCounter);
    const oldRef = String(u.referralCode || "");

    // পুরাতন সব পরিচয় ম্যাপে রাখা যাতে তাকে যারা স্পন্সর হিসেবে ব্যবহার করেছে তাদের স্পন্সর কোডও ঠিক হয়ে যায়
    oldToNewBssMap.set(String(u._id), expectedBssId);
    if (u.authUserId) oldToNewBssMap.set(String(u.authUserId), expectedBssId);
    if (u.phone) oldToNewBssMap.set(String(u.phone), expectedBssId);
    if (oldRef) {
      oldToNewBssMap.set(oldRef, expectedBssId);
      oldToNewBssMap.set(oldRef.replace(/^BSS-/i, ""), expectedBssId);
    }

    if (
      u.referralCode !== expectedBssId ||
      u.customerId !== expectedBssId ||
      u.id !== expectedBssId ||
      u.userSequence !== seqCounter
    ) {
      await usersCol
        .updateOne(
          { _id: u._id },
          {
            $set: {
              userSequence: seqCounter,
              id: expectedBssId,
              customerId: expectedBssId,
              referralCode: expectedBssId,
            },
          }
        )
        .catch(() => null);

      if (u.authUserId && ObjectId.isValid(u.authUserId)) {
        await authCol
          .updateOne(
            { _id: new ObjectId(u.authUserId) },
            { $set: { referralCode: expectedBssId, customerId: expectedBssId } }
          )
          .catch(() => null);
      }
    }
  }

  // ৪. সকল ইউজারের sponsorCode যদি পুরাতন ফরম্যাটে বা ফোন/মঙ্গো আইডিতে থাকে তবে সঠিক BSS- আইডিতে আপডেট করা
  const allProfiles = await usersCol.find({}).toArray();
  for (const p of allProfiles) {
    const rawSponsor = String(p.sponsorCode || p.sponsorId || p.referredBy || "").trim();
    if (!rawSponsor || rawSponsor === "SYSTEM-TOP") continue;

    const cleanKey = rawSponsor.replace(/^BSS-/i, "");
    const mappedSponsorBss =
      oldToNewBssMap.get(rawSponsor) ||
      oldToNewBssMap.get(cleanKey) ||
      (rawSponsor.toUpperCase().startsWith("BSS-") ? rawSponsor.toUpperCase() : null);

    if (
      mappedSponsorBss &&
      (p.sponsorCode !== mappedSponsorBss ||
        p.sponsorId !== mappedSponsorBss ||
        p.referredBy !== mappedSponsorBss)
    ) {
      await usersCol
        .updateOne(
          { _id: p._id },
          {
            $set: {
              sponsorCode: mappedSponsorBss,
              sponsorId: mappedSponsorBss,
              referredBy: mappedSponsorBss,
            },
          }
        )
        .catch(() => null);
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

export async function requireAdmin(req, { allowSub = true } = {}) {
  try {
    const cookieHeader = req?.headers?.get?.("cookie") || "";
    const hasAdminCookie =
      req?.cookies?.get?.("admin_session")?.value === "active" ||
      cookieHeader.includes("admin_session=active");

    if (hasAdminCookie) {
      return { id: "admin", role: "admin" };
    }

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