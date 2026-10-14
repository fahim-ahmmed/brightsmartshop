import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // প্রথমে 'users' কালেকশন চেক করা, না পেলে অন্য কালেকশন চেক করবে
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