import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";

export async function POST(req) {
  try {
    const body = await req.json();
    const { title, category, price, costPrice, discountPrice, unit, image, sku } = body;

    const sellPrice = Number(price) || 0;
    const buyPrice = Number(costPrice) || 0;
    const displayDiscountPrice = Number(discountPrice) || 0;

    // 🟢 ব্যাকএন্ড অটোমেটিক পয়েন্ট ক্যালকুলেশন (Profit / 2.25)
    const profit = Math.max(0, sellPrice - buyPrice);
    const autoPoints = Number((profit / 2.25).toFixed(2));

    // 🟢 ইউনিক স্লাগ (slug) জেনারেট করার লজিক
    const generateSlug = (text) => {
      if (!text) return `product-${Date.now()}`;
      return (
        text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")       // স্পেসের বদলে ড্যাশ (-)
          .replace(/[^\w\-]+/g, "")   // স্পেশাল ক্যারেক্টার রিমুভ
          .replace(/\-\-+/g, "-")     // একাধিক ড্যাশ থাকলে একটি করা
          + "-" + Date.now()
      );
    };

    // 🟢 ইউনিক SKU জেনারেট করার লজিক (MongoServerError index: sku_1 Fix)
    const generateSku = () => {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      return `BSS-${Date.now()}-${randomNum}`;
    };

    const client = await clientPromise;
    const db = client.db();

    const newProduct = {
      title,
      slug: generateSlug(title),
      sku: sku || generateSku(), // 🟢 ইউনিক SKU ফিল্ড যুক্ত করা হলো
      category,
      price: sellPrice,
      costPrice: buyPrice,
      discountPrice: displayDiscountPrice,
      points: autoPoints,
      unit: unit || "1 Pcs",
      image: image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
      createdAt: new Date(),
    };

    const result = await db.collection("products").insertOne(newProduct);

    return NextResponse.json(
      { success: true, message: "Product created successfully", product: newProduct },
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