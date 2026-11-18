import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongo-client";

export const dynamic = "force-dynamic";

const COOLDOWN_DAYS = 90;

function computeEligibility(lastDonationDate) {
  if (!lastDonationDate) {
    return { isEligible: true, daysSinceDonation: null, daysRemaining: 0 };
  }
  const last = new Date(lastDonationDate);
  if (Number.isNaN(last.getTime())) {
    return { isEligible: true, daysSinceDonation: null, daysRemaining: 0 };
  }
  const diffMs = Date.now() - last.getTime();
  const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, COOLDOWN_DAYS - daysSince);
  return {
    isEligible: daysSince >= COOLDOWN_DAYS,
    daysSinceDonation: daysSince,
    daysRemaining,
  };
}

function maskPhone(phone = "") {
  const s = String(phone).trim();
  if (s.length < 7) return s;
  return `${s.slice(0, 5)}***${s.slice(-3)}`;
}

// GET: সব ডোনার অথবা নির্দিষ্ট ব্লাড গ্রুপ / এলাকা অনুযায়ী ফিল্টার
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const search = (searchParams.get("search") || "").trim();
    const isAdmin = searchParams.get("admin") === "true";

    const client = await clientPromise;
    const db = client.db();

    const query = {};
    if (bloodGroup && bloodGroup !== "All") {
      query.bloodGroup = bloodGroup;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const rawDonors = await db
      .collection("blood_donors")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const donors = rawDonors.map((d) => {
      const eligibility = computeEligibility(d.lastDonationDate);
      return {
        _id: String(d._id),
        name: d.name,
        address: d.address,
        bloodGroup: d.bloodGroup,
        phone: isAdmin ? d.phone : maskPhone(d.phone),
        lastDonationDate: d.lastDonationDate || null,
        totalDonations: Number(d.totalDonations || 0),
        status: d.status || "Active",
        createdAt: d.createdAt,
        ...eligibility,
      };
    });

    return NextResponse.json({ success: true, donors });
  } catch (error) {
    console.error("[blood-bank/donors GET]", error);
    return NextResponse.json(
      { success: false, message: "ডোনার তালিকা লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

// POST: নতুন ডোনার রেজিস্ট্রেশন
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, address, phone, bloodGroup, lastDonationDate } = body;

    if (!name?.trim() || !address?.trim() || !phone?.trim() || !bloodGroup?.trim()) {
      return NextResponse.json(
        { success: false, message: "অনুগ্রহ করে নাম, ঠিকানা, ফোন নম্বর ও রক্তের গ্রুপ পূরণ করুন।" },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).trim();
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("blood_donors");

    const existing = await col.findOne({ phone: cleanPhone });
    if (existing) {
      await col.updateOne(
        { _id: existing._id },
        {
          $set: {
            name: name.trim(),
            address: address.trim(),
            bloodGroup: bloodGroup.trim(),
            lastDonationDate: lastDonationDate || null,
            updatedAt: new Date(),
          },
        }
      );
      return NextResponse.json({
        success: true,
        message: "আপনার ডোনার প্রোফাইল সফলভাবে আপডেট হয়েছে!",
        donorId: String(existing._id),
      });
    }

    const doc = {
      name: name.trim(),
      address: address.trim(),
      phone: cleanPhone,
      bloodGroup: bloodGroup.trim(),
      lastDonationDate: lastDonationDate || null,
      totalDonations: lastDonationDate ? 1 : 0,
      status: "Active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await col.insertOne(doc);
    return NextResponse.json(
      {
        success: true,
        message: "অভিনন্দন! আপনি সফলভাবে রক্তদাতা হিসেবে রেজিস্টার হয়েছেন।",
        donor: { ...doc, _id: String(result.insertedId) },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[blood-bank/donors POST]", error);
    return NextResponse.json(
      { success: false, message: "ডোনার রেজিস্ট্রেশন সম্পন্ন করা যায়নি।" },
      { status: 500 }
    );
  }
}

// PATCH: অ্যাডমিন ডোনারের তথ্য/শেষ রক্তদানের তারিখ আপডেট করবে
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, lastDonationDate, status } = body;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "সঠিক ডোনার আইডি পাওয়া যায়নি।" }, { status: 400 });
    }

    const update = { updatedAt: new Date() };
    if (lastDonationDate !== undefined) update.lastDonationDate = lastDonationDate || null;
    if (status !== undefined) update.status = status;

    const client = await clientPromise;
    const db = client.db();
    await db.collection("blood_donors").updateOne({ _id: new ObjectId(id) }, { $set: update });

    return NextResponse.json({ success: true, message: "ডোনার তথ্য আপডেট করা হয়েছে।" });
  } catch (error) {
    console.error("[blood-bank/donors PATCH]", error);
    return NextResponse.json({ success: false, message: "আপডেট করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

// DELETE: অ্যাডমিন ডোনার রিমুভ করবে
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "সঠিক আইডি পাওয়া যায়নি।" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    await db.collection("blood_donors").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: "ডোনার তালিকা থেকে মুছে ফেলা হয়েছে।" });
  } catch (error) {
    console.error("[blood-bank/donors DELETE]", error);
    return NextResponse.json({ success: false, message: "ডিলিট করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}