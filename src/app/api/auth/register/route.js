import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User"; // আপনার প্রজেক্টের User Mongoose Model (পাথ চেক করে নিবেন)
import bcrypt from "bcryptjs"; // অথবা আপনার প্রজেক্টের পাসওয়ার্ড হ্যাশিং প্যাকেজ

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, email, mobile, address, sponsorCode, password } = body;

    // ১. আবশ্যক ফিল্ড ভ্যালিডেশন
    if (!name || !email || !password || !address) {
      return NextResponse.json(
        { message: "Name, email, address, and password are required." },
        { status: 400 }
      );
    }

    // ২. আগের ইমেইল দিয়ে একাউন্ট আছে কিনা চেক
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email address already exists." },
        { status: 400 }
      );
    }

    // ৩. পাসওয়ার্ড হ্যাশ করা
    const hashedPassword = await bcrypt.hash(password, 10);

    // ৪. নতুন ক্লায়েন্ট একাউন্ট তৈরি
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      mobile: mobile || "",
      address,
      sponsorCode: sponsorCode || "",
      password: hashedPassword,
      role: "client",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful!",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}