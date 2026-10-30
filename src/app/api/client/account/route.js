import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";
import { ObjectId } from "mongodb";
import { ensureProfile, getCurrentUser, syncMissingProfiles } from "@/lib/current-user";

function buildUserQuery(targetUserId, fallbackIds = []) {
  const allIds = [...new Set([targetUserId, ...fallbackIds].filter(Boolean).map(String))];
  const or = [];

  for (const key of allIds) {
    const cleanDigits = key.replace(/^BSS-/i, "");
    const withBss = key.toUpperCase().startsWith("BSS-")
      ? key.toUpperCase()
      : `BSS-${cleanDigits}`;

    if (ObjectId.isValid(key)) {
      or.push({ _id: new ObjectId(key) });
    }
    or.push(
      { _id: key },
      { id: key },
      { id: withBss },
      { customerId: withBss },
      { authUserId: key },
      { referralCode: key },
      { referralCode: withBss },
      { referralCode: cleanDigits },
      { phone: key },
      { mobile: key }
    );
  }

  return or.length > 0 ? { $or: or } : null;
}

// ১. ইউজারের কারেন্ট প্রোফাইল ডাটা পাওয়া (GET)
export async function GET(req) {
  try {
    await syncMissingProfiles().catch(() => null);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const current = await getCurrentUser(req).catch(() => null);

    const fallbackIds = [
      current?.legacy?._id,
      current?.authUser?.id,
      current?.authUser?._id,
    ];

    const query = buildUserQuery(userId, fallbackIds);
    if (!query) {
      return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("users").findOne(query, { projection: { password: 0 } });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ২. প্রোফাইল পিকচার, নাম/তথ্য ও রেজিস্ট্রেশনের সময় স্পন্সর কোড ও BSS ID সেভ করা (PUT ও PATCH)
export async function PUT(req) {
  try {
    const body = await req.json();
    const current = await getCurrentUser(req).catch(() => null);

    const {
      userId,
      id,
      _id,
      name,
      phone,
      mobile,
      profileImage,
      address,
      sponsorCode,
      sponsorId,
      password,
    } = body;

    const targetUserId = userId || id || _id || phone || mobile;

    // নতুন রেজিস্টার করা ইউজারের জন্য প্রথমেই প্রোফাইল ও সিকোয়েন্স BSS- আইডি নিশ্চিত করা
    if (targetUserId) {
      await ensureProfile(targetUserId).catch(() => null);
    }
    await syncMissingProfiles().catch(() => null);

    const fallbackIds = [
      current?.legacy?._id,
      current?.authUser?.id,
      current?.authUser?._id,
      phone,
      mobile,
    ];

    const query = buildUserQuery(targetUserId, fallbackIds);
    if (!query) {
      return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const updateFields = {
      updatedAt: new Date(),
    };

    if (name !== undefined && String(name).trim() !== "") updateFields.name = String(name).trim();
    if (phone !== undefined || mobile !== undefined) {
      const cleanPhone = String(phone || mobile).trim();
      if (cleanPhone) {
        updateFields.phone = cleanPhone;
        updateFields.mobile = cleanPhone;
      }
    }
    if (profileImage !== undefined) {
      updateFields.profileImage = profileImage;
      updateFields.image = profileImage;
    }
    if (address !== undefined) updateFields.address = address;
    if (password !== undefined && String(password).trim() !== "") {
      updateFields.password = String(password).trim();
      updateFields.rawPassword = String(password).trim();
    }

    // স্পন্সর কোড দেওয়া থাকলে সঠিক BSS- ফরম্যাটে সেভ করা
    const rawSp = String(sponsorCode || sponsorId || "").trim();
    if (rawSp) {
      const formattedSp = rawSp.toUpperCase().startsWith("BSS-")
        ? rawSp.toUpperCase()
        : rawSp.toUpperCase().startsWith("BSS")
        ? `BSS-${rawSp.slice(3)}`
        : `BSS-${rawSp}`;

      // স্পন্সর ইউজারকে খুঁজে তার আসল BSS- কোড বসানো
      const spClean = formattedSp.replace(/^BSS-/i, "");
      const spDoc = await db.collection("users").findOne({
        $or: [
          { referralCode: formattedSp },
          { referralCode: spClean },
          { customerId: formattedSp },
          { phone: rawSp },
        ],
      });
      const finalSponsorCode = spDoc?.referralCode || formattedSp;
      updateFields.sponsorCode = finalSponsorCode;
      updateFields.sponsorId = finalSponsorCode;
      updateFields.referredBy = finalSponsorCode;
    }

    const existingProfile = await db.collection("users").findOne(query);
    await db.collection("users").updateMany(query, { $set: updateFields });

    const updatedProfile = await db.collection("users").findOne(query);

    const authIdStr =
      existingProfile?.authUserId ||
      updatedProfile?.authUserId ||
      (current?.authUser?.id ? String(current.authUser.id) : null);

    if (authIdStr) {
      const authQuery = ObjectId.isValid(authIdStr)
        ? { $or: [{ _id: new ObjectId(authIdStr) }, { _id: authIdStr }, { id: authIdStr }] }
        : { $or: [{ _id: authIdStr }, { id: authIdStr }] };

      const authUpdate = { updatedAt: new Date() };
      if (updateFields.name) authUpdate.name = updateFields.name;
      if (updateFields.phone) authUpdate.mobile = updateFields.phone;
      if (profileImage !== undefined) authUpdate.image = profileImage;
      if (address !== undefined) authUpdate.address = address;
      if (updateFields.sponsorCode) authUpdate.sponsorCode = updateFields.sponsorCode;
      if (updatedProfile?.referralCode) {
        authUpdate.referralCode = updatedProfile.referralCode;
        authUpdate.customerId = updatedProfile.referralCode;
      }

      await db.collection("user").updateMany(authQuery, { $set: authUpdate }).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      message: "প্রোফাইল সফলভাবে আপডেট করা হয়েছে!",
      user: updatedProfile,
      updatedUser: updateFields,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export const PATCH = PUT;
export const dynamic = "force-dynamic";