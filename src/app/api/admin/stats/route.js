import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";
import { requireAdmin, syncMissingProfiles } from "@/lib/current-user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    if (!(await requireAdmin(req, { allowSub: true }))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // সাইন-আপ করা সকল ইউজার এবং টপ ১০ আইডি সিঙ্ক করা
    await syncMissingProfiles();

    const client = await clientPromise;
    const db = client.db();

    // ১. রিয়েল-টাইম কাস্টমার কাউন্ট (অ্যাডমিন বাদে সকল ইউজার)
    const totalCustomers = await db.collection("users").countDocuments({
      role: { $nin: ["admin", "Admin", "Super Admin"] },
    });

    // ২. মোট প্রোডাক্ট কাউন্ট
    const totalProducts = await db.collection("products").countDocuments({});

    // ৩. উইশলিস্ট রিকোয়েস্ট কাউন্ট
    const wishlistCount = await db.collection("wishlists").countDocuments({}).catch(() => 0);

    // ৪. অর্ডার ডাটা ফেচ করা
    const orders = await db.collection("orders").find({}).toArray();
    const totalOrders = orders.length;

    // 🟢 ম্যান আইডি (M) এবং প্রোডাক্ট আইডি (P) অর্ডার কাউন্ট
    let manIdOrdersCount = 0;
    let productIdOrdersCount = 0;

    orders.forEach((ord) => {
      const orderNo = String(ord.orderNo || ord.orderId || "").toUpperCase();
      if (orderNo.startsWith("M")) {
        manIdOrdersCount++;
      } else if (orderNo.startsWith("P")) {
        productIdOrdersCount++;
      }
    });

    // পেন্ডিং অর্ডার কাউন্ট
    const pendingOrdersCount = orders.filter(
      (ord) => String(ord.status || "").toLowerCase() === "pending"
    ).length;

    // Total Revenue: Paid, Delivered বা Completed অর্ডারগুলোর যোগফল
    const totalRevenue = orders
      .filter((ord) => {
        const status = String(ord.status || "").toLowerCase();
        const payStatus = String(ord.paymentStatus || "").toLowerCase();
        return (
          status === "paid" ||
          status === "delivered" ||
          status === "completed" ||
          payStatus === "paid" ||
          payStatus === "completed"
        );
      })
      .reduce((sum, ord) => sum + Number(ord.totalAmount || 0), 0);

    // ৫. পেন্ডিং উইথড্রয়াল টাকার পরিমাণ হিসাব করা
    const withdrawals = await db.collection("withdrawals").find({}).toArray().catch(() => []);
    const pendingWithdrawals = withdrawals
      .filter((w) => String(w.status || "").toLowerCase() === "pending")
      .reduce((sum, w) => sum + Number(w.amount || (w.amountPaisa ? w.amountPaisa / 100 : 0)), 0);

    // সাম্প্রতিক ৫টি অর্ডার
    const recentOrders = await db
      .collection("orders")
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({
      success: true,
      stats: {
        totalCustomers,
        totalOrders,
        manIdOrdersCount,
        productIdOrdersCount,
        pendingOrders: pendingOrdersCount,
        totalRevenue,
        wishlistCount,
        totalProducts,
        pendingWithdrawals,
      },
      recentOrders,
    });
  } catch (error) {
    console.error("Admin Stats API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}