import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic"; // 🟢 Vercel Build Error Fix (ক্যাশ ও বিল্ড-টাইম রেন্ডারিং বন্ধ করবে)

// সমস্ত ক্যাটাগরি ও সাব-ক্যাটাগরি ফেচ করার GET মেথড
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const categories = await db.collection("categories").find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, categories }, { status: 200 });
  } catch (error) {
    console.error("Fetch categories error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// নতুন ক্যাটাগরি বা সাব-ক্যাটাগরি তৈরি করার POST মেথড
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, parentCategory, slug, image, icon } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Category name is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("categories");

    // ইউনিক স্লাগ তৈরি (যদি না দেওয়া থাকে)
    const categorySlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    // চেক করা এই স্লাগ দিয়ে অলরেডি কোনো ক্যাটাগরি আছে কি না
    const existing = await collection.findOne({ slug: categorySlug });
    if (existing) {
      return NextResponse.json({ success: false, message: "This category already exists!" }, { status: 400 });
    }

    const newCategory = {
      name: name.trim(),
      slug: categorySlug,
      parentCategory: parentCategory || null, // মূল ক্যাটাগরি হলে null, সাব হলে প্যারেন্টের ID থাকবে
      image: image || "/hero1.jpg",           // ছবি সেভ করার ফিল্ড যুক্ত করা হয়েছে
      icon: icon || "📁",
      createdAt: new Date(),
    };

    const result = await collection.insertOne(newCategory);

    return NextResponse.json({
      success: true,
      message: "Category created permanently!",
      categoryId: result.insertedId,
      category: newCategory,
    }, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ক্যাটাগরি ডিলিট করার DELETE মেথড
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "Category ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    await db.collection("categories").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: "Category deleted successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}