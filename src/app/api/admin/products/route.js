import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";

// 1. Get All Permanent Products
export async function GET() {
  try {
    await dbConnect().catch((err) => console.log("DB Connect Warning:", err));

    // Fetch all products permanently from database
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      count: products.length,
      products: products,
    });
  } catch (error) {
    console.error("Fetch Products API Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch products from database" },
      { status: 500 }
    );
  }
}

// 2. Upload New Product Permanently
export async function POST(req) {
  try {
    await dbConnect().catch((err) => console.log("DB Connect Warning:", err));

    const body = await req.json();
    const { title, price, points, category, description, image, stock } = body;

    if (!title || !price || !category) {
      return NextResponse.json(
        { message: "Title, Price, and Category are required." },
        { status: 400 }
      );
    }

    // Generate Unique Slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") + "-" + Date.now();

    // Create & Save Product Permanently
    const newProduct = await Product.create({
      title,
      slug,
      price: Number(price),
      points: Number(points) || 0,
      category,
      description: description || "",
      image: image || "📦",
      stock: Number(stock) || 100,
      isActive: true,
      isPermanent: true,
    });

    return NextResponse.json(
      {
        message: "Product uploaded and permanently saved in database!",
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload Product API Error:", error);
    return NextResponse.json(
      { message: "Failed to upload product." },
      { status: 500 }
    );
  }
}