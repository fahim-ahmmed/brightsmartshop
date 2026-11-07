import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { db } from "@/lib/mongo-client";

const STAFF_ROLE = /^(admin|super admin|sub-?admin)$/i;
const PHONE_DOMAIN = "@brightsmartshop.local";

// 🟢 আপনার Top 10 Founder Accounts (১ থেকে ১০) - সিকোয়েন্স অনুযায়ী BSS- আইডি সহ
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
  // পুরো কালেকশন না এনে শুধু সর্বশেষ সিকোয়েন্স চেক করা
  const topSeqDoc = await usersCol
    .find({ userSequence: { $lt: 9000 } }, { projection: { userSequence: 1 } })
    .sort({ userSequence: -1 })
    .limit(1)
    .toArray();

  let maxSeq = topSeqDoc[0]?.userSequence || 10;
  if (maxSeq < 10) maxSeq = 10;

  const totalCount = await usersCol.countDocuments();
  if (totalCount > maxSeq) maxSeq = totalCount;

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

async function ensureProfileIndexes() {
  if (globalThis.__BSS_PROFILE_IDX__) return;
  globalThis.__BSS_PROFILE_IDX__ = true;
  try {
    const usersCol = db.collection("users");
    const emptyEmailUsers = await usersCol.find({ email: "" }).limit(50).toArray();
    if (emptyEmailUsers.length > 0) {
      const emailOps = emptyEmailUsers.map((u) => ({
        updateOne: {
          filter: { _id: u._id },
          update: { $set: { email: `${u.phone || String(u._id)}${PHONE_DOMAIN}` } },
        },
      }));
      await usersCol.bulkWrite(emailOps, { ordered: false }).catch(() => null);
    }

    await Promise.all([
      usersCol.createIndex(
        { authUserId: 1 },
        { unique: true, partialFilterExpression: { authUserId: { $type: "string" } } }
      ),
      usersCol.createIndex({ phone: 1 }),
      usersCol.createIndex({ mobile: 1 }),
      usersCol.createIndex({ referralCode: 1 }),
      usersCol.createIndex({ customerId: 1 }),
      usersCol.createIndex({ id: 1 }),
      usersCol.createIndex({ userSequence: -1 }),
    ]).catch(() => null);
  } catch (err) {
    console.error("[users index]", err?.message);
  }
}

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

export async function ensureProfile(id) {
  ensureProfileIndexes().catch(() => null);
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
    db.collection("user")
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

// 🟢 সুপার-ফাস্ট বাল্ক সিঙ্ক (৫ মিনিটে মাত্র ১ বার ব্যাকগ্রাউন্ডে চলবে, লুপের ভেতরে কোনো সিঙ্গেল কুয়েরি নেই)
export async function syncMissingProfiles(force = false) {
  const now = Date.now();
  if (!force) {
    if (globalThis.__BSS_SYNC_RUNNING__) return 0;
    if (globalThis.__BSS_LAST_SYNC__ && now - globalThis.__BSS_LAST_SYNC__ < 300000) {
      return 0;
    }
  }
  globalThis.__BSS_SYNC_RUNNING__ = true;
  globalThis.__BSS_LAST_SYNC__ = now;

  try {
    await ensureProfileIndexes();
    const authCol = db.collection("user");
    const usersCol = db.collection("users");
    const chainCol = db.collection("global_chain");

    const baseDate = new Date("2026-10-22T00:00:00.000Z");

    // ১. টপ ১০ ফাউন্ডার চেক (শুধুমাত্র ১ বার যদি মিসিং থাকে)
    if (!globalThis.__BSS_FOUNDERS_VERIFIED__) {
      const existingFoundersCount = await usersCol.countDocuments({ isSystemFounder: true });
      if (existingFoundersCount < 10) {
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
      }
      globalThis.__BSS_FOUNDERS_VERIFIED__ = true;
    }

    // ২. সব ইউজার এবং প্রোফাইল মাত্র ১টি কুয়েরিতে মেমরিতে নিয়ে আসা
    const [authUsers, allExistingProfiles] = await Promise.all([
      authCol.find({ role: { $not: STAFF_ROLE } }).toArray(),
      usersCol.find({}).sort({ createdAt: 1, _id: 1 }).toArray(),
    ]);

    const byAuthId = new Map();
    const byPhone = new Map();
    const byEmail = new Map();
    let maxSeq = 10;

    for (const p of allExistingProfiles) {
      if (p.authUserId) byAuthId.set(String(p.authUserId), p);
      if (p.phone) byPhone.set(String(p.phone), p);
      if (p.mobile) byPhone.set(String(p.mobile), p);
      if (p.email) byEmail.set(String(p.email), p);
      if (typeof p.userSequence === "number" && p.userSequence > maxSeq && p.userSequence < 9000) {
        maxSeq = p.userSequence;
      }
    }

    let syncedCount = 0;
    const newDocsToInsert = [];
    const profileBulkOps = [];
    const authBulkOps = [];

    for (const u of authUsers) {
      const uid = String(u._id);
      const phone =
        u.mobile ||
        (String(u.email || "").endsWith(PHONE_DOMAIN)
          ? String(u.email).slice(0, -PHONE_DOMAIN.length)
          : "");

      const existing =
        byAuthId.get(uid) ||
        (phone ? byPhone.get(phone) : null) ||
        (u.email ? byEmail.get(String(u.email)) : null);

      if (!existing) {
        maxSeq++;
        const bssId = formatBssId(maxSeq);
        const doc = buildProfile(u, bssId, maxSeq);
        newDocsToInsert.push(doc);
        byAuthId.set(uid, doc);
        if (phone) byPhone.set(phone, doc);
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
        if (Object.keys(updates).length > 0 && existing._id) {
          profileBulkOps.push({
            updateOne: { filter: { _id: existing._id }, update: { $set: updates } },
          });
        }
      }
    }

    if (newDocsToInsert.length > 0) {
      await usersCol.insertMany(newDocsToInsert, { ordered: false }).catch(() => null);
    }

    // ৩. মেমরিতেই BSS-2026xxxx আইডি ও স্পন্সর ম্যাপ তৈরি করা (কোনো ডাটাবেস লুপ ছাড়াই)
    const oldToNewBssMap = new Map();
    const nonFounders = [];

    for (const p of allExistingProfiles) {
      if (p.isSystemFounder) {
        const bss = p.referralCode;
        if (p._id) oldToNewBssMap.set(String(p._id), bss);
        if (p.authUserId) oldToNewBssMap.set(String(p.authUserId), bss);
        if (p.phone) oldToNewBssMap.set(String(p.phone), bss);
        if (bss) {
          oldToNewBssMap.set(bss, bss);
          oldToNewBssMap.set(bss.replace(/^BSS-/i, ""), bss);
        }
      } else if (!STAFF_ROLE.test(String(p.role || ""))) {
        nonFounders.push(p);
      }
    }

    let seqCounter = 10;
    for (const u of nonFounders) {
      seqCounter++;
      const expectedBssId = formatBssId(seqCounter);
      const oldRef = String(u.referralCode || "");

      if (u._id) oldToNewBssMap.set(String(u._id), expectedBssId);
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
        profileBulkOps.push({
          updateOne: {
            filter: { _id: u._id },
            update: {
              $set: {
                userSequence: seqCounter,
                id: expectedBssId,
                customerId: expectedBssId,
                referralCode: expectedBssId,
              },
            },
          },
        });

        if (u.authUserId && ObjectId.isValid(u.authUserId)) {
          authBulkOps.push({
            updateOne: {
              filter: { _id: new ObjectId(u.authUserId) },
              update: { $set: { referralCode: expectedBssId, customerId: expectedBssId } },
            },
          });
        }
      }
    }

    // ৪. স্পন্সর কোডগুলো বাল্ক আপডেটে যুক্ত করা
    for (const p of allExistingProfiles) {
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
        profileBulkOps.push({
          updateOne: {
            filter: { _id: p._id },
            update: {
              $set: {
                sponsorCode: mappedSponsorBss,
                sponsorId: mappedSponsorBss,
                referredBy: mappedSponsorBss,
              },
            },
          },
        });
      }
    }

    if (profileBulkOps.length > 0) {
      await usersCol.bulkWrite(profileBulkOps, { ordered: false }).catch(() => null);
    }
    if (authBulkOps.length > 0) {
      await authCol.bulkWrite(authBulkOps, { ordered: false }).catch(() => null);
    }

    return syncedCount;
  } finally {
    globalThis.__BSS_SYNC_RUNNING__ = false;
  }
}

// 🟢 লগইন করা ইউজারের সেশন ১০ সেকেন্ডের জন্য মেমরিতে ক্যাশ থাকবে যাতে এক পেজ থেকে অন্য পেজে যেতে ০ সেকেন্ড লাগে
export async function getCurrentUser(req) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) return null;

    const uid = String(session.user.id);
    const now = Date.now();
    const userCache = globalThis.__BSS_USER_CACHE__ || (globalThis.__BSS_USER_CACHE__ = new Map());
    const cached = userCache.get(uid);

    if (cached && now - cached.t < 10000) {
      return { authUser: session.user, legacy: cached.legacy };
    }

    const legacy = await ensureProfile(uid);
    if (legacy) {
      userCache.set(uid, { legacy, t: now });
    }
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
    const [authDoc, userDoc] = await Promise.all([
      ObjectId.isValid(uid) ? db.collection("user").findOne({ _id: new ObjectId(uid) }) : null,
      findProfile(uid),
    ]);

    const role = String(authDoc?.role || userDoc?.role || session.user.role || "").toLowerCase();
    if (role === "admin" || role === "super admin") return session.user;
    if (allowSub && (role === "sub-admin" || role === "subadmin")) return session.user;

    return null;
  } catch (e) {
    return null;
  }
}