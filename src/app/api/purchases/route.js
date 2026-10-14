import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";
import { processGlobalChain } from "@/features/levels/chain-logic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, userName, points, items } = body;

    if (!userId || !points) {
      return NextResponse.json({ success: false, message: "Invalid data provided" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // ১. চেক করা এটি ইউজারের প্রথম পারচেস (Man ID) নাকি পরবর্তী পারচেস (Product ID)
    const existingPurchases = await db.collection("purchases").countDocuments({ userId: userId });
    const isManId = existingPurchases === 0;

    const purchaseRecord = {
      userId,
      userName: userName || "User",
      points,
      items: items || [],
      isManId,
      createdAt: new Date(),
    };

    // ২. পারচেস কালেকশনে সেভ করা
    const purchaseResult = await db.collection("purchases").insertOne(purchaseRecord);

    // ৩. গ্লোবাল চেইন এবং লেভেল লজিক ট্রিগার করা
    await processGlobalChain({
      userId,
      userName: userName || "User",
      points,
      isManId,
    });

    return NextResponse.json({
      success: true,
      message: "Purchase completed and global chain updated successfully!",
      purchaseId: purchaseResult.insertedId,
      isManId,
    });

  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}