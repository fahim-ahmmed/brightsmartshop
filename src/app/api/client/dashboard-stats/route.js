import { NextResponse, after } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/mongo-client";
import { getCurrentUser, syncMissingProfiles, TOP_10_FOUNDERS } from "@/lib/current-user";
import { LEVEL_CONFIG, designationFor } from "@/lib/level-config";
import { getStepByStepProgress, isRealNode, REAL_NODE_FILTER, countAfter } from "@/lib/level-progress";

export const dynamic = "force-dynamic";

const COLORS = ["#3B82F6", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#64748B", "#F97316", "#84CC16"];

// 🟢 গ্লোবাল চেইন নতুন করে হিসাব করে (৫ সেকেন্ড গার্ডসহ)
async function normalizeAndRecalculateChain() {
  const now = Date.now();
  if (globalThis.__LAST_CHAIN_SYNC__ && now - globalThis.__LAST_CHAIN_SYNC__ < 5000) {
    return;
  }
  globalThis.__LAST_CHAIN_SYNC__ = now;

  const chainCol = db.collection("global_chain");
  const usersCol = db.collection("users");

  // ১. টপ ১০ ফাউন্ডারের প্রোফাইল ও নোড ঠিক করা
  const founderPhones = TOP_10_FOUNDERS.map((f) => f.phone);
  const founderNames = TOP_10_FOUNDERS.map((f) => f.name);

  const founderProfiles = await usersCol
    .find({ $or: [{ phone: { $in: founderPhones } }, { name: { $in: founderNames } }] })
    .toArray();

  for (const f of TOP_10_FOUNDERS) {
    const founderProfile = founderProfiles.find((p) => p.phone === f.phone || p.name === f.name);
    if (!founderProfile) continue;

    const pid = String(founderProfile._id);
    const founderNodes = await chainCol
      .find({ $or: [{ sequenceNo: f.seq }, { userId: pid }, { userName: f.name }] })
      .sort({ sequenceNo: 1 })
      .toArray();

    const purchasedNodes = founderNodes.filter(isRealNode);
    const primaryNode =
      purchasedNodes.length > 0
        ? purchasedNodes[0]
        : founderNodes.find((n) => n.sequenceNo === f.seq) || founderNodes[0];

    if (founderNodes.length > 1 && primaryNode) {
      for (const n of founderNodes) {
        if (String(n._id) === String(primaryNode._id)) {
          const mCode = n.isSystemFounder
            ? `M-${f.referralCode}`
            : String(n.chainAccountId || `M-${f.referralCode}`).replace(/^P-/, "M-");
          await chainCol.updateOne(
            { _id: primaryNode._id },
            { $set: { userId: pid, userName: f.name, phone: f.phone, chainAccountId: mCode, isManId: true } }
          );
        } else {
          const pCode = String(n.chainAccountId || `P-${n.sequenceNo}`).replace(/^M-/, "P-");
          await chainCol.updateOne(
            { _id: n._id },
            { $set: { userId: pid, phone: f.phone, chainAccountId: pCode, isManId: false } }
          );
        }
      }
    }
  }

  // ২. সব নোড ক্রমানুসারে এনে প্রতিটির নিচে কয়টি আসল প্যাকেজ আছে হিসাব করা
  const allNodes = await chainCol.find({}).sort({ sequenceNo: 1, createdAt: 1 }).toArray();
  const seenManIdForUser = new Set();
  const bulkOps = [];
  const userBulkOps = [];

  const usersWithPurchasedNodes = new Set();
  for (const n of allNodes) {
    if (isRealNode(n)) {
      const uid = String(n.userId || n.phone || "");
      if (uid) usersWithPurchasedNodes.add(uid);
    }
  }

  // 🟢 অনাথ নোড ও ফাউন্ডার প্লেসহোল্ডার ০ ধরা হয়
  const suffix = new Array(allNodes.length + 1).fill(0);
  for (let k = allNodes.length - 1; k >= 0; k--) {
    suffix[k] = suffix[k + 1] + (isRealNode(allNodes[k]) ? Number(allNodes[k].packages ?? 1) : 0);
  }

  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    const uid = String(node.userId || node.phone || "");
    const real = isRealNode(node);

    // ইউজারের প্রথম আসল নোডই মেইন আইডি (M); অনাথ নোড কখনো মেইন আইডি হতে পারবে না
    let shouldBeManId = false;
    if (uid && !seenManIdForUser.has(uid)) {
      if (node.isSystemFounder) {
        if (!usersWithPurchasedNodes.has(uid)) {
          seenManIdForUser.add(uid);
          shouldBeManId = true;
        }
      } else if (real) {
        seenManIdForUser.add(uid);
        shouldBeManId = true;
      }
    }

    const packagesAfter = suffix[i + 1];
    const stepProg = getStepByStepProgress(packagesAfter);
    const calcLevel = stepProg.level;

    let fixedAccountId = node.chainAccountId || "";
    if (shouldBeManId && fixedAccountId.startsWith("P-")) {
      fixedAccountId = fixedAccountId.replace(/^P-/, "M-");
    } else if (!shouldBeManId && fixedAccountId.startsWith("M-")) {
      fixedAccountId = fixedAccountId.replace(/^M-/, "P-");
    }

    if (
      node.isManId !== shouldBeManId ||
      node.accumulatedPackages !== packagesAfter ||
      node.currentLevel !== calcLevel ||
      node.chainAccountId !== fixedAccountId
    ) {
      bulkOps.push({
        updateOne: {
          filter: { _id: node._id },
          update: {
            $set: {
              isManId: shouldBeManId,
              chainAccountId: fixedAccountId,
              accumulatedPackages: packagesAfter,
              currentLevel: calcLevel,
            },
          },
        },
      });
      node.isManId = shouldBeManId;
      node.chainAccountId = fixedAccountId;
      node.accumulatedPackages = packagesAfter;
      node.currentLevel = calcLevel;
    }

    if (shouldBeManId && real && ObjectId.isValid(node.userId)) {
      userBulkOps.push({
        updateOne: {
          filter: { _id: new ObjectId(node.userId) },
          update: {
            $set: {
              level: calcLevel,
              currentLevel: calcLevel,
              designation: designationFor(calcLevel),
              accumulatedPackages: packagesAfter,
              walletBalance: stepProg.earnedTaka,
            },
          },
        },
      });
    }
  }

  if (bulkOps.length > 0) {
    await chainCol.bulkWrite(bulkOps, { ordered: false }).catch(() => null);
  }
  if (userBulkOps.length > 0) {
    await usersCol.bulkWrite(userBulkOps, { ordered: false }).catch(() => null);
  }
}

async function ensureDashboardIndexes() {
  if (globalThis.__BSS_DASH_IDX__) return;
  globalThis.__BSS_DASH_IDX__ = true;
  await Promise.all([
    db.collection("global_chain").createIndex({ sequenceNo: 1 }),
    db.collection("global_chain").createIndex({ userId: 1 }),
    db.collection("global_chain").createIndex({ authUserId: 1 }),
    db.collection("global_chain").createIndex({ orderNo: 1 }),
    db.collection("orders").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("orders").createIndex({ profileId: 1 }),
    db.collection("users").createIndex({ phone: 1 }),
    db.collection("users").createIndex({ referralCode: 1 }),
  ]).catch(() => null);
}

// ভারী কাজ: উত্তর পাঠানোর পরে, সর্বোচ্চ ৬০ সেকেন্ডে একবার
async function runMaintenance() {
  const now = Date.now();
  if (globalThis.__BSS_MAINT_RUNNING__) return;
  if (globalThis.__BSS_MAINT_LAST__ && now - globalThis.__BSS_MAINT_LAST__ < 60000) return;
  globalThis.__BSS_MAINT_RUNNING__ = true;
  globalThis.__BSS_MAINT_LAST__ = now;
  try {
    await ensureDashboardIndexes();
    await syncMissingProfiles().catch(() => null);
    await normalizeAndRecalculateChain().catch(() => null);
  } finally {
    globalThis.__BSS_MAINT_RUNNING__ = false;
  }
}

async function getCategoryGroups() {
  const cached = globalThis.__BSS_CAT_CACHE__;
  if (cached && Date.now() - cached.t < 60000) return cached.v;
  const v = await db
    .collection("products")
    .aggregate([
      { $group: { _id: { $ifNull: ["$categoryName", "$category"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();
  globalThis.__BSS_CAT_CACHE__ = { t: Date.now(), v };
  return v;
}

export async function GET(req) {
  try {
    try {
      after(runMaintenance);
    } catch {
      runMaintenance().catch(() => null);
    }

    // 🟢 শুধু লগইন সেশনের ইউজারের তথ্য। URL-এর userId/phone/email আর মানা হয় না,
    // নইলে অন্য ইউজারের পুরোনো তথ্য মিশে যায় এবং যে কেউ অন্যের ডাটা দেখতে পারত।
    const current = await getCurrentUser(req).catch(() => null);
    if (!current?.authUser) {
      return NextResponse.json({ message: "Please log in" }, { status: 401 });
    }
    const authUser = current.authUser;
    const legacy = current.legacy || null;

    const usersCol = db.collection("users");

    const aid = String(authUser.id || authUser._id);
    const orQuery = [{ authUserId: aid }];
    if (ObjectId.isValid(aid)) orQuery.push({ _id: new ObjectId(aid) });
    if (legacy?._id) orQuery.push({ _id: legacy._id });
    const searchPhone = legacy?.phone || legacy?.mobile || authUser?.mobile || "";
    if (searchPhone) {
      orQuery.push({ phone: searchPhone }, { mobile: searchPhone });
    }

    const matchingProfiles = await usersCol.find({ $or: orQuery }).toArray();

    const profileId = legacy ? String(legacy._id) : null;
    const authId = authUser ? String(authUser.id || authUser._id) : null;
    const userPhone = legacy?.phone || legacy?.mobile || authUser?.mobile || "";
    const allProfileIds = matchingProfiles.map((p) => String(p._id));
    const ownerIds = [...new Set([profileId, authId, ...allProfileIds].filter(Boolean))];

    const nodeQuery = { $or: [{ userId: { $in: ownerIds } }, { authUserId: { $in: ownerIds } }] };
    if (userPhone) nodeQuery.$or.push({ phone: userPhone });

    const orderQuery = { $or: [{ userId: { $in: ownerIds } }, { profileId: { $in: ownerIds } }] };
    if (userPhone) orderQuery.$or.push({ phone: userPhone });

    const permanentId = legacy?.referralCode || profileId || authId || "20260048";

    const [nodes, userOrders, sponsorListRaw, grouped, realSeqDocs] = await Promise.all([
      db.collection("global_chain").find(nodeQuery).sort({ sequenceNo: 1 }).toArray(),
      db.collection("orders").find(orderQuery).sort({ createdAt: -1 }).toArray(),
      usersCol
        .find({
          $or: [
            { sponsorCode: permanentId },
            { referredBy: permanentId },
            ...(profileId ? [{ sponsorCode: profileId }, { referredBy: profileId }] : []),
            ...(userPhone ? [{ sponsorCode: userPhone }, { referredBy: userPhone }] : []),
          ],
        })
        .sort({ createdAt: -1 })
        .toArray(),
      getCategoryGroups(),
      // 🟢 চেইনের সব আসল নোডের sequenceNo (এক কুয়েরিতে), প্রতিটি নোডের নিচের সংখ্যা মেমোরিতে হিসাব হবে
      db
        .collection("global_chain")
        .find(REAL_NODE_FILTER, { projection: { sequenceNo: 1, _id: 0 } })
        .sort({ sequenceNo: 1 })
        .toArray(),
    ]);

    const realSeqs = realSeqDocs.map((d) => Number(d.sequenceNo));

    // 🟢 নিজের আসল নোড (ফাউন্ডার প্লেসহোল্ডার ও অনাথ নোড বাদ)
    const ownedNodes = nodes.filter(isRealNode);
    const ownPackages = ownedNodes.length;

    // 🟢 মেইন আইডি = প্রথম আসল নোড
    const manNode = ownedNodes.find((n) => n.isManId) || ownedNodes[0] || null;

    // 🟢 মেইন আইডির পরে চেইনে মোট কয়টি আসল প্যাকেজ এসেছে
    const packagesInNetwork = manNode ? countAfter(realSeqs, manNode.sequenceNo) : 0;

    const stepProgress = getStepByStepProgress(packagesInNetwork);
    const level = stepProgress.level;
    const currentStepPackages = stepProgress.currentStepPackages;
    const nextLevelTarget = stepProgress.nextLevelTarget;
    const walletBalance = stepProgress.earnedTaka;

    if (
      legacy &&
      (walletBalance !== Number(legacy.walletBalance || 0) ||
        level !== Number(legacy.level || 0) ||
        packagesInNetwork !== Number(legacy.accumulatedPackages || 0) ||
        ownPackages !== Number(legacy.totalPackages || 0))
    ) {
      await usersCol
        .updateOne(
          { _id: legacy._id },
          {
            $set: {
              level,
              currentLevel: level,
              designation: designationFor(level),
              walletBalance,
              accumulatedPackages: packagesInNetwork,
              totalPackages: ownPackages,
            },
          }
        )
        .catch(() => null);
    }

    const reservePoints = matchingProfiles.reduce(
      (max, p) => Math.max(max, Number(p.reservePoints || 0)),
      Number(legacy?.reservePoints || 0)
    );

    const validOrders = userOrders.filter(
      (o) => !["Cancelled", "cancelled", "CANCELLED"].includes(o.status)
    );

    const finalPermanentId =
      legacy?.referralCode ||
      manNode?.chainAccountId?.replace(/^M-/, "") ||
      profileId ||
      authId ||
      "20260048";

    const sponsorList = sponsorListRaw.map((m) => ({
      id: m.referralCode || String(m._id),
      name: m.name || "Member",
      phone: m.phone || m.mobile || "",
      joinDate: m.createdAt,
      hasPurchased: (m.totalPackages || 0) > 0,
      packages: m.totalPackages || 0,
    }));

    const categoryStats = grouped
      .filter((g) => g._id)
      .map((g, i) => ({ name: String(g._id), count: g.count, color: COLORS[i % COLORS.length] }));

    const rawEmail = legacy?.email || authUser?.email || "";
    const email = rawEmail.endsWith(".local") ? "" : rawEmail;

    // 🟢 প্রতিটি নোডের নিচে কয়টি আসল প্যাকেজ আছে সরাসরি গুনে বের করা:
    // শেষ নোডের ০, তার আগেরটার ১, এভাবে বাড়বে
    const myChainNodes = ownedNodes.map((n) => {
      const isMan = manNode ? String(n._id) === String(manNode._id) : false;
      const pkgsAfter = countAfter(realSeqs, n.sequenceNo);
      const step = getStepByStepProgress(pkgsAfter);
      return {
        _id: String(n._id),
        sequenceNo: n.sequenceNo,
        chainAccountId: n.chainAccountId || (isMan ? `M-${n.sequenceNo}` : `P-${n.sequenceNo}`),
        isManId: isMan,
        accumulatedPackages: pkgsAfter,
        currentStepPackages: step.currentStepPackages,
        nextLevelTarget: step.nextLevelTarget,
        currentLevel: step.level,
        designation: designationFor(step.level),
        createdAt: n.createdAt,
      };
    });

    return NextResponse.json({
      user: {
        name: legacy?.name || authUser?.name || "Customer",
        id: finalPermanentId,
        _id: profileId || authId,
        referralCode: finalPermanentId,
        sponsorCode: legacy?.sponsorCode || legacy?.referredBy || "",
        email,
        mobile: userPhone,
        address: legacy?.address || authUser?.address || "",
        profileImage: legacy?.profileImage || authUser?.image || "",
        role: legacy?.role || authUser?.role || "Client",
      },
      stats: {
        currentLevel: level,
        designation: designationFor(level),
        accumulatedPackages: packagesInNetwork,
        currentStepPackages,
        newPurchasersAfterMe: packagesInNetwork * 40,
        nextLevelTarget,
        walletBalance,
        totalOrders: validOrders.length,
        reservePoints,
        pointsNeededForNextPackage: 40 - (reservePoints % 40),
        totalPackages: ownPackages,
        manSequenceNo: manNode ? manNode.sequenceNo : null,
        totalSponsors: sponsorList.length,
        sponsorsList: sponsorList,
      },
      myChainNodes,
      recentOrders: userOrders.slice(0, 10),
      sponsorList,
      categoryStats,
      levelTable: LEVEL_CONFIG.map((c) => ({ ...c, requiredNewPurchasers: c.requiredPackages })),
    });
  } catch (error) {
    console.error("[dashboard-stats]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}