import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";
import { ObjectId } from "mongodb";

// প্রোফাইল পিকচার ও নাম/তথ্য আপডেট (PUT ও PATCH সাপোর্ট করবে)
export async function PUT(req) {
  try {
    const body = await req.json();
    
    // ফ্রন্টএন্ড থেকে আসা ডাটা রিসিভ করা
    const { userId, id, _id, name, phone, mobile, profileImage, address } = body;

    const targetUserId = userId || id || _id;

    if (!targetUserId) {
      return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // ইউজারের আইডি দিয়ে ডাটাবেসে খোঁজা
    let query = { _id: targetUserId };
    if (ObjectId.isValid(targetUserId)) {
      query = { $or: [{ _id: new ObjectId(targetUserId) }, { _id: targetUserId }, { id: targetUserId }] };
    }

    const updateFields = {
      updatedAt: new Date(),
    };
    
    // ডাটাবেসে সেভ করার ফিল্ডগুলো সেট করা
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined || mobile !== undefined) updateFields.phone = phone || mobile;
    if (profileImage !== undefined) updateFields.profileImage = profileImage;
    if (address !== undefined) updateFields.address = address;

    const result = await db.collection("users").updateOne(query, { $set: updateFields });

    return NextResponse.json({
      success: true,
      message: "প্রোফাইল সফলভাবে আপডেট করা হয়েছে!",
      updatedUser: updateFields,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ফ্রন্টএন্ড থেকে কেউ যদি PATCH পাঠায়, সেটাও যেন কাজ করে
export const PATCH = PUT;