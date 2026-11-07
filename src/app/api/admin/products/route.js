import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";

export const dynamic = "force-dynamic"; // 🟢 Vercel Build Error Fix (ক্যাশ ও বিল্ড-টাইম রেন্ডারিং বন্ধ করবে)

// 🟢 সার্ভার র‍্যামে স্থায়ী ক্যাশ (কখনোই মুছে যাবে না, সরাসরি মেমোরিতে আপডেট হবে)
globalThis.__PRODUCTS_SERVER_CACHE__ = globalThis.__PRODUCTS_SERVER_CACHE__ || null;

async function connectDB() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

// ১. সুপার-ফাস্ট প্রোডাক্ট লোড API (0ms Server Memory Response)
export async function GET() {
  try {
    // র‍্যামে ডাটা থাকলে ডাটাবেসে না গিয়ে ০ মিলিসেকেন্ডে সাথে সাথে পাঠাবে
    if (globalThis.__PRODUCTS_SERVER_CACHE__) {
      return NextResponse.json(
        {
          success: true,
          count: globalThis.__PRODUCTS_SERVER_CACHE__.length,
          products: globalThis.__PRODUCTS_SERVER_CACHE__,
          cached: true,
        },
        {
          headers: {
            "Cache-Control": "public, max-age=5, stale-while-revalidate=60",
          },
        }
      );
    }

    await connectDB();
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();
    globalThis.__PRODUCTS_SERVER_CACHE__ = products;

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Fetch products error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// ২. নতুন প্রোডাক্ট সেভ ও র‍্যামে সাথে সাথে যুক্ত করা (POST)
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.title || !body.price || !body.category) {
      return NextResponse.json(
        { success: false, message: "Title, Price and Category are required" },
        { status: 400 }
      );
    }

    let slug = body.slug;
    if (!slug) {
      const baseSlug = body.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const cost = Number(body.costPrice || body.buyingPrice || 0);

    const newProduct = await Product.create({
      title: body.title,
      slug: slug,
      category: body.category,
      categoryName: body.categoryName || body.category,
      subCategory: body.subCategory || "",
      subCategoryName: body.subCategoryName || body.subCategory || "",
      price: Number(body.price),
      buyingPrice: cost,
      costPrice: cost,
      originalPrice: Number(body.originalPrice || body.price),
      discountPrice: Number(body.discountPrice || 0),
      points: Math.floor(Number(body.points || 0)),
      unit: body.unit || "1 Pcs",
      stock: Number(body.stock || 100),
      image: body.image || "📦",
      description: body.description || "",
      isPopular: Boolean(body.isPopular),
      isComboPackage: Boolean(body.isComboPackage),
      isActive: body.isActive !== undefined ? body.isActive : true,
      isPermanent: body.isPermanent !== undefined ? body.isPermanent : true,
    });

    const plainProduct = newProduct.toObject();

    // ক্যাশ মুছে না ফেলে সরাসরি র‍্যামের লিস্টে নতুন প্রোডাক্ট ঢুকিয়ে দেওয়া
    if (globalThis.__PRODUCTS_SERVER_CACHE__) {
      globalThis.__PRODUCTS_SERVER_CACHE__ = [
        plainProduct,
        ...globalThis.__PRODUCTS_SERVER_CACHE__,
      ];
    }

    return NextResponse.json({ success: true, product: plainProduct });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// ৩. প্রোডাক্ট আপডেট (PATCH)
//    - { id, isPopular }                      → শুধু Popular স্ট্যাটাস টগল (পুরনো বাটন)
//    - { id, title, price, ... }              → সম্পূর্ণ প্রোডাক্ট এডিট (এডমিন Edit মডাল)
//    body-তে যে ফিল্ডগুলোই আসবে শুধু সেগুলোই আপডেট হবে, তাই অন্য কিছু ভাঙবে না।
const PATCH_NUMBER_FIELDS = [
  "price",
  "buyingPrice",
  "costPrice",
  "originalPrice",
  "discountPrice",
  "stock",
];
const PATCH_BOOLEAN_FIELDS = [
  "isPopular",
  "isComboPackage",
  "isActive",
  "isPermanent",
];
const PATCH_STRING_FIELDS = [
  "title",
  "slug",
  "category",
  "categoryName",
  "subCategory",
  "subCategoryName",
  "unit",
  "description",
  "image",
];

export async function PATCH(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    const updates = {};

    for (const field of PATCH_STRING_FIELDS) {
      if (body[field] !== undefined) {
        updates[field] = String(body[field]).trim();
      }
    }

    for (const field of PATCH_NUMBER_FIELDS) {
      if (body[field] !== undefined) {
        const num = Number(body[field]);
        if (Number.isNaN(num) || num < 0) {
          return NextResponse.json(
            { success: false, message: `${field} must be a valid positive number` },
            { status: 400 }
          );
        }
        updates[field] = num;
      }
    }

    for (const field of PATCH_BOOLEAN_FIELDS) {
      if (body[field] !== undefined) {
        updates[field] = Boolean(body[field]);
      }
    }

    // 🟢 পয়েন্ট সবসময় পূর্ণ সংখ্যা
    if (body.points !== undefined) {
      updates.points = Math.floor(Number(body.points) || 0);
    }

    // বাইং প্রাইস দিলে costPrice-ও সিঙ্ক থাকবে (POST-এর মতো একই আচরণ)
    if (updates.buyingPrice !== undefined && updates.costPrice === undefined) {
      updates.costPrice = updates.buyingPrice;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "No fields to update" },
        { status: 400 }
      );
    }

    // 🟢 টাইটেল দিয়ে slug বদলানো হবে না — পুরনো লিংক ভাঙা যাবে না
    delete updates.slug;

    const updated = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // র‍্যাম ক্যাশে সাথে সাথে আপডেট → রিলোড ছাড়াই লাইভ সাইটে নতুন দাম দেখাবে
    if (globalThis.__PRODUCTS_SERVER_CACHE__) {
      globalThis.__PRODUCTS_SERVER_CACHE__ = globalThis.__PRODUCTS_SERVER_CACHE__.map(
        (p) => (String(p._id) === String(id) ? { ...p, ...updated } : p)
      );
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// ৪. প্রোডাক্ট ডিলিট ও র‍্যাম থেকে সাথে সাথে সরানো (DELETE)
export async function DELETE(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    await Product.findByIdAndDelete(id);

    if (globalThis.__PRODUCTS_SERVER_CACHE__) {
      globalThis.__PRODUCTS_SERVER_CACHE__ = globalThis.__PRODUCTS_SERVER_CACHE__.filter(
        (p) => String(p._id) !== String(id)
      );
    }

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}