import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/current-user";

// ইউজার খোঁজার কমন কুয়েরি হেল্পার (যাতে _id, authUserId, referralCode বা phone সবকিছু দিয়েই মিলে)
function buildUserQuery(targetUserId, fallbackIds = []) {
  const allIds = [...new Set([targetUserId, ...fallbackIds].filter(Boolean).map(String))];
  const or = [];

  for (const key of allIds) {
    if (ObjectId.isValid(key)) {
      or.push({ _id: new ObjectId(key) });
    }
    or.push(
      { _id: key },
      { id: key },
      { authUserId: key },
      { referralCode: key },
      { phone: key },
      { mobile: key }
    );
  }

  return or.length > 0 ? { $or: or } : null;
}

// ১. ইউজারের কারেন্ট প্রোফাইল ডাটা পাওয়া (GET)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const current = await getCurrentUser(req).catch(() => null);

    const fallbackIds = [
      current?.legacy?._id,
      current?.authUser?.id,
      current?.authUser?._id,
    ];

    const query = buildUserQuery(userId, fallbackIds);
    if (!query) {
      return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("users").findOne(query, { projection: { password: 0 } });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ২. প্রোফাইল পিকচার ও নাম/তথ্য আপডেট (PUT ও PATCH সাপোর্ট করবে)
export async function PUT(req) {
  try {
    const body = await req.json();
    const current = await getCurrentUser(req).catch(() => null);

    // 🟢 ফ্রন্টএন্ড থেকে mobile এবং id আসতে পারে, পাশাপাশি সেশনের আসল আইডিও নেওয়া হচ্ছে
    const { userId, id, _id, name, phone, mobile, profileImage, address } = body;

    const targetUserId = userId || id || _id;
    const fallbackIds = [
      current?.legacy?._id,
      current?.authUser?.id,
      current?.authUser?._id,
    ];

    const query = buildUserQuery(targetUserId, fallbackIds);
    if (!query) {
      return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const updateFields = {
      updatedAt: new Date(),
    };

    // ডাটাবেসে সেভ করার ফিল্ডগুলো
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined || mobile !== undefined) {
      updateFields.phone = phone || mobile;
      updateFields.mobile = phone || mobile;
    }
    if (profileImage !== undefined) {
      updateFields.profileImage = profileImage;
      updateFields.image = profileImage;
    }
    if (address !== undefined) updateFields.address = address;

    // 'users' কালেকশনে সব ম্যাচিং প্রোফাইল আপডেট করা যাতে রিলোড দিলে কখনোই ছবি না হারায়
    const existingProfile = await db.collection("users").findOne(query);
    await db.collection("users").updateMany(query, { $set: updateFields });

    // Better Auth-এর 'user' কালেকশনেও ছবি ও নাম সিঙ্ক রাখা
    const authIdStr = existingProfile?.authUserId || (current?.authUser?.id ? String(current.authUser.id) : null);
    if (authIdStr) {
      const authQuery = ObjectId.isValid(authIdStr)
        ? { $or: [{ _id: new ObjectId(authIdStr) }, { _id: authIdStr }, { id: authIdStr }] }
        : { $or: [{ _id: authIdStr }, { id: authIdStr }] };

      const authUpdate = { updatedAt: new Date() };
      if (name !== undefined) authUpdate.name = name;
      if (phone !== undefined || mobile !== undefined) authUpdate.mobile = phone || mobile;
      if (profileImage !== undefined) authUpdate.image = profileImage;
      if (address !== undefined) authUpdate.address = address;

      await db.collection("user").updateMany(authQuery, { $set: authUpdate }).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      message: "প্রোফাইল সফলভাবে আপডেট করা হয়েছে!",
      updatedUser: updateFields,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ফ্রন্টএন্ড থেকে কেউ যদি PATCH পাঠায়, সেটাও যেন কাজ করে
export const PATCH = PUT;
export const dynamic = "force-dynamic";