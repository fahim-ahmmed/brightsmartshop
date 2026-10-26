import { NextResponse } from "next/server";
import { db } from "@/lib/mongo-client";
import { getCurrentUser } from "@/lib/current-user";
import { LEVEL_CONFIG, designationFor } from "@/lib/level-config";

export const dynamic = "force-dynamic";

const COLORS = ["#3B82F6", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#64748B", "#F97316", "#84CC16"];

export async function GET(req) {
  try {
    const current = await getCurrentUser(req);
    if (!current) return NextResponse.json({ message: "Please log in" }, { status: 401 });
    const { authUser, legacy } = current;
    const profileId = legacy ? String(legacy._id) : null;

    const nodes = profileId
      ? await db.collection("global_chain").find({ userId: profileId }).toArray()
      : [];
    const manNode = nodes.find((n) => n.isManId);
    const packagesInNetwork = manNode?.accumulatedPackages ?? 0;
    const level = Math.max(legacy?.level ?? 0, manNode?.currentLevel ?? 0);
    const ownPackages = nodes.reduce((s, n) => s + (n.packages || 0), 0);

    const ownerIds = [String(authUser.id), profileId].filter(Boolean);
    const totalOrders = await db.collection("orders").countDocuments({
      userId: { $in: ownerIds },
      status: { $nin: ["Cancelled", "cancelled", "CANCELLED"] },
    });

    const grouped = await db
      .collection("products")
      .aggregate([
        { $group: { _id: { $ifNull: ["$categoryName", "$category"] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();
    const categoryStats = grouped
      .filter((g) => g._id)
      .map((g, i) => ({ name: String(g._id), count: g.count, color: COLORS[i % COLORS.length] }));

    const next = LEVEL_CONFIG.find((c) => c.level === level + 1);
    const email = authUser.email?.endsWith(".local") ? "" : authUser.email;

    return NextResponse.json({
      user: {
        name: legacy?.name || authUser.name,
        id: String(authUser.id),
        email,
        mobile: legacy?.phone || authUser.mobile || "",
        address: legacy?.address || authUser.address || "",
        profileImage: legacy?.profileImage || authUser.image || "",
      },
      stats: {
        currentLevel: level,
        designation: designationFor(level),
        // ড্যাশবোর্ড পেজ এই সংখ্যাকে ৪০ দিয়ে ভাগ করে প্যাকেজ দেখায়
        newPurchasersAfterMe: packagesInNetwork * 40,
        nextLevelTarget: next ? next.requiredPackages : 0,
        walletBalance: Number(legacy?.walletBalance ?? 0),
        totalOrders,
        totalPackages: ownPackages,
        totalSponsors: 0,
      },
      categoryStats,
      levelTable: LEVEL_CONFIG.map((c) => ({ ...c, requiredNewPurchasers: c.requiredPackages })),
    });
  } catch (error) {
    console.error("[dashboard-stats]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}