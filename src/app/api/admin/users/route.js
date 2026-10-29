import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/mongo-client";
import { auth } from "@/lib/auth";
import { requireAdmin, syncMissingProfiles } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
const ROLE_MAP = { customer: "user", user: "user", admin: "admin", "sub-admin": "sub-admin" };

function idFilter(id) {
  const key = String(id);
  const or = [{ _id: key }, { authUserId: key }];
  if (ObjectId.isValid(key)) or.unshift({ _id: new ObjectId(key) });
  return { $or: or };
}

export async function GET(req) {
  try {
    if (!(await requireAdmin(req))) return deny();
    await syncMissingProfiles();

    // অ্যাডমিন যাতে ইউজারের পাসওয়ার্ড দেখতে ও এডিট করতে পারে সেজন্য password ফিল্ড রাখা হয়েছে
    const users = await db
      .collection("users")
      .find({ role: { $not: /^admin$/i } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    if (!(await requireAdmin(req))) return deny();

    const { userId, name, phone, password, role } = await req.json();
    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    const profile = await db.collection("users").findOne(idFilter(userId));
    if (!profile) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const set = { updatedAt: new Date() };
    const authSet = {};
    if (name !== undefined) {
      set.name = String(name).trim();
      authSet.name = set.name;
    }
    if (phone !== undefined) {
      set.phone = String(phone).trim();
      set.mobile = set.phone;
      authSet.mobile = set.phone;
    }
    if (password !== undefined && String(password).trim() !== "") {
      const cleanPass = String(password).trim();
      set.password = cleanPass;
      set.rawPassword = cleanPass;
      authSet.password = cleanPass;
      authSet.rawPassword = cleanPass;
    }
    if (role !== undefined && !profile.isSystemFounder) {
      const mapped = ROLE_MAP[String(role).toLowerCase()];
      if (mapped) {
        set.role = role;
        authSet.role = mapped;
      }
    }

    // লগইন অ্যাকাউন্ট ('user' ও 'account' কালেকশন) খুঁজে বের করা
    let authDoc = null;
    if (profile.authUserId && ObjectId.isValid(profile.authUserId)) {
      authDoc = await db.collection("user").findOne({ _id: new ObjectId(profile.authUserId) });
    }
    if (!authDoc && (set.phone || profile.phone)) {
      const targetPhone = set.phone || profile.phone;
      authDoc = await db.collection("user").findOne({
        $or: [
          { mobile: targetPhone },
          { email: `${targetPhone}@brightsmartshop.local` },
        ],
      });
    }

    if (authDoc) {
      const authId = authDoc._id;
      if (set.phone && authDoc.email?.endsWith("@brightsmartshop.local")) {
        authSet.email = `${set.phone}@brightsmartshop.local`;
      }
      if (Object.keys(authSet).length) {
        await db.collection("user").updateOne({ _id: authId }, { $set: { ...authSet, updatedAt: new Date() } });
      }

      // 🟢 যদি নতুন পাসওয়ার্ড দেওয়া হয়, তবে Better Auth-এর 'account' কালেকশনে হ্যাশ করে আপডেট করা যাতে নতুন পাসওয়ার্ড দিয়ে লগইন কাজ করে
      if (set.password) {
        const ctx = await auth.$context;
        const hashedPassword = await ctx.password.hash(set.password);

        const accFilter = {
          $or: [{ userId: authId }, { userId: String(authId) }],
        };
        const existingAcc = await db.collection("account").findOne(accFilter);

        if (existingAcc) {
          await db.collection("account").updateMany(accFilter, {
            $set: { password: hashedPassword, updatedAt: new Date() },
          });
        } else {
          await db.collection("account").insertOne({
            userId: authId,
            accountId: String(authId),
            providerId: "credential",
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    await db.collection("users").updateOne({ _id: profile._id }, { $set: set });

    return NextResponse.json({ success: true, message: "ইউজারের তথ্য ও পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!" });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ success: false, message: "এই মোবাইল নম্বর আগে থেকেই ব্যবহৃত" }, { status: 400 });
    }
    console.error("Update user error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    if (!(await requireAdmin(req))) return deny();

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    const profile = await db.collection("users").findOne(idFilter(id));
    if (!profile) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }
    if (profile.isSystemFounder) {
      return NextResponse.json({ success: false, message: "টপ আইডি ডিলিট করা যাবে না" }, { status: 403 });
    }

    // লগইন অ্যাকাউন্টও মুছতে হবে, নইলে সে আবার লগইন করে প্রোফাইল ফিরিয়ে আনবে
    if (profile.authUserId && ObjectId.isValid(profile.authUserId)) {
      const aid = new ObjectId(profile.authUserId);
      const either = { $or: [{ userId: aid }, { userId: String(aid) }] };
      await db.collection("user").deleteOne({ _id: aid });
      await db.collection("account").deleteMany(either);
      await db.collection("session").deleteMany(either);
    }
    await db.collection("users").deleteOne({ _id: profile._id });

    return NextResponse.json({ success: true, message: "User deleted successfully!" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}