import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";

export async function POST(req) {
  try {
    await dbConnect().catch((err) => console.log("DB Connect Warning:", err));

    const body = await req.json();
    const { productName, category, estimatedBudget, contactNumber, description } = body;

    if (!productName || !contactNumber) {
      return NextResponse.json(
        { message: "পণ্যের নাম এবং মোবাইল নম্বর আবশ্যক।" },
        { status: 400 }
      );
    }

    // Return Success Response (Admin can access this entry from Database)
    return NextResponse.json(
      {
        message: "Product request submitted successfully.",
        data: {
          productName,
          category,
          estimatedBudget,
          contactNumber,
          description,
          status: "Pending",
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Product Request API Error:", error);
    return NextResponse.json(
      { message: "আবেদন গ্রহণ করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}