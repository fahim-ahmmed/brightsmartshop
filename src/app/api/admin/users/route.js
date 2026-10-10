import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  try {
    // 1. Ensure Database Connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 2. Query the 'user' collection (where your 3 users are stored)
    const db = mongoose.connection.db;
    const users = await db.collection("user").find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      success: true,
      users: users || [],
    });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}