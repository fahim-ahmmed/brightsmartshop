import { NextResponse, after } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/mongo-client";
import { getCurrentUser, syncMissingProfiles, TOP_10_FOUNDERS } from "@/lib/current-user";
import { LEVEL_CONFIG, designationFor } from "@/lib/level-config";

export const dynamic = "force-dynamic";

const COLORS = ["#3B82F6", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#64748B", "#F97316", "#84CC16"];

function getStepByStepProgress(packagesAfter) {
  let remaining = Number(packagesAfter || 0);
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

async function normalizeAndRecalculateChain() {
  const now = Date.now();
  if (globalThis.__LAST_CHAIN_SYNC__ && now - globalThis.__LAST_CHAIN_SYNC__ < 5000) {
    return;
  }
  globalThis.__LAST_CHAIN_SYNC__ = now;

  const chainCol = db.collection("global_chain");
  const usersCol = db.collection("users");

  const founderPhones = TOP_10_FOUNDERS.map((f) => f.phone);
  const founderNames = TOP_10_FOUNDERS.map((f) => f.name);

  const founderProfiles = await usersCol
    .find({ $or: [{ phone: { $in: founderPhones } }, { name: { $in: founderNames } }] })
    .toArray();

  for (const f of TOP_10_FOUNDERS) {
    const founderProfile = founderProfiles.find(
      (p) => p.phone === f.phone || p.name === f.name
    );
    if (!founderProfile) continue;

    const pid = String(founderProfile._id);
    const founderNodes = await chainCol
      .find({
        $or: [
          { sequenceNo: f.seq },
          { userId: pid },
          { userName: f.name },
        ],
      })
      .sort({ sequenceNo: 1 })
      .toArray();

    const purchasedNodes = founderNodes.filter((n) => !n.isSystemFounder);
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
            {
              $set: {
                userId: pid,
                userName: f.name,
                phone: f.phone,
                chainAccountId: mCode,
                isManId: true,
              },
            }
          );
        } else {
          const pCode = String(n.chainAccountId || `P-${n.sequenceNo}`).replace(/^M-/, "P-");
          await chainCol.updateOne(
            { _id: n._id },
            {
              $set: {
                userId: pid,
                phone: f.phone,
                chainAccountId: pCode,
                isManId: false,
              },
            }
          );
        }
      }
    }
  }

  const allNodes = await chainCol.find({}).sort({ sequenceNo: 1, createdAt: 1 }).toArray();
  const seenManIdForUser = new Set();
  const bulkOps = [];
  const userBulkOps = [];

  const usersWithPurchasedNodes = new Set();
  for (const n of allNodes) {
    if (!n.isSystemFounder) {
      const uid = String(n.userId || n.phone || "");
      if (uid) usersWithPurchasedNodes.add(uid);
    }
  }

  const suffix = new Array(allNodes.length + 1).fill(0);
  for (let k = allNodes.length - 1; k >= 0; k--) {
    suffix[k] = suffix[k + 1] + (allNodes[k].isSystemFounder ? 0 : Number(allNodes[k].packages ?? 1));
  }

  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    const uid = String(node.userId || node.phone || "");

    let shouldBeManId = false;
    if (uid && !seenManIdForUser.has(uid)) {
      if (!node.isSystemFounder || !usersWithPurchasedNodes.has(uid)) {
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

    if (shouldBeManId && !node.isSystemFounder && ObjectId.isValid(node.userId)) {
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
    db.collection("orders").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("orders").createIndex({ profileId: 1 }),
    db.collection("users").createIndex({ phone: 1 }),
    db.collection("users").createIndex({ referralCode: 1 }),
  ]).catch(() => null);
}

async function runMaintenance() {
  const now = Date.now();
  if (globalThis.__BSS_MAINT_RUNNING__) return;
  if (globalThis.__BSS_MAINT_LAST__ && now - globalThis.__BSS_MAINT_LAST__ < 30000) return;
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
    // প্রথমবার বা নতুন ইউজারের ক্ষেত্রে সাথে সাথে সিঙ্ক নিশ্চিত করা
    await syncMissingProfiles().catch(() => null);
    try {
      after(runMaintenance);
    } catch {
      runMaintenance().catch(() => null);
    }

    const { searchParams } = new URL(req.url);
    const paramUserId = searchParams.get("userId") || "";
    const paramPhone = searchParams.get("phone") || "";
    const paramEmail = searchParams.get("email") || "";

    const current = await getCurrentUser(req).catch(() => null);
    let authUser = current?.authUser || null;
    let legacy = current?.legacy || null;

    const usersCol = db.collection("users");
    const authCol = db.collection("user");

    const orQuery = [];
    if (paramUserId) {
      const cleanParam = paramUserId.replace(/^BSS-/i, "");
      const bssParam = paramUserId.toUpperCase().startsWith("BSS-")
        ? paramUserId.toUpperCase()
        : `BSS-${cleanParam}`;
      if (ObjectId.isValid(paramUserId)) {
        orQuery.push({ _id: new ObjectId(paramUserId) });
      }
      orQuery.push(
        { _id: paramUserId },
        { authUserId: paramUserId },
        { referralCode: paramUserId },
        { referralCode: bssParam },
        { referralCode: cleanParam },
        { customerId: bssParam }
      );
    }
    if (authUser?.id) {
      const aid = String(authUser.id);
      if (ObjectId.isValid(aid)) orQuery.push({ _id: new ObjectId(aid) });
      orQuery.push({ authUserId: aid });
    }
    const searchPhone = paramPhone || legacy?.phone || authUser?.mobile || "";
    if (searchPhone) {
      orQuery.push({ phone: searchPhone }, { mobile: searchPhone });
    }
    if (paramEmail) {
      orQuery.push({ email: paramEmail });
    }

    let matchingProfiles = [];
    if (orQuery.length > 0) {
      matchingProfiles = await usersCol.find({ $or: orQuery }).toArray();
    }
    if (!legacy && matchingProfiles.length > 0) {
      legacy = matchingProfiles[0];
    }

    if (!authUser && legacy?.authUserId && ObjectId.isValid(legacy.authUserId)) {
      authUser = await authCol.findOne({ _id: new ObjectId(legacy.authUserId) });
    }

    if (!authUser && !legacy) {
      return NextResponse.json({ message: "Please log in" }, { status: 401 });
    }

    const profileId = legacy ? String(legacy._id) : null;
    const authId = authUser ? String(authUser.id || authUser._id) : null;
    const userPhone = legacy?.phone || legacy?.mobile || authUser?.mobile || paramPhone || "";
    const allProfileIds = matchingProfiles.map((p) => String(p._id));
    const ownerIds = [...new Set([profileId, authId, paramUserId, ...allProfileIds].filter(Boolean))];

    // 🟢 ইউজারের পার্মানেন্ট BSS- আইডি নিশ্চিত করা
    const rawCode = String(legacy?.referralCode || legacy?.customerId || "BSS-20260011");
    const finalPermanentId = rawCode.toUpperCase().startsWith("BSS-")
      ? rawCode.toUpperCase()
      : `BSS-${rawCode}`;
    const shortCodeWithoutPrefix = finalPermanentId.replace(/^BSS-/i, "");

    const nodeQuery = { $or: [{ userId: { $in: ownerIds } }, { authUserId: { $in: ownerIds } }] };
    if (userPhone) nodeQuery.$or.push({ phone: userPhone });
    if (legacy?.name) nodeQuery.$or.push({ userName: legacy.name });

    const orderQuery = { $or: [{ userId: { $in: ownerIds } }, { profileId: { $in: ownerIds } }] };
    if (userPhone) orderQuery.$or.push({ phone: userPhone });

    // 🟢 স্পন্সর লিস্টের জন্য নতুন BSS- আইডি, পুরাতন কোড, ফোন বা মঙ্গো আইডি সবকিছু দিয়েই ম্যাচ করা যাতে আগের কোনো টেস্ট স্পন্সর মিস না হয়
    const sponsorMatchTargets = [
      finalPermanentId,
      shortCodeWithoutPrefix,
      ...ownerIds,
      ...(userPhone ? [userPhone] : []),
    ].filter(Boolean);

    const [nodes, userOrders, sponsorListRaw, grouped] = await Promise.all([
      db.collection("global_chain").find(nodeQuery).sort({ sequenceNo: 1 }).toArray(),
      db.collection("orders").find(orderQuery).sort({ createdAt: -1 }).toArray(),
      usersCol
        .find({
          _id: { $ne: legacy?._id },
          $or: [
            { sponsorCode: { $in: sponsorMatchTargets } },
            { sponsorId: { $in: sponsorMatchTargets } },
            { referredBy: { $in: sponsorMatchTargets } },
          ],
        })
        .sort({ createdAt: -1 })
        .toArray(),
      getCategoryGroups(),
    ]);

    const ownedNodes = nodes.filter((n) => !n.isSystemFounder);
    const ownPackages = ownedNodes.length;
    const primaryOwnedNode = ownedNodes[0] || null;

    let packagesInNetwork = 0;
    if (primaryOwnedNode) {
      packagesInNetwork = await db.collection("global_chain").countDocuments({
        sequenceNo: { $gt: primaryOwnedNode.sequenceNo },
        isSystemFounder: { $ne: true },
      });
    }

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
        legacy.referralCode !== finalPermanentId)
    ) {
      await usersCol
        .updateOne(
          { _id: legacy._id },
          {
            $set: {
              id: finalPermanentId,
              customerId: finalPermanentId,
              referralCode: finalPermanentId,
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

    // 🟢 আমাকে কে রেফার করেছে (Sponsor Code ও Sponsor Name) খুঁজে বের করা
    const myRawSponsor = String(
      legacy?.sponsorCode || legacy?.sponsorId || legacy?.referredBy || authUser?.sponsorCode || ""
    ).trim();
    let mySponsorCode = "";
    let mySponsorName = "";

    if (myRawSponsor && myRawSponsor !== "SYSTEM-TOP") {
      const cleanSp = myRawSponsor.replace(/^BSS-/i, "");
      const bssSp = myRawSponsor.toUpperCase().startsWith("BSS-")
        ? myRawSponsor.toUpperCase()
        : `BSS-${cleanSp}`;
      const spOr = [
        { referralCode: myRawSponsor },
        { referralCode: bssSp },
        { referralCode: cleanSp },
        { customerId: bssSp },
        { phone: myRawSponsor },
        { authUserId: myRawSponsor },
      ];
      if (ObjectId.isValid(myRawSponsor)) spOr.unshift({ _id: new ObjectId(myRawSponsor) });
      const spDoc = await usersCol.findOne({ $or: spOr });
      if (spDoc) {
        const spCode = String(spDoc.referralCode || spDoc.customerId || bssSp);
        mySponsorCode = spCode.toUpperCase().startsWith("BSS-") ? spCode.toUpperCase() : `BSS-${spCode}`;
        mySponsorName = spDoc.name || "";
      } else {
        mySponsorCode = bssSp;
      }
    }

    const reservePoints = matchingProfiles.reduce(
      (max, p) => Math.max(max, Number(p.reservePoints || 0)),
      Number(legacy?.reservePoints || 0)
    );

    const validOrders = userOrders.filter(
      (o) => !["Cancelled", "cancelled", "CANCELLED"].includes(o.status)
    );

    const sponsorList = sponsorListRaw.map((m) => {
      const mCode = String(m.referralCode || m.customerId || m._id);
      const formattedMCode = mCode.toUpperCase().startsWith("BSS-")
        ? mCode.toUpperCase()
        : `BSS-${mCode}`;
      return {
        id: formattedMCode,
        referralCode: formattedMCode,
        name: m.name || "Member",
        phone: m.phone || m.mobile || "",
        joinDate: m.createdAt,
        hasPurchased: (m.totalPackages || 0) > 0,
        packages: m.totalPackages || 0,
      };
    });

    const categoryStats = grouped
      .filter((g) => g._id)
      .map((g, i) => ({ name: String(g._id), count: g.count, color: COLORS[i % COLORS.length] }));

    const rawEmail = legacy?.email || authUser?.email || "";
    const email = rawEmail.endsWith(".local") ? "" : rawEmail;

    return NextResponse.json({
      user: {
        name: legacy?.name || authUser?.name || "Customer",
        id: finalPermanentId,
        customerId: finalPermanentId,
        _id: profileId || authId,
        referralCode: finalPermanentId,
        sponsorCode: mySponsorCode,
        sponsorId: mySponsorCode,
        referredBy: mySponsorCode,
        sponsorName: mySponsorName,
        email,
        mobile: userPhone,
        phone: userPhone,
        address: legacy?.address || authUser?.address || "",
        profileImage: legacy?.profileImage || authUser?.image || "",
        role: legacy?.role || authUser?.role || "Client",
      },
      stats: {
        currentLevel: level,
        designation: designationFor(level),
        accumulatedPackages: packagesInNetwork,
        currentStepPackages: currentStepPackages,
        newPurchasersAfterMe: packagesInNetwork * 40,
        nextLevelTarget: nextLevelTarget,
        walletBalance: walletBalance,
        totalOrders: validOrders.length,
        reservePoints: reservePoints,
        pointsNeededForNextPackage: 40 - (reservePoints % 40),
        totalPackages: ownPackages,
        totalSponsors: sponsorList.length,
        sponsorsList: sponsorList,
      },
      myChainNodes: await Promise.all(
        ownedNodes.map(async (n, idx) => {
          const isFirstNode = idx === 0;
          let nodePackagesAfter = 0;
          if (isFirstNode) {
            nodePackagesAfter = packagesInNetwork;
          } else {
            nodePackagesAfter = await db.collection("global_chain").countDocuments({
              sequenceNo: { $gt: n.sequenceNo },
              isSystemFounder: { $ne: true },
            });
          }
          const nodeStep = getStepByStepProgress(nodePackagesAfter);
          return {
            _id: String(n._id),
            sequenceNo: n.sequenceNo,
            chainAccountId: n.chainAccountId || (isFirstNode ? `M-${finalPermanentId}` : `P-${n.sequenceNo}`),
            isManId: isFirstNode,
            accumulatedPackages: nodePackagesAfter,
            currentStepPackages: nodeStep.currentStepPackages,
            currentLevel: nodeStep.level,
            designation: designationFor(nodeStep.level),
            createdAt: n.createdAt,
          };
        })
      ),
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