import { NextResponse, after } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/mongo-client";
import { getCurrentUser, syncMissingProfiles, TOP_10_FOUNDERS } from "@/lib/current-user";
import { LEVEL_CONFIG, designationFor, evaluateGlobalChain } from "@/lib/level-config";

export const dynamic = "force-dynamic";

const COLORS = ["#3B82F6", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#64748B", "#F97316", "#84CC16"];

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
  const evaluated = evaluateGlobalChain(allNodes);

  const bulkOps = [];
  const userBulkOps = [];

  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    const sim = evaluated[i];

    let fixedAccountId = node.chainAccountId || "";
    if (sim.shouldBeManId && fixedAccountId.startsWith("P-")) {
      fixedAccountId = fixedAccountId.replace(/^P-/, "M-");
    } else if (!sim.shouldBeManId && fixedAccountId.startsWith("M-")) {
      fixedAccountId = fixedAccountId.replace(/^M-/, "P-");
    }

    if (
      node.isManId !== sim.shouldBeManId ||
      node.accumulatedPackages !== sim.rawPackagesAfter ||
      node.currentStepPackages !== sim.currentStepPackages ||
      node.extraStepPackages !== sim.extraStepPackages ||
      node.extraPackagesReceived !== sim.extraPackagesReceived ||
      node.currentLevel !== sim.level ||
      node.chainAccountId !== fixedAccountId
    ) {
      bulkOps.push({
        updateOne: {
          filter: { _id: node._id },
          update: {
            $set: {
              isManId: sim.shouldBeManId,
              chainAccountId: fixedAccountId,
              accumulatedPackages: sim.rawPackagesAfter,
              mainChainPackagesAfter: sim.mainChainPackagesAfter,
              currentStepPackages: sim.currentStepPackages,
              extraStepPackages: sim.extraStepPackages,
              extraPackagesReceived: sim.extraPackagesReceived,
              currentLevel: sim.level,
              mainLevel: sim.mainLevel,
              extraLevel: sim.extraLevel,
              earnedTaka: sim.earnedTaka,
            },
          },
        },
      });
    }

    if (sim.shouldBeManId && !node.isSystemFounder && ObjectId.isValid(node.userId)) {
      userBulkOps.push({
        updateOne: {
          filter: { _id: new ObjectId(node.userId) },
          update: {
            $set: {
              level: sim.level,
              currentLevel: sim.level,
              mainLevel: sim.mainLevel,
              extraLevel: sim.extraLevel,
              designation: sim.designation,
              accumulatedPackages: sim.rawPackagesAfter,
              mainChainPackagesAfter: sim.mainChainPackagesAfter,
              currentStepPackages: sim.currentStepPackages,
              extraStepPackages: sim.extraStepPackages,
              extraPackagesReceived: sim.extraPackagesReceived,
              walletBalance: sim.earnedTaka,
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

    const rawCode = String(legacy?.referralCode || legacy?.customerId || "BSS-20260011");
    const finalPermanentId = rawCode.toUpperCase().startsWith("BSS-")
      ? rawCode.toUpperCase()
      : `BSS-${rawCode}`;
    const shortCodeWithoutPrefix = finalPermanentId.replace(/^BSS-/i, "");

    const orderQuery = { $or: [{ userId: { $in: ownerIds } }, { profileId: { $in: ownerIds } }] };
    if (userPhone) orderQuery.$or.push({ phone: userPhone });

    const sponsorMatchTargets = [
      finalPermanentId,
      shortCodeWithoutPrefix,
      ...ownerIds,
      ...(userPhone ? [userPhone] : []),
    ].filter(Boolean);

    const [allChainNodes, userOrders, sponsorListRaw, grouped] = await Promise.all([
      db.collection("global_chain").find({}).sort({ sequenceNo: 1, createdAt: 1 }).toArray(),
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

    const evaluatedChain = evaluateGlobalChain(allChainNodes);
    const ownerIdSet = new Set(ownerIds.map(String));

    const myEvaluatedNodes = evaluatedChain.filter((st, idx) => {
      const rawNode = allChainNodes[idx];
      if (rawNode.isSystemFounder) return false;
      const matchId =
        ownerIdSet.has(String(rawNode.userId || "")) ||
        ownerIdSet.has(String(rawNode.authUserId || ""));
      const matchPhone = userPhone && String(rawNode.phone || "") === String(userPhone);
      const matchName = legacy?.name && rawNode.userName === legacy.name;
      return matchId || matchPhone || matchName;
    });

    const ownPackages = myEvaluatedNodes.length;
    const primarySim = myEvaluatedNodes[0] || null;

    const packagesInNetwork = primarySim ? primarySim.rawPackagesAfter : 0;
    const mainChainPackagesAfter = primarySim ? primarySim.mainChainPackagesAfter : 0;
    const extraPackagesReceived = primarySim ? primarySim.extraPackagesReceived : 0;
    const level = primarySim ? primarySim.level : 0;
    const mainLevel = primarySim ? primarySim.mainLevel : 0;
    const extraLevel = primarySim ? primarySim.extraLevel : 9;
    const currentStepPackages = primarySim ? primarySim.currentStepPackages : 0;
    const nextLevelTarget = primarySim
      ? primarySim.nextLevelTarget
      : LEVEL_CONFIG[0].requiredPackages;

    // 🟢 শুধুমাত্র লেভেল ৯ বা তার ওপরে উঠলে এক্সট্রা প্যাকেজ কার্ডের ডাটা সক্রিয় হবে
    const isExtraStage = primarySim ? Boolean(primarySim.isExtraStage) : false;
    const extraTargetLevel = primarySim ? primarySim.extraTargetLevel : 10;
    const extraStepPackages = primarySim ? primarySim.extraStepPackages : 0;
    const extraNextLevelTarget = primarySim ? primarySim.extraNextLevelTarget : 10;
    const extraPackagesNeeded = primarySim ? primarySim.extraPackagesNeeded : 10;

    const walletBalance = primarySim ? primarySim.earnedTaka : 0;

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
              mainLevel,
              extraLevel,
              designation: designationFor(level),
              walletBalance,
              accumulatedPackages: packagesInNetwork,
              mainChainPackagesAfter,
              currentStepPackages,
              extraStepPackages,
              extraPackagesReceived,
              totalPackages: ownPackages,
            },
          }
        )
        .catch(() => null);
    }

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
        mySponsorCode = spCode.toUpperCase().startsWith("BSS-")
          ? spCode.toUpperCase()
          : `BSS-${spCode}`;
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
        mainLevel: mainLevel,
        extraLevel: extraLevel,
        designation: designationFor(level),
        accumulatedPackages: packagesInNetwork,
        mainChainPackagesAfter: mainChainPackagesAfter,
        extraPackagesReceived: extraPackagesReceived,
        isExtraStage: isExtraStage,
        currentStepPackages: currentStepPackages,
        nextLevelTarget: nextLevelTarget,
        extraTargetLevel: extraTargetLevel,
        extraStepPackages: extraStepPackages,
        extraNextLevelTarget: extraNextLevelTarget,
        extraPackagesNeeded: extraPackagesNeeded,
        newPurchasersAfterMe: packagesInNetwork * 40,
        walletBalance: walletBalance,
        totalOrders: validOrders.length,
        reservePoints: reservePoints,
        pointsNeededForNextPackage: 40 - (reservePoints % 40),
        totalPackages: ownPackages,
        totalSponsors: sponsorList.length,
        sponsorsList: sponsorList,
      },
      myChainNodes: myEvaluatedNodes.map((sim, idx) => {
        const rawNode = allChainNodes[sim.index];
        const isFirstNode = idx === 0;
        return {
          _id: String(rawNode._id),
          sequenceNo: rawNode.sequenceNo,
          chainAccountId:
            rawNode.chainAccountId ||
            (isFirstNode ? `M-${finalPermanentId}` : `P-${rawNode.sequenceNo}`),
          isManId: isFirstNode,
          accumulatedPackages: sim.rawPackagesAfter,
          mainChainPackagesAfter: sim.mainChainPackagesAfter,
          currentStepPackages: sim.currentStepPackages,
          extraStepPackages: sim.extraStepPackages,
          extraPackagesReceived: sim.extraPackagesReceived,
          currentLevel: sim.level,
          mainLevel: sim.mainLevel,
          designation: sim.designation,
          createdAt: rawNode.createdAt,
        };
      }),
      recentOrders: userOrders.slice(0, 10),
      sponsorList,
      categoryStats,
      levelTable: LEVEL_CONFIG.map((c) => ({
        ...c,
        requiredNewPurchasers: c.requiredPackages,
      })),
    });
  } catch (error) {
    console.error("[dashboard-stats]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}