import { NextResponse } from "next/server";
import mongoose from "mongoose";

async function connectDB() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const db = mongoose.connection.db;

    // Fetch all records without restricted filters
    const products = await db
      .collection("products")
      .find({})
      .sort({ _id: -1 })
      .toArray();

    return NextResponse.json(
      { success: true, count: products.length, products },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Fetch products error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}