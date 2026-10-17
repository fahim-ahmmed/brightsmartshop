import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";

// 🟢 ১. অ্যাডমিন ড্যাশবোর্ডের জন্য সমস্ত প্রোডাক্ট ফেচ করার GET মেথড
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // সাইটের প্রোডাক্টগুলো যে কালেকশনে সেভ হয় (সাধারণত "products")
    const products = await db.collection("products").find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, products }, { status: 200 });
  } catch (error) {
    console.error("Fetch products API error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// 🟢 ২. নতুন প্রোডাক্ট তৈরির POST মেথড
export async function POST(req) {
  try {
    const body = await req.json();
    const { title, category, price, costPrice, discountPrice, unit, image, sku, stock, description } = body;

    const sellPrice = Number(price) || 0;
    const buyPrice = Number(costPrice) || 0;
    const displayDiscountPrice = Number(discountPrice) || 0;
    const productStock = Number(stock) || 10;

    const profit = Math.max(0, sellPrice - buyPrice);
    const autoPoints = Number((profit / 2.25).toFixed(2));

    const generateSlug = (text) => {
      if (!text) return `product-${Date.now()}`;
      return (
        text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^\w\-]+/g, "")
          .replace(/\-\-+/g, "-")
          + "-" + Date.now()
      );
    };

    const generateSku = () => {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      return `BSS-${Date.now()}-${randomNum}`;
    };

    const client = await clientPromise;
    const db = client.db();

    const newProduct = {
      title,
      slug: generateSlug(title),
      sku: sku && sku.trim() !== "" ? sku : generateSku(),
      category: category || "General",
      price: sellPrice,
      costPrice: buyPrice,
      originalPrice: buyPrice,
      discountPrice: displayDiscountPrice,
      points: autoPoints,
      unit: unit || "1 Pcs",
      stock: productStock,
      description: description || "",
      image: image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
      createdAt: new Date(),
    };

    const result = await db.collection("products").insertOne(newProduct);

    const savedProduct = {
      ...newProduct,
      _id: result.insertedId,
    };

    return NextResponse.json(
      { success: true, message: "Product created successfully", product: savedProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}

// 🟢 ৩. প্রোডাক্ট ডিলিট করার DELETE মেথড
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, message: "Product ID required" }, { status: 400 });
    }

    const { ObjectId } = require("mongodb");
    const client = await clientPromise;
    const db = client.db();

    await db.collection("products").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete product API error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}