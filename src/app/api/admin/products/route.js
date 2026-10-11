import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";

export async function POST(req) {
  try {
    const body = await req.json();
    const { title, category, price, costPrice, unit, image } = body;

    const sellPrice = Number(price) || 0;
    const buyPrice = Number(costPrice) || 0;

    // 🟢 ব্যাকএন্ড অটোমেটিক পয়েন্ট ক্যালকুলেশন
    const profit = Math.max(0, sellPrice - buyPrice);
    const autoPoints = Number((profit / 2.25).toFixed(2));

    const client = await clientPromise;
    const db = client.db();

    const newProduct = {
      title,
      category,
      price: sellPrice,
      costPrice: buyPrice,
      points: autoPoints, // পয়েন্ট অটোমেটিক সেভ হলো
      unit: unit || "1 Pcs",
      image: image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
      createdAt: new Date(),
    };

    const result = await db.collection("products").insertOne(newProduct);

    return NextResponse.json(
      { success: true, message: "Product created with auto points", product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create product" },
      { status: 500 }
    );
  }
}