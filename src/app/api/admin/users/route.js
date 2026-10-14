import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";
import { ObjectId } from "mongodb";

// ১. সকল ইউজার লোড করা (GET)
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // প্রথমে 'users' কালেকশন চেক করা, না পেলে 'user' কালেকশন চেক করবে
    let users = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray();
    
    if (!users || users.length === 0) {
      users = await db.collection("user").find({}).sort({ createdAt: -1 }).toArray();
    }

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ২. ইউজারের তথ্য ইডিট / আপডেট করা (PATCH)
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { userId, name, phone, password, role } = body;

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    let query = { _id: userId };
    if (ObjectId.isValid(userId)) {
      query = { $or: [{ _id: new ObjectId(userId) }, { _id: userId }, { id: userId }] };
    } else {
      query = { $or: [{ _id: userId }, { id: userId }] };
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (password !== undefined && password !== "") {
      updateData.password = password;
      updateData.rawPassword = password;
    }
    if (role !== undefined) updateData.role = role;
    updateData.updatedAt = new Date();

    // 'users' কালেকশনে চেষ্টা করা
    let result = await db.collection("users").updateOne(query, { $set: updateData }).catch(() => null);
    
    // না পাওয়া গেলে 'user' কালেকশনে চেষ্টা করা
    if (!result || result.matchedCount === 0) {
      result = await db.collection("user").updateOne(query, { $set: updateData }).catch(() => null);
    }

    return NextResponse.json({ success: true, message: "ইউজারের তথ্য সফলভাবে আপডেট করা হয়েছে!" });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ৩. ইউজার ডিলিট করা (DELETE)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // ObjectId অথবা String দুইভাবেই ডিলিট করার চেষ্টা করা
    let result = await db.collection("users").deleteOne({ _id: new ObjectId(id) }).catch(() => null);
    
    if (!result || result.deletedCount === 0) {
      result = await db.collection("users").deleteOne({ _id: id }).catch(() => null);
    }
    if (!result || result.deletedCount === 0) {
      result = await db.collection("user").deleteOne({ _id: new ObjectId(id) }).catch(() => null);
    }

    return NextResponse.json({ success: true, message: "User deleted successfully!" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}