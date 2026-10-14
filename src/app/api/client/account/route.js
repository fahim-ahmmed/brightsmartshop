import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";
import { ObjectId } from "mongodb";

// ১. ইউজারের কারেন্ট প্রোফাইল ডাটা পাওয়া (GET)
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

// ২. প্রোফাইল পিকচার ও নাম/তথ্য আপডেট (PATCH)
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { userId, name, phone, profileImage, address } = body;

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    let query = { _id: userId };
    if (ObjectId.isValid(userId)) {
      query = { $or: [{ _id: new ObjectId(userId) }, { _id: userId }, { id: userId }] };
    }

    const updateFields = {
      updatedAt: new Date(),
    };
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
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