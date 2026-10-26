import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";
import { requireAdmin, syncMissingProfiles } from "@/lib/current-user";

export async function GET(req) {
  try {
    if (!(await requireAdmin(req, { allowSub: true }))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    await syncMissingProfiles();
    const client = await clientPromise;
    const db = client.db();
    // ১. রিয়েল-টাইম কাস্টমার কাউন্ট (users বা user কালেকশন থেকে)
    let totalCustomers = await db.collection("users").countDocuments({});
    if (!totalCustomers || totalCustomers === 0) {
      totalCustomers = await db.collection("user").countDocuments({});
    }

    // ২. মোট প্রোডাক্ট কাউন্ট
    const totalProducts = await db.collection("products").countDocuments({});

    // ৩. উইশলিস্ট রিকোয়েস্ট কাউন্ট
    const wishlistCount = await db.collection("wishlists").countDocuments({}).catch(() => 0);

    // ৪. অর্ডার ডাটা ফেচ করা
    const orders = await db.collection("orders").find({}).toArray();
    const totalOrders = orders.length;

    // 🟢 ম্যান আইডি (M) এবং প্রোডাক্ট আইডি (P) অর্ডার কাউন্ট (অর্ডার পেজের লজিক অনুযায়ী)
    let manIdOrdersCount = 0;
    let productIdOrdersCount = 0;

    orders.forEach((ord) => {
      const orderNo = (ord.orderNo || ord.orderId || "").toUpperCase();
      if (orderNo.startsWith("M")) {
        manIdOrdersCount++;
      } else if (orderNo.startsWith("P")) {
        productIdOrdersCount++;
      }
    });

    // পেন্ডিং অর্ডার কাউন্ট (যেগুলোর status "Pending" বা ছোটহাতের "pending")
    const pendingOrdersCount = orders.filter(
      (ord) => (ord.status || "").toLowerCase() === "pending"
    ).length;

    // Total Revenue: শুধুমাত্র যে অর্ডারগুলোর পেমেন্ট বা স্ট্যাটাস "Paid", "Delivered" বা "Completed"
    const totalRevenue = orders
      .filter((ord) => {
        const status = (ord.status || "").toLowerCase();
        const payStatus = (ord.paymentStatus || "").toLowerCase();
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
      .filter((w) => (w.status || "").toLowerCase() === "pending")
      .reduce((sum, w) => sum + Number(w.amount || 0), 0);

    // সাম্প্রতিক ৫টি অর্ডার
    const recentOrders = await db.collection("orders")
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({
      success: true,
      stats: {
        totalCustomers,
        totalOrders,
        manIdOrdersCount,     // 🟢 ড্যাশবোর্ডে ম্যান আইডি অর্ডারের সংখ্যা পাঠাবে
        productIdOrdersCount, // 🟢 ড্যাশবোর্ডে প্রোডাক্ট আইডি অর্ডারের সংখ্যা পাঠাবে
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
export const dynamic = "force-dynamic";
