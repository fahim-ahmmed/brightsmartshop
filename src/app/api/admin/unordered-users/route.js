import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 = Jan, 9 = Oct
    const currentDay = now.getDate();

    // চলতি মাসের ১ তারিখ (০০:০০:০০) থেকে মাসের শেষ দিন পর্যন্ত সময়সীমা
    const startDate = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // ১. ডাটাবেস থেকে সব রেজিস্টার্ড ইউজার আনা (অ্যাডমিন বাদে)
    const allUsers = await db
      .collection("users")
      .find({ role: { $ne: "admin" } })
      .sort({ createdAt: -1 })
      .toArray();

    // ২. চলতি মাসের ১ তারিখ থেকে করা সব বৈধ অর্ডার (Cancelled বাদে) আনা
    const allOrders = await db
      .collection("orders")
      .find({
        status: { $nin: ["Cancelled", "cancelled", "CANCELLED"] },
      })
      .toArray();

    const validOrders = allOrders.filter((ord) => {
      if (!ord.createdAt) return false;
      const ordDate = new Date(ord.createdAt);
      return ordDate >= startDate && ordDate <= endDate;
    });

    // ৩. কোন ইউজার চলতি মাসে মোট কত পয়েন্টের অর্ডার করেছে তা হিসাব করা
    const userPointsMap = {};

    validOrders.forEach((ord) => {
      let points = Number(ord.totalPoints ?? ord.points ?? 0);
      if (points === 0 && Array.isArray(ord.items)) {
        points = ord.items.reduce(
          (sum, item) =>
            sum + Number(item.points || item.point || item.rewardPoints || 0) * Number(item.quantity || item.qty || 1),
          0
        );
      }

      const uId = ord.userId ? String(ord.userId).trim() : null;
      const pId = ord.profileId ? String(ord.profileId).trim() : null;
      const uPhone = (ord.phone || ord.mobile) ? String(ord.phone || ord.mobile).trim() : null;
      const uEmail = ord.email ? String(ord.email).trim().toLowerCase() : null;
      const uName = ord.customerName ? String(ord.customerName).trim().toLowerCase() : null;

      if (uId) userPointsMap[`id_${uId}`] = (userPointsMap[`id_${uId}`] || 0) + points;
      if (pId && pId !== uId) userPointsMap[`id_${pId}`] = (userPointsMap[`id_${pId}`] || 0) + points;
      if (uPhone) userPointsMap[`phone_${uPhone}`] = (userPointsMap[`phone_${uPhone}`] || 0) + points;
      if (uEmail) userPointsMap[`email_${uEmail}`] = (userPointsMap[`email_${uEmail}`] || 0) + points;
      if (uName) userPointsMap[`name_${uName}`] = (userPointsMap[`name_${uName}`] || 0) + points;
    });

    // ৪. মাসের ১ তারিখ থেকেই সবাই এই লিস্টে থাকবে, আর যারা ৪০ পয়েন্ট (১ প্যাকেজ) অর্ডার করে ফেলবে তারা অটোমেটিক বাদ হয়ে যাবে
    const unorderedList = allUsers
      .map((user) => {
        const uid = String(user._id).trim();
        const phone = (user.phone || user.mobile) ? String(user.phone || user.mobile).trim() : "";
        const email = user.email ? String(user.email).trim().toLowerCase() : "";
        const nameKey = user.name ? String(user.name).trim().toLowerCase() : "";

        const earnedPoints = Math.max(
          userPointsMap[`id_${uid}`] || 0,
          user.authUserId ? userPointsMap[`id_${String(user.authUserId).trim()}`] || 0 : 0,
          phone ? userPointsMap[`phone_${phone}`] || 0 : 0,
          email ? userPointsMap[`email_${email}`] || 0 : 0,
          nameKey ? userPointsMap[`name_${nameKey}`] || 0 : 0
        );

        return {
          _id: uid,
          name: user.name || user.fullName || user.username || "N/A",
          phone: user.phone || user.mobile || "N/A",
          email: user.email && !user.email.endsWith("@brightsmartshop.local") ? user.email : "N/A",
          address: user.address || user.location || "ঠিকানা দেওয়া হয়নি",
          referralId: user.referralCode || user.sponsorId || user.referredBy || "N/A",
          level: user.level || 0,
          walletBalance: user.walletBalance || 0,
          earnedPointsThisPeriod: earnedPoints,
          shortfallPoints: Math.max(0, 40 - earnedPoints),
          createdAt: user.createdAt || null,
        };
      })
      .filter((u) => u.earnedPointsThisPeriod < 40);

    return NextResponse.json({
      success: true,
      isAfter20th: true,
      currentDay,
      currentMonthName: now.toLocaleString("en-US", { month: "long", year: "numeric" }),
      totalRegisteredUsers: allUsers.length,
      totalDefaulters: unorderedList.length,
      users: unorderedList,
    });
  } catch (error) {
    console.error("Unordered users fetch error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";