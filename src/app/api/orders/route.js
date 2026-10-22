import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client"; 
import { ObjectId } from "mongodb";

// ২৪ লেভেলের ক্রাইটেরিয়া, প্যাকেজ এবং লেভেল আপ ক্যাশব্যাক চার্ট
const LEVEL_CONFIG = [
  { level: 1, requiredPackages: 3, taka: 0 },
  { level: 2, requiredPackages: 5, taka: 3 },
  { level: 3, requiredPackages: 9, taka: 4 },
  { level: 4, requiredPackages: 16, taka: 8 },
  { level: 5, requiredPackages: 33, taka: 15 },
  { level: 6, requiredPackages: 65, taka: 32 },
  { level: 7, requiredPackages: 129, taka: 60 },
  { level: 8, requiredPackages: 257, taka: 100 },
  { level: 9, requiredPackages: 513, taka: 250 },
  { level: 10, requiredPackages: 1025, taka: 510 },
  { level: 11, requiredPackages: 2049, taka: 1025 },
  { level: 12, requiredPackages: 4097, taka: 2050 },
  { level: 13, requiredPackages: 8193, taka: 4050 },
  { level: 14, requiredPackages: 16385, taka: 8200 },
  { level: 15, requiredPackages: 32769, taka: 16000 },
  { level: 16, requiredPackages: 65537, taka: 30000 },
  { level: 17, requiredPackages: 131073, taka: 65000 },
  { level: 18, requiredPackages: 262145, taka: 100000 },
  { level: 19, requiredPackages: 524289, taka: 250000 },
  { level: 20, requiredPackages: 1048577, taka: 350000 },
  { level: 21, requiredPackages: 2097153, taka: 800000 },
  { level: 22, requiredPackages: 4194305, taka: 1500000 },
  { level: 23, requiredPackages: 8388609, taka: 2000000 },
  { level: 24, requiredPackages: 16777217, taka: 5000000 },
];

async function processOrderToGlobalChain(orderData) {
  const { userId, userName, points } = orderData;
  const packagesGenerated = Math.floor(points / 40);

  if (packagesGenerated <= 0) return;

  const client = await clientPromise;
  const db = client.db();
  const chainCollection = db.collection("global_chain");
  const usersCollection = db.collection("users");

  const existingNodesCount = await chainCollection.countDocuments({ userId: userId });
  const isManId = existingNodesCount === 0;

  const lastNode = await chainCollection.findOne({}, { sort: { sequenceNo: -1 } });
  const nextSequenceNo = lastNode ? lastNode.sequenceNo + 1 : 1;

  const newNode = {
    sequenceNo: nextSequenceNo,
    userId: userId,
    userName: userName || "Customer",
    isManId: isManId, 
    points: points,
    packages: packagesGenerated,
    accumulatedPackages: 0, 
    currentLevel: 0,
    createdAt: new Date(),
  };

  await chainCollection.insertOne(newNode);

  const upperNodes = await chainCollection.find({ sequenceNo: { $lt: nextSequenceNo } }).toArray();

  for (const upNode of upperNodes) {
    const prevAccumulated = upNode.accumulatedPackages || 0;
    const newTotalPackages = prevAccumulated + packagesGenerated;

    const previousLevel = upNode.currentLevel || 0;
    let calculatedLevel = previousLevel;
    let cashbackRewardToAdd = 0;

    for (const config of LEVEL_CONFIG) {
      if (newTotalPackages >= config.requiredPackages) {
        calculatedLevel = config.level;
      } else {
        break;
      }
    }

    if (calculatedLevel > previousLevel) {
      for (let lvl = previousLevel + 1; lvl <= calculatedLevel; lvl++) {
        const conf = LEVEL_CONFIG.find(c => c.level === lvl);
        if (conf) {
          cashbackRewardToAdd += conf.taka;
        }
      }
    }

    await chainCollection.updateOne(
      { _id: upNode._id },
      { 
        $set: { 
          accumulatedPackages: newTotalPackages,
          currentLevel: calculatedLevel 
        } 
      }
    );

    if (upNode.isManId) {
      const updateData = {
        level: calculatedLevel,
        totalPackages: newTotalPackages
      };

      const dbQuery = {
        $set: updateData,
        ...(cashbackRewardToAdd > 0 && { $inc: { walletBalance: cashbackRewardToAdd } })
      };

      await usersCollection.updateOne(
        { _id: upNode.userId },
        dbQuery
      );
    }
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, totalPoints, orderType } = body;

    const client = await clientPromise;
    const db = client.db();
    const ordersCollection = db.collection("orders");

    const existingOrdersCount = await ordersCollection.countDocuments({ userId: userId });
    const isFirstOrder = existingOrdersCount === 0;

    const points = Number(totalPoints || body.points || 0);
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    
    let prefix = "BSS"; 
    let isManId = false;

    if (orderType === "M" || (isFirstOrder && points >= 40)) {
      prefix = "M";
      isManId = true;
    } else if (orderType === "P" || points >= 40) {
      prefix = "P";
      isManId = false;
    } else {
      prefix = "BSS"; 
      isManId = false;
    }

    const generatedOrderNo = `${prefix}-${randomDigits}`;

    const newOrder = {
      ...body,
      orderNo: generatedOrderNo,
      orderId: generatedOrderNo,
      isManId: isManId, 
      status: body.status || "Pending", 
      paymentStatus: body.paymentStatus || "Unpaid",
      createdAt: new Date(),
    };

    const result = await ordersCollection.insertOne(newOrder);

    if (points > 0) {
      await processOrderToGlobalChain({
        userId: userId,
        userName: body.customerName,
        points: points,
      });
    }

    return NextResponse.json({
      success: true,
      orderNo: newOrder.orderNo,
      orderId: newOrder.orderId,
      isManId: isManId,
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const userId = searchParams.get("userId");

    const client = await clientPromise;
    const db = client.db();

    const query = {};
    if (userId) query.userId = userId;
    else if (phone) query.phone = phone;

    const orders = await db
      .collection("orders")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Order fetch error:", error);
    return NextResponse.json({ success: false, orders: [] }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { orderId, orderNo, status, paymentStatus } = await req.json();

    const client = await clientPromise;
    const db = client.db();

    const updateDoc = {};
    if (status) updateDoc.status = status;
    if (paymentStatus) updateDoc.paymentStatus = paymentStatus;

    const targetId = orderId || orderNo;

    const result = await db.collection("orders").updateOne(
      { 
        $or: [
          { orderId: targetId }, 
          { orderNo: targetId },
          ...(ObjectId.isValid(targetId) ? [{ _id: new ObjectId(targetId) }] : [])
        ] 
      },
      { $set: updateDoc }
    );

    return NextResponse.json({ success: true, updated: result.modifiedCount });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// 🟢 ডিলিট রিকোয়েস্ট হ্যান্ডেল করার জন্য সঠিক DELETE মেথড
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("orders").deleteOne({
      $or: [
        { orderId: orderId },
        { orderNo: orderId },
        ...(ObjectId.isValid(orderId) ? [{ _id: new ObjectId(orderId) }] : [])
      ]
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Order delete error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}