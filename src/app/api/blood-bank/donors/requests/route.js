import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongo-client";

export const dynamic = "force-dynamic";

// GET: অ্যাডমিন প্যানেলের জন্য সব ব্লাড রিকোয়েস্ট তালিকা
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";

    const client = await clientPromise;
    const db = client.db();

    const query = {};
    if (status && status !== "All") {
      query.status = status;
    }

    const requests = await db
      .collection("blood_requests")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => ({ ...r, _id: String(r._id) })),
    });
  } catch (error) {
    console.error("[blood-bank/requests GET]", error);
    return NextResponse.json(
      { success: false, message: "রিকোয়েস্ট তালিকা লোড করা যায়নি।" },
      { status: 500 }
    );
  }
}

// POST: রিসিভারের পক্ষ থেকে নির্দিষ্ট ডোনারের কাছে রক্তের রিকোয়েস্ট পাঠানো
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      donorId,
      patientName,
      patientCondition,
      phone,
      hemoglobin,
      reason,
      bloodGroup,
    } = body;

    if (!patientName?.trim() || !patientCondition?.trim() || !phone?.trim() || !reason?.trim()) {
      return NextResponse.json(
        { success: false, message: "রোগীর নাম, বর্তমান অবস্থা, ফোন নম্বর ও রক্ত দেওয়ার কারণ আবশ্যক।" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // ডোনারের আসল তথ্য ডাটাবেজ থেকে নিয়ে রিকোয়েস্টের সাথে যুক্ত করা (অ্যাডমিনের সুবিধার্থে)
    let donorDoc = null;
    if (donorId && ObjectId.isValid(donorId)) {
      donorDoc = await db.collection("blood_donors").findOne({ _id: new ObjectId(donorId) });
    }

    const hbNum = parseFloat(hemoglobin);
    const isUrgent =
      String(patientCondition).toLowerCase().includes("critical") ||
      String(patientCondition).toLowerCase().includes("emergency") ||
      String(patientCondition).includes("জরুরি") ||
      (!Number.isNaN(hbNum) && hbNum <= 8);

    const requestDoc = {
      donorId: donorDoc ? String(donorDoc._id) : donorId || "",
      donorName: donorDoc?.name || body.donorName || "Any Available Donor",
      donorPhone: donorDoc?.phone || "",
      donorAddress: donorDoc?.address || "",
      bloodGroup: donorDoc?.bloodGroup || bloodGroup || "Unknown",
      patientName: patientName.trim(),
      patientCondition: patientCondition.trim(),
      requesterPhone: String(phone).trim(),
      hemoglobin: String(hemoglobin || "").trim(),
      reason: reason.trim(),
      isUrgent,
      status: "Pending", // Pending | Approved | Completed | Rejected
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("blood_requests").insertOne(requestDoc);

    return NextResponse.json(
      {
        success: true,
        message: "আপনার রক্তের রিকোয়েস্টটি সফলভাবে অ্যাডমিন প্যানেলে পাঠানো হয়েছে! শীঘ্রই যোগাযোগ করা হবে।",
        request: { ...requestDoc, _id: String(result.insertedId) },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[blood-bank/requests POST]", error);
    return NextResponse.json(
      { success: false, message: "রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

// PATCH: অ্যাডমিন রিকোয়েস্টের স্ট্যাটাস পরিবর্তন করবে (Completed হলে ডোনারের শেষ রক্তদানের তারিখ অটো-আপডেট হবে)
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !ObjectId.isValid(id) || !status) {
      return NextResponse.json({ success: false, message: "সঠিক তথ্য প্রদান করুন।" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const reqCol = db.collection("blood_requests");

    const existingReq = await reqCol.findOne({ _id: new ObjectId(id) });
    if (!existingReq) {
      return NextResponse.json({ success: false, message: "রিকোয়েস্ট পাওয়া যায়নি।" }, { status: 404 });
    }

    await reqCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    // যদি স্ট্যাটাস Completed করা হয় এবং ডোনার আইডি থাকে, তবে ডোনারের শেষ রক্তদানের তারিখ আজকের তারিখ সেট হবে
    if (status === "Completed" && existingReq.donorId && ObjectId.isValid(existingReq.donorId)) {
      const todayIso = new Date().toISOString().split("T")[0];
      await db.collection("blood_donors").updateOne(
        { _id: new ObjectId(existingReq.donorId) },
        {
          $set: { lastDonationDate: todayIso, updatedAt: new Date() },
          $inc: { totalDonations: 1 },
        }
      );
    }

    return NextResponse.json({ success: true, message: `স্ট্যাটাস "${status}" হিসেবে আপডেট হয়েছে।` });
  } catch (error) {
    console.error("[blood-bank/requests PATCH]", error);
    return NextResponse.json({ success: false, message: "স্ট্যাটাস আপডেট করা যায়নি।" }, { status: 500 });
  }
}

// DELETE: রিকোয়েস্ট ডিলিট করা
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "সঠিক আইডি পাওয়া যায়নি।" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    await db.collection("blood_requests").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: "রিকোয়েস্ট মুছে ফেলা হয়েছে।" });
  } catch (error) {
    console.error("[blood-bank/requests DELETE]", error);
    return NextResponse.json({ success: false, message: "ডিলিট করা যায়নি।" }, { status: 500 });
  }
}