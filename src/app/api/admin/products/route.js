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

// ৩. প্রোডাক্টের Popular স্ট্যাটাস অন/অফ ও র‍্যাম আপডেট (PATCH)
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
    ).lean();

    if (globalThis.__PRODUCTS_SERVER_CACHE__ && updated) {
      globalThis.__PRODUCTS_SERVER_CACHE__ = globalThis.__PRODUCTS_SERVER_CACHE__.map(
        (p) => (String(p._id) === String(id) ? updated : p)
      );
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Update popular status error:", error);
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