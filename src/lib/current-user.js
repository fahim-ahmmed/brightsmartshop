import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { db } from "@/lib/mongo-client";

const STAFF_ROLE = /^(admin|super admin|sub-?admin)$/i;
const PHONE_DOMAIN = "@brightsmartshop.local";

function buildProfile(authDoc) {
  const email = String(authDoc.email || "");
  const fake = email.endsWith(PHONE_DOMAIN);
  return {
    name: authDoc.name || "Customer",
    phone: authDoc.mobile || (fake ? email.slice(0, -PHONE_DOMAIN.length) : ""),
    email: fake ? "" : email,
    address: authDoc.address || "",
    role: "user",
    level: 0,
    walletBalance: 0,
    totalPackages: 0,
    authUserId: String(authDoc._id),
    createdAt: authDoc.createdAt || new Date(),
  };
}

let _idx = null;
function ensureProfileIndexes() {
  if (!_idx) {
    _idx = db
      .collection("users")
      .createIndex(
        { authUserId: 1 },
        { unique: true, partialFilterExpression: { authUserId: { $type: "string" } } }
      )
      .catch((err) => {
        _idx = null;
        console.error("[users index]", err?.message);
      });
  }
  return _idx;
}

// users প্রোফাইল খোঁজা: Better Auth আইডি অথবা users._id দুটোতেই মিলবে
export async function findProfile(id) {
  const key = String(id || "").trim();
  if (!key) return null;
  const or = [{ authUserId: key }];
  if (ObjectId.isValid(key)) or.push({ _id: new ObjectId(key) });
  return db.collection("users").findOne({ $or: or });
}

// প্রোফাইল না থাকলে user ডকুমেন্ট থেকে বানিয়ে দেয় (অ্যাডমিনের জন্য বানায় না)
export async function ensureProfile(id) {
  const existing = await findProfile(id);
  if (existing) return existing;

  const key = String(id || "").trim();
  if (!ObjectId.isValid(key)) return null;
  const authDoc = await db.collection("user").findOne({ _id: new ObjectId(key) });
  if (!authDoc || STAFF_ROLE.test(String(authDoc.role || ""))) return null;

  await ensureProfileIndexes();
  const doc = buildProfile(authDoc);
  try {
    const res = await db.collection("users").insertOne(doc);
    return { _id: res.insertedId, ...doc };
  } catch (err) {
    if (err?.code === 11000) return findProfile(key);
    throw err;
  }
}

// যে পথেই সাইনআপ হোক, user-এ আছে কিন্তু users-এ নেই, তাদের প্রোফাইল বানায়
export async function syncMissingProfiles() {
  await ensureProfileIndexes();
  const authUsers = await db.collection("user").find({ role: { $not: STAFF_ROLE } }).toArray();
  if (!authUsers.length) return 0;

  const have = new Set(
    (
      await db
        .collection("users")
        .find({ authUserId: { $in: authUsers.map((u) => String(u._id)) } }, { projection: { authUserId: 1 } })
        .toArray()
    ).map((p) => p.authUserId)
  );
  const docs = authUsers.filter((u) => !have.has(String(u._id))).map(buildProfile);
  if (!docs.length) return 0;

  try {
    await db.collection("users").insertMany(docs, { ordered: false });
  } catch (err) {
    if (err?.code !== 11000 && !err?.writeErrors) throw err;
  }
  return docs.length;
}

export async function getCurrentUser(req) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return null;
  const legacy = await ensureProfile(String(session.user.id));
  return { authUser: session.user, legacy };
}

// অ্যাডমিন কিনা সার্ভারে ডাটাবেসের role দেখে যাচাই করে
export async function requireAdmin(req, { allowSub = false } = {}) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user || !ObjectId.isValid(session.user.id)) return null;
  const doc = await db
    .collection("user")
    .findOne({ _id: new ObjectId(session.user.id) }, { projection: { role: 1 } });
  const role = String(doc?.role || "").toLowerCase();
  if (role === "admin" || role === "super admin") return session.user;
  if (allowSub && (role === "sub-admin" || role === "subadmin")) return session.user;
  return null;
}