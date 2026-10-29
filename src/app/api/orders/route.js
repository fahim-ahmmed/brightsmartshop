import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/mongo-client";
import { ensureProfile, getCurrentUser, syncMissingProfiles, requireAdmin } from "@/lib/current-user";
import { LEVEL_CONFIG, RESERVED_TOP_POSITIONS, designationFor } from "@/lib/level-config";
import { getStepByStepProgress } from "@/lib/level-progress";

export const dynamic = "force-dynamic";

const CANCELLED = ["Cancelled", "cancelled", "CANCELLED"];

function orderQuery(targetId) {
  return {
    $or: [
      { orderId: targetId },
      { orderNo: targetId },
      ...(ObjectId.isValid(targetId) ? [{ _id: new ObjectId(targetId) }] : []),
    ],
  };
}

// 🟢 পয়েন্ট, রিজার্ভ পয়েন্ট, Man ID, Product ID এবং লেভেল ক্যালকুলেশন ইঞ্জিন
export async function processOrderToGlobalChain({ userId, userName, phone, points, orderNo }) {
  const addedPoints = Number(points || 0);
  if (addedPoints <= 0) return;

  await syncMissingProfiles();

  const chain = db.collection("global_chain");
  const users = db.collection("users");

  let profile = await ensureProfile(userId);
  if (!profile && phone) {
    profile = await users.findOne({ $or: [{ phone }, { mobile: phone }] });
  }
  if (!profile && ObjectId.isValid(userId)) {
    profile = await users.findOne({
      $or: [{ _id: new ObjectId(userId) }, { authUserId: String(userId) }],
    });
  }

  if (!profile) {
    const safePhone = phone || String(userId);
    const ins = await users.insertOne({
      authUserId: String(userId),
      name: userName || "Customer",
      phone: phone || "",
      mobile: phone || "",
      email: `${safePhone}_${Date.now()}@brightsmartshop.local`,
      role: "user",
      level: 0,
      walletBalance: 0,
      reservePoints: 0,
      totalPackages: 0,
      referralCode: `2026${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date(),
    });
    profile = await users.findOne({ _id: ins.insertedId });
  }

  const nodeUserId = String(profile._id);

  // 🟢 একই অর্ডার আগেই চেইনে ঢুকে থাকলে আর কিছু করা হবে না (ডুপ্লিকেট নোড ঠেকাতে)
  if (orderNo) {
    const already = await chain.countDocuments({ orderNo });
    if (already > 0) return;
  }

  const previousReserve = Number(profile.reservePoints || 0);
  const totalAvailablePoints = previousReserve + addedPoints;

  // ৪০ পয়েন্ট = ১টি প্যাকেজ, বাকি পয়েন্ট রিজার্ভে জমা থাকবে
  const packagesGenerated = Math.floor(totalAvailablePoints / 40);
  const newReservePoints = totalAvailablePoints % 40;

  await users.updateOne(
    { _id: profile._id },
    {
      $set: { reservePoints: newReservePoints, updatedAt: new Date() },
      $inc: { totalPointsEarned: addedPoints },
    }
  );

  if (packagesGenerated <= 0) return;

  for (let i = 0; i < packagesGenerated; i++) {
    const existingPurchasedNodesCount = await chain.countDocuments({
      $or: [{ userId: nodeUserId }, { authUserId: String(profile.authUserId || userId) }],
      isSystemFounder: { $ne: true },
      $and: [{ $or: [{ orderNo: { $exists: true, $nin: [null, ""] } }, { chainAccountId: { $exists: true, $nin: [null, ""] } }] }],
    });
    const isManId = existingPurchasedNodesCount === 0;

    if (isManId) {
      await chain.updateMany(
        {
          $or: [{ userId: nodeUserId }, { authUserId: String(profile.authUserId || userId) }],
          isSystemFounder: true,
        },
        { $set: { isManId: false } }
      );
    }

    const lastNode = await chain.findOne({}, { sort: { sequenceNo: -1 } });
    const nextSequenceNo = Math.max((lastNode?.sequenceNo || 0) + 1, RESERVED_TOP_POSITIONS + 1);

    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const chainAccountId = isManId
      ? orderNo?.startsWith("M-")
        ? orderNo
        : `M-${randomDigits}`
      : orderNo?.startsWith("P-") && i === 0
      ? orderNo
      : `P-${randomDigits}`;

    await chain.insertOne({
      sequenceNo: nextSequenceNo,
      chainAccountId,
      orderNo,
      orderSeq: i,
      userId: nodeUserId,
      authUserId: String(profile.authUserId || userId),
      userName: profile.name || userName || "Customer",
      phone: profile.phone || phone || "",
      isManId,
      points: 40,
      packages: 1,
      accumulatedPackages: 0,
      currentLevel: 0,
      earnedTaka: 0,
      createdAt: new Date(),
    });

    await users.updateOne({ _id: profile._id }, { $inc: { totalPackages: 1 } });

    // 🟢 উপরের সকল নোডকে হিট করা
    const upperNodes = await chain.find({ sequenceNo: { $lt: nextSequenceNo } }).toArray();

    for (const up of upperNodes) {
      const newAccumulated = (up.accumulatedPackages || 0) + 1;
      const previousLevel = up.currentLevel || 0;

      const newLevel = Math.max(previousLevel, getStepByStepProgress(newAccumulated).level);

      let rewardTaka = 0;
      if (newLevel > previousLevel) {
        for (let l = previousLevel + 1; l <= newLevel; l++) {
          const cfg = LEVEL_CONFIG.find((item) => item.level === l);
          if (cfg) rewardTaka += cfg.taka;
        }
      }

      // প্রোডাক্ট আইডির টাকা শুধু ওই আইডিতেই জমা থাকবে, ইউজারের ওয়ালেটে যাবে না
      await chain.updateOne(
        { _id: up._id },
        {
          $set: {
            accumulatedPackages: newAccumulated,
            currentLevel: newLevel,
            updatedAt: new Date(),
          },
          ...(!up.isManId && rewardTaka > 0 ? { $inc: { earnedTaka: rewardTaka } } : {}),
        }
      );

      if (!up.isManId) continue;

      const ownerFilter = {
        $or: [
          ...(ObjectId.isValid(up.userId) ? [{ _id: new ObjectId(up.userId) }] : []),
          { _id: up.userId },
          { authUserId: String(up.userId) },
          ...(up.phone ? [{ phone: up.phone }] : []),
        ],
      };

      const ownerDoc = await users.findOne(ownerFilter);
      if (ownerDoc) {
        const highestLevel = newLevel;
        const userUpdate = {
          $set: {
            level: highestLevel,
            currentLevel: highestLevel,
            designation: designationFor(highestLevel),
            accumulatedPackages: newAccumulated,
            updatedAt: new Date(),
          },
        };

        if (rewardTaka > 0) {
          userUpdate.$inc = { walletBalance: rewardTaka };
        }

        await users.updateOne({ _id: ownerDoc._id }, userUpdate);

        if (ownerDoc.authUserId && ObjectId.isValid(ownerDoc.authUserId)) {
          await db
            .collection("user")
            .updateOne(
              { _id: new ObjectId(ownerDoc.authUserId) },
              {
                $set: { level: highestLevel },
                ...(rewardTaka > 0 ? { $inc: { walletBalance: rewardTaka } } : {}),
              }
            )
            .catch(() => null);
        }

        if (rewardTaka > 0) {
          await db.collection("wallet_history").insertOne({
            userId: String(ownerDoc._id),
            authUserId: String(ownerDoc.authUserId || ""),
            chainAccountId: up.chainAccountId || "Man ID",
            isManId: true,
            amount: rewardTaka,
            fromLevel: previousLevel,
            toLevel: newLevel,
            triggeredByOrderNo: orderNo,
            type: "level_reward",
            createdAt: new Date(),
          });
        }
      }
    }
  }
}

// 'Paid' করা কিন্তু চেইনে না ঢোকা অর্ডারগুলো সিঙ্ক করা
export async function syncPendingChainOrders() {
  const orders = db.collection("orders");
  const unSyncedOrders = await orders
    .find({
      status: { $in: ["Paid", "paid"] },
      pointsProcessedV2: { $ne: true },
    })
    .sort({ createdAt: 1 })
    .toArray();

  for (const ord of unSyncedOrders) {
    const orderNo = ord.orderNo || ord.orderId;
    const alreadyInChain = orderNo
      ? await db.collection("global_chain").findOne({
          $or: [{ orderNo }, { chainAccountId: orderNo }],
        })
      : null;

    const claimed = await orders.findOneAndUpdate(
      { _id: ord._id, pointsProcessedV2: { $ne: true } },
      { $set: { pointsProcessedV2: true, isPointsProcessed: true } }
    );

    if (claimed && !alreadyInChain) {
      let points = Number(ord.totalPoints ?? ord.points ?? 0);
      if (points === 0 && Array.isArray(ord.items)) {
        points = ord.items.reduce(
          (sum, item) =>
            sum + Number(item.points || item.point || item.rewardPoints || 0) * Number(item.quantity || item.qty || 1),
          0
        );
      }
      if (points > 0) {
        await processOrderToGlobalChain({
          userId: ord.profileId || ord.userId,
          userName: ord.customerName || ord.name || "Customer",
          phone: ord.phone || ord.mobile || "",
          points,
          orderNo,
        });
      }
    }
  }
}

// ১. অর্ডার তৈরি (POST)
export async function POST(req) {
  try {
    const body = await req.json();
    const current = await getCurrentUser(req).catch(() => null);

    const userId = String(current?.authUser?.id || body.userId || "").trim();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please log in to place an order" },
        { status: 401 }
      );
    }

    const profile = await ensureProfile(userId).catch(() => null);
    const ownerIds = [userId, profile && String(profile._id)].filter(Boolean);

    const orders = db.collection("orders");
    const hasManNode =
      (await db.collection("global_chain").countDocuments({
        $or: [{ userId: { $in: ownerIds } }, { authUserId: { $in: ownerIds } }],
        isManId: true,
        isSystemFounder: { $ne: true },
      })) > 0;

    const priorManOrders = await orders.countDocuments({
      $or: [{ userId: { $in: ownerIds } }, { profileId: { $in: ownerIds } }],
      isManId: true,
      status: { $nin: CANCELLED },
    });

    const isFirstManEligible = !hasManNode && priorManOrders === 0;

    let points = Number(body.totalPoints ?? body.points ?? body.point ?? 0);
    if (points === 0 && Array.isArray(body.items)) {
      points = body.items.reduce(
        (sum, item) =>
          sum + Number(item.points || item.point || item.rewardPoints || 0) * Number(item.quantity || item.qty || 1),
        0
      );
    }

    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const prefix = body.orderType === "M" || isFirstManEligible ? "M" : "P";
    const isManId = prefix === "M";

    const generatedOrderNo = `${prefix}-${randomDigits}`;
    const newOrder = {
      ...body,
      userId,
      profileId: profile ? String(profile._id) : userId,
      customerName: body.customerName || body.name || profile?.name || current?.authUser?.name || "Customer",
      phone: body.phone || body.mobile || profile?.phone || current?.authUser?.mobile || "",
      totalPoints: points,
      points: points,
      orderNo: generatedOrderNo,
      orderId: generatedOrderNo,
      isManId,
      status: "Pending",
      paymentStatus: "Unpaid",
      isPointsProcessed: false,
      pointsProcessedV2: false,
      createdAt: new Date(),
    };

    const result = await orders.insertOne(newOrder);
    return NextResponse.json({
      success: true,
      orderNo: newOrder.orderNo,
      orderId: newOrder.orderId,
      isManId,
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// ২. অর্ডার তালিকা (GET)
// অ্যাডমিন: সব অর্ডার (চাইলে userId/phone দিয়ে ফিল্টার)। সাধারণ ইউজার: শুধু নিজের অর্ডার।
export async function GET(req) {
  try {
    const admin = await requireAdmin(req);
    const current = admin ? null : await getCurrentUser(req).catch(() => null);
    if (!admin && !current?.authUser) {
      return NextResponse.json({ success: false, orders: [], message: "Unauthorized" }, { status: 401 });
    }

    await syncPendingChainOrders().catch(() => null);
    const orders = db.collection("orders");

    if (!admin) {
      const ids = [String(current.authUser.id), current.legacy && String(current.legacy._id)].filter(Boolean);
      const or = [{ userId: { $in: ids } }, { profileId: { $in: ids } }];
      const ph = current.legacy?.phone || current.authUser?.mobile;
      if (ph) or.push({ phone: String(ph) }, { mobile: String(ph) });
      const list = await orders.find({ $or: or }).sort({ createdAt: -1 }).toArray();
      return NextResponse.json({ success: true, orders: list });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const phone = searchParams.get("phone");
    if (userId || phone) {
      const orConditions = [];
      if (userId) orConditions.push({ userId: String(userId) }, { profileId: String(userId) });
      if (phone) orConditions.push({ phone: String(phone) }, { mobile: String(phone) });
      const list = await orders.find({ $or: orConditions }).sort({ createdAt: -1 }).toArray();
      return NextResponse.json({ success: true, orders: list });
    }

    const allOrders = await orders.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, orders: allOrders });
  } catch (error) {
    console.error("Order fetch error:", error);
    return NextResponse.json({ success: false, orders: [] }, { status: 500 });
  }
}

// ৩. স্ট্যাটাস আপডেট ও লেভেল/পয়েন্ট/টাকা প্রসেসিং (PATCH)
export async function PATCH(req) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const { orderId, orderNo, status, paymentStatus } = await req.json();
    const targetId = orderId || orderNo;
    if (!targetId) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
    }

    const orders = db.collection("orders");
    const existing = await orders.findOne(orderQuery(targetId));
    if (!existing) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // 🟢 প্যাকেজ চেইনে ঢুকে যাওয়া অর্ডার Cancel/Pending করলে চেইনে ভুতুড়ে নোড থেকে যায়
    // ("নিজের অর্ডার ০ কিন্তু প্যাকেজ ১" সমস্যা), তাই আটকে দেওয়া হলো
    const wanted = String(status || "").toLowerCase();
    if ((existing.pointsProcessedV2 || existing.isPointsProcessed) && ["cancelled", "canceled", "pending"].includes(wanted)) {
      return NextResponse.json(
        { success: false, message: "এই অর্ডারের প্যাকেজ চেইনে ঢুকে গেছে, তাই Cancel/Pending করা যাবে না।" },
        { status: 409 }
      );
    }

    const updateDoc = { updatedAt: new Date() };
    if (status) updateDoc.status = status;
    if (paymentStatus) updateDoc.paymentStatus = paymentStatus;

    let rewardsApplied = false;
    const normStatus = String(status || "").toLowerCase();

    if (normStatus === "confirm" || normStatus === "confirmed") {
      updateDoc.status = "Confirmed";
      updateDoc.confirmedAt = new Date();
    }

    const shouldProcessPoints = normStatus === "paid";

    if (shouldProcessPoints) {
      updateDoc.status = "Paid";
      updateDoc.paymentStatus = "Paid";
      updateDoc.paidAt = new Date();

      let points = Number(existing.totalPoints ?? existing.points ?? 0);
      if (points === 0 && Array.isArray(existing.items)) {
        points = existing.items.reduce(
          (sum, item) =>
            sum + Number(item.points || item.point || item.rewardPoints || 0) * Number(item.quantity || item.qty || 1),
          0
        );
      }

      if (points > 0) {
        const claimed = await orders.findOneAndUpdate(
          { _id: existing._id, pointsProcessedV2: { $ne: true } },
          { $set: { isPointsProcessed: true, pointsProcessedV2: true } }
        );

        if (claimed) {
          try {
            await processOrderToGlobalChain({
              userId: existing.profileId || existing.userId,
              userName: existing.customerName || existing.name || "Customer",
              phone: existing.phone || existing.mobile || "",
              points,
              orderNo: existing.orderNo || existing.orderId,
            });
            rewardsApplied = true;
          } catch (err) {
            await orders.updateOne(
              { _id: existing._id },
              { $set: { isPointsProcessed: false, pointsProcessedV2: false } }
            );
            throw err;
          }
        }
      }
    }

    const result = await orders.updateOne({ _id: existing._id }, { $set: updateDoc });
    return NextResponse.json({ success: true, updated: result.modifiedCount, rewardsApplied });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}

// ৪. অর্ডার ডিলিট করা (DELETE)
export async function DELETE(req) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const orderId = new URL(req.url).searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
    }

    const orders = db.collection("orders");
    const existing = await orders.findOne(orderQuery(orderId));
    if (!existing) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // 🟢 যে অর্ডারের প্যাকেজ চেইনে ঢুকে গেছে সেটা মুছলে চেইনে ভুতুড়ে নোড থেকে যায়
    // ("নিজের অর্ডার ০ কিন্তু প্যাকেজ ১" সমস্যার কারণ), তাই মুছতে দেওয়া হবে না
    const orderNo = existing.orderNo || existing.orderId;
    const inChain = orderNo ? await db.collection("global_chain").countDocuments({ orderNo }) : 0;
    if (existing.pointsProcessedV2 || inChain > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "এই অর্ডারের প্যাকেজ চেইনে ঢুকে গেছে, তাই মোছা যাবে না।",
        },
        { status: 409 }
      );
    }

    await orders.deleteOne({ _id: existing._id });
    return NextResponse.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Order delete error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}