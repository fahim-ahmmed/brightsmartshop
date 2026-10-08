"use server";

import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

/**
 * Admin Action: Create Product with Local File Upload
 */
export async function createProductWithFileUpload(formData) {
  try {
    await dbConnect();

    const name = formData.get("name");
    const price = Number(formData.get("price"));
    const originalPrice = formData.get("originalPrice") ? Number(formData.get("originalPrice")) : undefined;
    const category = formData.get("category");
    const description = formData.get("description");
    const stock = formData.get("stock") ? Number(formData.get("stock")) : 100;
    const isFeatured = formData.get("isFeatured") === "true";

    // 1. Get image file or direct URL input
    const imageFile = formData.get("imageFile");
    const imageUrlInput = formData.get("imageUrl");

    let finalImageUrl = "/hero1.jpg"; // Default fallback

    // 2. Upload local image file if present
    if (imageFile && imageFile.size > 0 && imageFile.name !== "undefined") {
      try {
        finalImageUrl = await uploadImageToCloudinary(imageFile);
      } catch (err) {
        console.error("Local file upload failed, fallback to default", err);
      }
    } else if (imageUrlInput && imageUrlInput.trim() !== "") {
      finalImageUrl = imageUrlInput.trim();
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + "-" + Date.now();

    // 3. Save permanently to MongoDB
    const newProduct = await Product.create({
      name,
      slug,
      price,
      originalPrice,
      category,
      image: finalImageUrl,
      description,
      stock,
      isFeatured,
      isActive: true,
    });

    revalidatePath("/shop");
    revalidatePath("/");
    revalidatePath("/admin/products");

    return { 
      success: true, 
      message: "প্রোডাক্ট এবং ছবি সফলভাবে লোকাল ডিভাইস থেকে আপলোড ও সেভ করা হয়েছে!", 
      product: JSON.parse(JSON.stringify(newProduct)) 
    };
  } catch (error) {
    console.error("Error uploading product:", error);
    return { success: false, error: error.message || "Failed to create product" };
  }
}