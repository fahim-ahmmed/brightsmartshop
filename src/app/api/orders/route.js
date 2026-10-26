import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/mongo-client";
import { ensureProfile, getCurrentUser, requireAdmin } from "@/lib/current-user";
import { LEVEL_CONFIG, RESERVED_TOP_POSITIONS } from "@/lib/level-config";

export const dynamic = "force-dynamic";

const CANCELLED = ["Cancelled", "cancelled", "CANCELLED"];
const unauthorized = () =>
  NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

function orderQuery(targetId) {
  return {
    $or: [
      { orderId: targetId },
      { orderNo: targetId },
      ...(ObjectId.isValid(targetId) ? [{ _id: new ObjectId(targetId) }] : []),
    ],
  };
}

async function processOrderToGlobalChain({ userId, userName, points, orderNo }) {
  const packagesGenerated = Math.floor(points / 40); // ৪০ পয়েন্ট = ১ প্যাকেজ
  if (packagesGenerated <= 0) return;

  const chain = db.collection("global_chain");
  const users = db.collection("users");

  // চেইনে সবসময় users প্রোফাইলের আইডি দিয়ে নোড রাখা হয়
  const profile = await ensureProfile(userId);
  const nodeUserId = profile ? String(profile._id) : String(userId);

  const isManId = (await chain.countDocuments({ userId: nodeUserId })) === 0;

  // প্রথম ১০ পজিশন টপ আইডির জন্য সংরক্ষিত
  const lastNode = await chain.findOne({}, { sort: { sequenceNo: -1 } });
  const nextSequenceNo = Math.max((lastNode?.sequenceNo || 0) + 1, RESERVED_TOP_POSITIONS + 1);

  await chain.insertOne({
    sequenceNo: nextSequenceNo,
    userId: nodeUserId,
    userName: profile?.name || userName || "Customer",
    isManId,
    points,
    packages: packagesGenerated,
    accumulatedPackages: 0,
    currentLevel: 0,
    createdAt: new Date(),
  });

  const upperNodes = await chain.find({ sequenceNo: { $lt: nextSequenceNo } }).toArray();

  for (const up of upperNodes) {
    const newTotal = (up.accumulatedPackages || 0) + packagesGenerated;
    const previousLevel = up.currentLevel || 0;

    let level = previousLevel;
    for (const c of LEVEL_CONFIG) {
      if (newTotal >= c.requiredPackages) level = Math.max(level, c.level);
      else break;
    }

    let reward = 0;
    for (let l = previousLevel + 1; l <= level; l++) reward += LEVEL_CONFIG[l - 1].taka;

    await chain.updateOne(
      { _id: up._id },
      { $set: { accumulatedPackages: newTotal, currentLevel: level } }
    );

    // টাকা শুধু ম্যান আইডি নোডে ঢোকে
    if (up.isManId) {
      const filter = {
        $or: [
          { _id: ObjectId.isValid(up.userId) ? new ObjectId(up.userId) : up.userId },
          { authUserId: String(up.userId) },
        ],
      };
      const update = { $set: { level, totalPackages: newTotal } };
      if (reward > 0) update.$inc = { walletBalance: reward };
      await users.updateOne(filter, update);

      if (reward > 0) {
        await db.collection("wallet_history").insertOne({
          userId: String(up.userId),
          amount: reward,
          fromLevel: previousLevel,
          toLevel: level,
          orderNo,
          type: "level_reward",
          createdAt: new Date(),
        });
      }
    }
  }
}

// ১. অর্ডার তৈরি
export async function POST(req) {
  try {
    const body = await req.json();
    const current = await getCurrentUser(req);
    // লগইন থাকলে সেশনের আইডিই চূড়ান্ত, ক্লায়েন্টের পাঠানো আইডি নয়
    const userId = String(current?.authUser?.id || body.userId || "").trim();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Please log in to place an order" }, { status: 401 });
    }

    const profile = await ensureProfile(userId);
    const ownerIds = [userId, profile && String(profile._id)].filter(Boolean);

    const orders = db.collection("orders");
    const priorOrders = await orders.countDocuments({
      userId: { $in: ownerIds },
      status: { $nin: CANCELLED },
    });
    const hasManNode = profile
      ? (await db.collection("global_chain").countDocuments({ userId: String(profile._id), isManId: true })) > 0
      : false;
    const isFirstOrder = priorOrders === 0 && !hasManNode;

    const points = Number(body.totalPoints || body.points || 0);
    const randomDigits = Math.floor(100000 + Math.random() * 900000);

    let prefix = "BSS";
    let isManId = false;
    if (body.orderType === "M" || (isFirstOrder && points >= 40)) {
      prefix = "M";
      isManId = true;
    } else if (body.orderType === "P" || points >= 40) {
      prefix = "P";
    }

    const generatedOrderNo = `${prefix}-${randomDigits}`;
    const newOrder = {
      ...body,
      userId,
      orderNo: generatedOrderNo,
      orderId: generatedOrderNo,
      isManId,
      status: "Pending",
      paymentStatus: "Unpaid",
      isPointsProcessed: false,
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

// ২. অর্ডার তালিকা: অ্যাডমিন সব দেখে, কাস্টমার শুধু নিজের
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = {};

    if (await requireAdmin(req)) {
      const userId = searchParams.get("userId");
      const phone = searchParams.get("phone");
      if (userId) query.userId = userId;
      else if (phone) query.phone = phone;
    } else {
      const current = await getCurrentUser(req);
      if (!current) return unauthorized();
      const ids = [String(current.authUser.id)];
      if (current.legacy) ids.push(String(current.legacy._id));
      query.userId = { $in: ids };
    }

    const orders = await db.collection("orders").find(query).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Order fetch error:", error);
    return NextResponse.json({ success: false, orders: [] }, { status: 500 });
  }
}

// ৩. স্ট্যাটাস আপডেট ও লেভেল/টাকা (শুধু অ্যাডমিন)
export async function PATCH(req) {
  try {
    if (!(await requireAdmin(req))) return unauthorized();

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

    const updateDoc = {};
    if (status) updateDoc.status = status;
    if (paymentStatus) updateDoc.paymentStatus = paymentStatus;

    let rewardsApplied = false;
    const isDelivered = status && ["delivered", "deliv"].includes(String(status).toLowerCase());

    if (isDelivered) {
      updateDoc.status = "Delivered";
      const points = Number(existing.totalPoints || existing.points || 0);

      if (points >= 40) {
        // একই অর্ডারে দুইবার পয়েন্ট না যায়, তাই আগে দখল করে নেওয়া
        const claimed = await orders.findOneAndUpdate(
          { _id: existing._id, isPointsProcessed: { $ne: true } },
          { $set: { isPointsProcessed: true } }
        );
        if (claimed) {
          try {
            await processOrderToGlobalChain({
              userId: existing.userId,
              userName: existing.customerName || existing.name || "Customer",
              points,
              orderNo: existing.orderNo,
            });
            rewardsApplied = true;
          } catch (err) {
            await orders.updateOne({ _id: existing._id }, { $set: { isPointsProcessed: false } });
            throw err;
          }
        }
      }
    }

    if (!Object.keys(updateDoc).length) return NextResponse.json({ success: true, updated: 0 });
    const result = await orders.updateOne({ _id: existing._id }, { $set: updateDoc });
    return NextResponse.json({ success: true, updated: result.modifiedCount, rewardsApplied });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    if (!(await requireAdmin(req))) return unauthorized();

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