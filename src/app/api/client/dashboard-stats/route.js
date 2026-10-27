import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/mongo-client";
import { getCurrentUser, syncMissingProfiles, TOP_10_FOUNDERS } from "@/lib/current-user";
import { LEVEL_CONFIG, designationFor } from "@/lib/level-config";

export const dynamic = "force-dynamic";

const COLORS = ["#3B82F6", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#64748B", "#F97316", "#84CC16"];

// 🟢 গ্লোবাল চেইন থেকে ডুপ্লিকেট মেইন আইডি পরিষ্কার ও লেভেল/ব্যালেন্স পুনরায় নিখুঁতভাবে হিসাব করার ফাংশন (সুপার-ফাস্ট Bulk অপারেশন সহ)
async function normalizeAndRecalculateChain() {
  // বারবার রিলোডে যাতে স্লো না হয়, তাই ৫ সেকেন্ডের মেমোরি ক্যাশ গার্ড
  const now = Date.now();
  if (globalThis.__LAST_CHAIN_SYNC__ && now - globalThis.__LAST_CHAIN_SYNC__ < 5000) {
    return;
  }
  globalThis.__LAST_CHAIN_SYNC__ = now;

  const chainCol = db.collection("global_chain");
  const usersCol = db.collection("users");

  // ১. টপ ১০ ফাউন্ডারের প্রোফাইল ও নোড একসাথে চেক করা
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
          { userId: pid, isManId: true },
          { userName: f.name, isManId: true },
        ],
      })
      .sort({ sequenceNo: 1 })
      .toArray();

    if (founderNodes.length > 1) {
      const primaryNode = founderNodes.find((n) => n.sequenceNo === f.seq) || founderNodes[0];
      // অন্য নোডগুলো ডিলিট না করে প্রোডাক্ট আইডি (P) হিসেবে রাখা যাতে আপনার ৪টি প্যাকেজ আইডিই অক্ষত থাকে
      for (const n of founderNodes) {
        if (String(n._id) === String(primaryNode._id)) {
          await chainCol.updateOne(
            { _id: primaryNode._id },
            {
              $set: {
                sequenceNo: f.seq,
                userId: pid,
                userName: f.name,
                phone: f.phone,
                chainAccountId: `M-${f.referralCode}`,
                isManId: true,
                isSystemFounder: true,
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

  // ২. চেইনের সকল নোড ক্রমানুসারে এনে প্রতিটির নিচে কয়টি প্যাকেজ আছে এবং কোন লেভেল প্রাপ্য তা হিসাব করা
  const allNodes = await chainCol.find({}).sort({ sequenceNo: 1, createdAt: 1 }).toArray();
  const seenManIdForUser = new Set();
  const bulkOps = [];

  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    const uid = String(node.userId || node.phone || "");

    // একজন ইউজারের শুধুমাত্র প্রথম নোডটিই মেইন আইডি (M) হবে, পরের সব প্রোডাক্ট আইডি (P) হবে
    let shouldBeManId = false;
    if (uid && !seenManIdForUser.has(uid)) {
      seenManIdForUser.add(uid);
      shouldBeManId = true;
    }

    // 🟢 এই নোডের পরে আসা সকল প্যাকেজ সংখ্যা গণনা (ফাউন্ডার ও সাধারণ অর্ডার সহ সব প্যাকেজ যুক্ত হবে, তাই ১০টি প্যাকেজই থাকবে)
    let packagesAfter = 0;
    for (let j = i + 1; j < allNodes.length; j++) {
      const afterNode = allNodes[j];
      packagesAfter += Number(afterNode.packages || 1);
    }

    let calcLevel = 0;
    for (const c of LEVEL_CONFIG) {
      if (packagesAfter >= c.requiredPackages) {
        calcLevel = c.level;
      } else {
        break;
      }
    }

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
  }

  if (bulkOps.length > 0) {
    await chainCol.bulkWrite(bulkOps, { ordered: false }).catch(() => null);
  }
}

export async function GET(req) {
  try {
    await syncMissingProfiles().catch(() => null);
    await normalizeAndRecalculateChain().catch(() => null);

    const { searchParams } = new URL(req.url);
    const paramUserId = searchParams.get("userId") || "";
    const paramPhone = searchParams.get("phone") || "";
    const paramEmail = searchParams.get("email") || "";

    const current = await getCurrentUser(req).catch(() => null);
    let authUser = current?.authUser || null;
    let legacy = current?.legacy || null;

    const usersCol = db.collection("users");
    const authCol = db.collection("user");

    // ইউজারের সম্ভাব্য সকল ডুপ্লিকেট প্রোফাইল খুঁজে বের করা (যাতে ২০ টাকা ব্যালেন্স অন্য ডকুমেন্টে থাকলেও মিস না হয়)
    const orQuery = [];
    if (paramUserId) {
      if (ObjectId.isValid(paramUserId)) {
        orQuery.push({ _id: new ObjectId(paramUserId) });
      }
      orQuery.push({ _id: paramUserId }, { authUserId: paramUserId }, { referralCode: paramUserId });
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

    // ১. গ্লোবাল চেইন, অর্ডার, স্পন্সর, ওয়ালেট হিস্ট্রি এবং ক্যাটাগরি প্যারালালভাবে দ্রুত ফেচ করা
    const nodeQuery = { $or: [{ userId: { $in: ownerIds } }, { authUserId: { $in: ownerIds } }] };
    if (userPhone) nodeQuery.$or.push({ phone: userPhone });
    if (legacy?.name) nodeQuery.$or.push({ userName: legacy.name });

    const orderQuery = { $or: [{ userId: { $in: ownerIds } }, { profileId: { $in: ownerIds } }] };
    if (userPhone) orderQuery.$or.push({ phone: userPhone });

    const permanentId = legacy?.referralCode || profileId || authId || "20260048";

    const [nodes, userOrders, sponsorListRaw, grouped, walletHistory] = await Promise.all([
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
      db
        .collection("products")
        .aggregate([
          { $group: { _id: { $ifNull: ["$categoryName", "$category"] }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),
      db
        .collection("wallet_history")
        .find({ $or: [{ userId: { $in: ownerIds } }, { authUserId: { $in: ownerIds } }] })
        .toArray()
        .catch(() => []),
    ]);

    const manNode = nodes.find((n) => n.isManId) || nodes[0] || null;
    const packagesInNetwork = manNode?.accumulatedPackages ?? 0;

    // প্রতিটি নোড থেকে অর্জিত মোট লেভেল রিওয়ার্ড টাকা হিসাব করা
    let totalEarnedFromLevels = 0;
    for (const n of nodes) {
      const lvl = n.currentLevel || 0;
      for (let l = 1; l <= lvl; l++) {
        const cfg = LEVEL_CONFIG.find((c) => c.level === l);
        if (cfg) totalEarnedFromLevels += cfg.taka;
      }
    }

    const historyEarned = walletHistory.reduce((sum, h) => sum + Number(h.amount || 0), 0);
    const maxProfileWallet = matchingProfiles.reduce(
      (max, p) => Math.max(max, Number(p.walletBalance || 0)),
      Number(legacy?.walletBalance || authUser?.walletBalance || 0)
    );

    const level = manNode ? manNode.currentLevel || 0 : legacy?.level || 0;

    // ওয়ালেট ব্যালেন্স সিঙ্ক করা (প্রোফাইল, হিস্ট্রি ও লেভেল রিওয়ার্ডের মধ্যে সর্বোচ্চ সঠিক ব্যালেন্সটি নেওয়া)
    let walletBalance = Math.max(maxProfileWallet, totalEarnedFromLevels, historyEarned);
    if (legacy && (walletBalance !== Number(legacy.walletBalance || 0) || level !== Number(legacy.level || 0))) {
      await usersCol.updateOne(
        { _id: legacy._id },
        { $set: { level, walletBalance, totalPackages: nodes.length } }
      ).catch(() => null);
    }

    const ownPackages = nodes.length;
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

    const next = LEVEL_CONFIG.find((c) => c.level === level + 1);
    const rawEmail = legacy?.email || authUser?.email || "";
    const email = rawEmail.endsWith(".local") ? "" : rawEmail;

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
        newPurchasersAfterMe: packagesInNetwork * 40,
        nextLevelTarget: next ? next.requiredPackages : 0,
        walletBalance: walletBalance,
        totalOrders: validOrders.length,
        reservePoints: reservePoints,
        pointsNeededForNextPackage: 40 - (reservePoints % 40),
        totalPackages: ownPackages,
        totalSponsors: sponsorList.length,
        sponsorsList: sponsorList,
      },
      myChainNodes: nodes.map((n) => ({
        _id: String(n._id),
        sequenceNo: n.sequenceNo,
        chainAccountId: n.chainAccountId || (n.isManId ? `M-${n.sequenceNo}` : `P-${n.sequenceNo}`),
        isManId: Boolean(n.isManId),
        accumulatedPackages: n.accumulatedPackages || 0,
        currentLevel: n.currentLevel || 0,
        designation: designationFor(n.currentLevel || 0),
        createdAt: n.createdAt,
      })),
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