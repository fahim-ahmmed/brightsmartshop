import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";

globalThis.__PRODUCTS_SERVER_CACHE__ = globalThis.__PRODUCTS_SERVER_CACHE__ || null;
globalThis.__PRODUCTS_CACHE_TIME__ = globalThis.__PRODUCTS_CACHE_TIME__ || 0;

async function connectDB() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

// ১. সব প্রোডাক্ট লোড করা (GET)
export async function GET() {
  try {
    const now = Date.now();
    if (
      globalThis.__PRODUCTS_SERVER_CACHE__ &&
      now - globalThis.__PRODUCTS_CACHE_TIME__ < 300000
    ) {
      return NextResponse.json({
        success: true,
        count: globalThis.__PRODUCTS_SERVER_CACHE__.length,
        products: globalThis.__PRODUCTS_SERVER_CACHE__,
        cached: true,
      });
    }

    await connectDB();
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();

    globalThis.__PRODUCTS_SERVER_CACHE__ = products;
    globalThis.__PRODUCTS_CACHE_TIME__ = now;

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

// ২. নতুন প্রোডাক্ট সেভ করা (POST)
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
      isPopular: Boolean(body.isPopular), // 🟢 পপুলার স্ট্যাটাস সেভ
      isActive: body.isActive !== undefined ? body.isActive : true,
      isPermanent: body.isPermanent !== undefined ? body.isPermanent : true,
    });

    globalThis.__PRODUCTS_SERVER_CACHE__ = null;

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// 🟢 ৩. প্রোডাক্টের Popular স্ট্যাটাস অন/অফ করার API (PATCH)
export async function PATCH(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, isPopular } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      { $set: { isPopular: Boolean(isPopular) } },
      { new: true }
    );

    globalThis.__PRODUCTS_SERVER_CACHE__ = null;

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Update popular status error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// ৪. প্রোডাক্ট ডিলিট করা (DELETE)
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
    globalThis.__PRODUCTS_SERVER_CACHE__ = null;

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}