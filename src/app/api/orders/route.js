import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/mongo-client";
import { ensureProfile, getCurrentUser, syncMissingProfiles } from "@/lib/current-user";
import { LEVEL_CONFIG, RESERVED_TOP_POSITIONS, designationFor } from "@/lib/level-config";

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

// 🟢 পয়েন্ট, রিজার্ভ পয়েন্ট, Man ID, Product ID এবং ২৪ লেভেল ক্যালকুলেশন ইঞ্জিন
export async function processOrderToGlobalChain({ userId, userName, phone, points, orderNo }) {
  const addedPoints = Number(points || 0);
  if (addedPoints <= 0) return;

  // টপ ১০টি আইডি এবং সব প্রোফাইল সিঙ্ক থাকা নিশ্চিত করা
  await syncMissingProfiles();

  const chain = db.collection("global_chain");
  const users = db.collection("users");

  // ইউজারের প্রোফাইল খুঁজে বের করা
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
  const previousReserve = Number(profile.reservePoints || 0);
  const totalAvailablePoints = previousReserve + addedPoints;

  // ৪০ পয়েন্ট = ১টি প্যাকেজ, বাকি পয়েন্ট রিজার্ভে জমা থাকবে
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
    const existingNodesCount = await chain.countDocuments({
      $or: [{ userId: nodeUserId }, { authUserId: String(profile.authUserId || userId) }],
    });
    const isManId = existingNodesCount === 0;

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
      userId: nodeUserId,
      authUserId: String(profile.authUserId || userId),
      userName: profile.name || userName || "Customer",
      phone: profile.phone || phone || "",
      isManId,
      points: 40,
      packages: 1,
      accumulatedPackages: 0,
      currentLevel: 0,
      createdAt: new Date(),
    });

    await users.updateOne({ _id: profile._id }, { $inc: { totalPackages: 1 } });

    // 🟢 উপরের সকল নোডকে (Top 10 + সকল Man ID + সকল Product ID) হিট করা
    const upperNodes = await chain.find({ sequenceNo: { $lt: nextSequenceNo } }).toArray();

    for (const up of upperNodes) {
      const newAccumulated = (up.accumulatedPackages || 0) + 1;
      const previousLevel = up.currentLevel || 0;

      let newLevel = previousLevel;
      for (const c of LEVEL_CONFIG) {
        if (newAccumulated >= c.requiredPackages) {
          newLevel = Math.max(newLevel, c.level);
        } else {
          break;
        }
      }

      let rewardTaka = 0;
      if (newLevel > previousLevel) {
        for (let l = previousLevel + 1; l <= newLevel; l++) {
          const cfg = LEVEL_CONFIG.find((item) => item.level === l);
          if (cfg) rewardTaka += cfg.taka;
        }
      }

      await chain.updateOne(
        { _id: up._id },
        {
          $set: {
            accumulatedPackages: newAccumulated,
            currentLevel: newLevel,
            updatedAt: new Date(),
          },
        }
      );

      // Man ID এবং Product ID উভয় নোডের রিওয়ার্ড টাকা ইউজারের মূল ওয়ালেটে যুক্ত করা
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
        const highestLevel = Math.max(ownerDoc.level || 0, newLevel);
        const userUpdate = {
          $set: {
            level: highestLevel,
            currentLevel: highestLevel,
            designation: designationFor(highestLevel),
            ...(up.isManId ? { accumulatedPackages: newAccumulated } : {}),
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
            chainAccountId: up.chainAccountId || (up.isManId ? "Man ID" : "Product ID"),
            isManId: Boolean(up.isManId),
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

// আগে করা যেসব অর্ডার বাগের কারণে চেইনে ঢোকেনি সেগুলো স্বয়ংক্রিয়ভাবে সিঙ্ক করা
export async function syncPendingChainOrders() {
  const orders = db.collection("orders");
  const unSyncedOrders = await orders
    .find({
      status: { $in: ["Delivered", "delivered", "Paid", "paid"] },
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
export async function GET(req) {
  try {
    await syncPendingChainOrders().catch(() => null);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const phone = searchParams.get("phone");

    const orders = db.collection("orders");

    if (userId || phone) {
      const orConditions = [];
      if (userId) {
        orConditions.push({ userId: String(userId) }, { profileId: String(userId) });
      }
      if (phone) {
        orConditions.push({ phone: String(phone) }, { mobile: String(phone) });
      }
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

// ৩. স্ট্যাটাস আপডেট ও লেভেল/পয়েন্ট/টাকা প্রসেসিং (PATCH)
export async function PATCH(req) {
  try {
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

    const updateDoc = { updatedAt: new Date() };
    if (status) updateDoc.status = status;
    if (paymentStatus) updateDoc.paymentStatus = paymentStatus;

    let rewardsApplied = false;
    const normStatus = String(status || "").toLowerCase();
    const shouldProcessPoints = ["delivered", "deliv", "paid"].includes(normStatus);

    if (shouldProcessPoints) {
      if (normStatus === "deliv" || normStatus === "delivered") {
        updateDoc.status = "Delivered";
        updateDoc.deliveredAt = new Date();
      } else if (normStatus === "paid") {
        updateDoc.status = "Paid";
        updateDoc.paymentStatus = "Paid";
      }

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
    const orderId = new URL(req.url).searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
    }
    const result = await db.collection("orders").deleteOne(orderQuery(orderId));
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Order delete error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}