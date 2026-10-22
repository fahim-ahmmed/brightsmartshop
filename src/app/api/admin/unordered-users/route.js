import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const forcePreview = searchParams.get("preview") === "true"; // ১-২০ তারিখের মধ্যেও চেক করার অপশন

    const client = await clientPromise;
    const db = client.db();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 = Jan, 9 = Oct
    const currentDay = now.getDate();

    // চলতি মাসের ১ তারিখ (০০:০০:০০) থেকে ২০ তারিখ (২৩:৫৯:৫৯) পর্যন্ত সময়সীমা
    const startDate = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const endDate = new Date(currentYear, currentMonth, 20, 23, 59, 59, 999);

    // ২১ তারিখ হয়েছে কিনা চেক করা
    const isAfter20th = currentDay >= 21;

    // ১. ডাটাবেস থেকে সব রেজিস্টার্ড ইউজার আনা (অ্যাডমিন বাদে)
    const allUsers = await db
      .collection("users")
      .find({ role: { $ne: "admin" } })
      .sort({ createdAt: -1 })
      .toArray();

    // ২. চলতি মাসের ১ থেকে ২০ তারিখের মধ্যে করা সব বৈধ অর্ডার (Cancelled বাদে) আনা
    const validOrders = await db
      .collection("orders")
      .find({
        createdAt: { $gte: startDate,$lte: endDate },
        status: { $nin: ["Cancelled", "cancelled", "CANCELLED"] },
      })
      .toArray();

    // ৩. কোন ইউজার ১-২০ তারিখের মধ্যে মোট কত পয়েন্টের অর্ডার করেছে তা হিসাব করা
    const userPointsMap = {};

    validOrders.forEach((ord) => {
      const points = Number(ord.totalPoints ?? ord.points ?? 0);
      const uId = ord.userId ? String(ord.userId).trim() : null;
      const uPhone = ord.phone ? String(ord.phone).trim() : null;
      const uEmail = ord.email ? String(ord.email).trim().toLowerCase() : null;

      if (uId) userPointsMap[`id_${uId}`] = (userPointsMap[`id_${uId}`] || 0) + points;
      if (uPhone) userPointsMap[`phone_${uPhone}`] = (userPointsMap[`phone_${uPhone}`] || 0) + points;
      if (uEmail) userPointsMap[`email_${uEmail}`] = (userPointsMap[`email_${uEmail}`] || 0) + points;
    });

    // ৪. যেসব ইউজার ১-২০ তারিখের মধ্যে ৪০ পয়েন্ট (১ প্যাকেজ) পূর্ণ করেনি তাদের ফিল্টার করা
    const unorderedList = allUsers
      .map((user) => {
        const uid = String(user._id).trim();
        const phone = user.phone ? String(user.phone).trim() : "";
        const email = user.email ? String(user.email).trim().toLowerCase() : "";

        // ইউজার আইডি, ফোন বা ইমেইল যেকোনো একটি দিয়ে ম্যাচ করলেই পয়েন্ট ধরা হবে
        const earnedPoints = Math.max(
          userPointsMap[`id_${uid}`] || 0,
          phone ? userPointsMap[`phone_${phone}`] || 0 : 0,
          email ? userPointsMap[`email_${email}`] || 0 : 0
        );

        return {
          _id: uid,
          name: user.name || user.fullName || user.username || "N/A",
          phone: user.phone || user.mobile || "N/A",
          email: user.email || "N/A",
          address: user.address || user.location || "ঠিকানা দেওয়া হয়নি",
          referralId: user.referralCode || user.sponsorId || user.referredBy || "N/A",
          level: user.level || 0,
          walletBalance: user.walletBalance || 0,
          earnedPointsThisPeriod: earnedPoints,
          shortfallPoints: Math.max(0, 40 - earnedPoints),
          createdAt: user.createdAt || null,
        };
      })
      .filter((u) => u.earnedPointsThisPeriod < 40); // ৪০ পয়েন্টের কম হলেই ডিফল্টার

    return NextResponse.json({
      success: true,
      isAfter20th,
      currentDay,
      currentMonthName: now.toLocaleString("en-US", { month: "long", year: "numeric" }),
      totalRegisteredUsers: allUsers.length,
      totalDefaulters: unorderedList.length,
      // ২১ তারিখ থেকে স্বয়ংক্রিয়ভাবে সবাইকে দেখাবে, আর ১-২০ তারিখে অ্যাডমিন চাইলে প্রিভিউ দেখতে পারবে
      users: isAfter20th || forcePreview ? unorderedList : [],
    });
  } catch (error) {
    console.error("Unordered users fetch error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}