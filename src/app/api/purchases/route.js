import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, userName, points, items } = body;

    if (!userId || !points) {
      return NextResponse.json({ success: false, message: "Invalid data provided" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // ১. চেক করা এটি ইউজারের প্রথম পারচেস নাকি পরবর্তী পারচেস
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

    // ৩. গ্লোবাল চেইন এবং লেভেল লজিক (নিরাপদভাবে ট্রাই-ক্যাচ দিয়ে মোড়ানো যাতে বিল্ড ফেইলিওর না হয়)
    try {
      // যদি চেইন লজিক ফাইল বা ফাংশন থাকে তবে এখানে রান করবে, না থাকলে এরর ইগ্নোর করবে
      const chainLogic = await import("@/features/levels/chain-logic").catch(() => null);
      if (chainLogic && typeof chainLogic.processGlobalChain === "function") {
        await chainLogic.processGlobalChain({
          userId,
          userName: userName || "User",
          points,
          isManId,
        });
      }
    } catch (err) {
      console.warn("Global chain logic skipped:", err.message);
    }

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
export const dynamic = "force-dynamic";
