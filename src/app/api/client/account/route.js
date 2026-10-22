import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";
import { ObjectId } from "mongodb";

// ১. ইউজারের কারেন্ট প্রোফাইল ডাটা পাওয়া (GET)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    let query = { _id: userId };
    if (ObjectId.isValid(userId)) {
      query = { $or: [{ _id: new ObjectId(userId) }, { _id: userId }, { id: userId }] };
    }

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
    
    // 🟢 ফ্রন্টএন্ড থেকে mobile এবং id আসতে পারে, তাই সেগুলোও রিসিভ করা হচ্ছে
    const { userId, id, _id, name, phone, mobile, profileImage, address } = body;

    const targetUserId = userId || id || _id;

    if (!targetUserId) {
      return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    let query = { _id: targetUserId };
    if (ObjectId.isValid(targetUserId)) {
      query = { $or: [{ _id: new ObjectId(targetUserId) }, { _id: targetUserId }, { id: targetUserId }] };
    }

    const updateFields = {
      updatedAt: new Date(),
    };
    
    // ডাটাবেসে সেভ করার ফিল্ডগুলো
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined || mobile !== undefined) updateFields.phone = phone || mobile; // mobile কে phone হিসেবে সেভ করবে
    if (profileImage !== undefined) updateFields.profileImage = profileImage;
    if (address !== undefined) updateFields.address = address;

    const result = await db.collection("users").updateOne(query, { $set: updateFields });

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