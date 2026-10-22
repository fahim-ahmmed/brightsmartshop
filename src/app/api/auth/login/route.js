import { NextResponse } from "next/server";
import dbConnect from "@/lib/db"; // আপনার প্রজেক্টের MongoDB সংযোগ ফাইল
import User from "@/models/User"; // আপনার User মডেল

export async function POST(req) {
  try {
    await dbConnect();
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "অনুগ্রহ করে ইমেইল/ফোন/আইডি এবং পাসওয়ার্ড প্রদান করুন।" },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim();

    // Search user by Email, Phone number, or User ID / Member ID
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { phone: cleanIdentifier },
        { userId: cleanIdentifier },
        { memberId: cleanIdentifier },
        { id: cleanIdentifier },
      ],
    });

    if (!user) {
      return NextResponse.json(
        { message: "এই তথ্য অনুযায়ী কোনো অ্যাকাউন্ট পাওয়া যায়নি!" },
        { status: 404 }
      );
    }

    // Verify Password (BCrypt check if you use bcrypt or direct match)
    // Example using standard comparison or model instance method:
    const isPasswordValid = user.password === password; // or await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "পাসওয়ার্ড সঠিক নয়!" },
        { status: 401 }
      );
    }

    // Session / Cookie creation logic here if applicable
    return NextResponse.json(
      {
        message: "লগইন সফল হয়েছে!",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          userId: user.userId || user.memberId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Multi-identifier Login API Error:", error);
    return NextResponse.json(
      { message: "সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
