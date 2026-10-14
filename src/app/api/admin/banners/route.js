import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";
import { ObjectId } from "mongodb";

// ১. সকল ব্যানার রিড করা (GET)
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const banners = await db.collection("banners").find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, banners });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ২. নতুন ব্যানার সেভ করা (POST)
export async function POST(req) {
  try {
    const body = await req.json();
    const { title, subtitle, link, image } = body;

    if (!image) {
      return NextResponse.json({ success: false, message: "Banner image is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const newBanner = {
      title: title || "Hero Banner",
      subtitle: subtitle || "",
      link: link || "/shop",
      image,
      isActive: true,
      createdAt: new Date(),
    };

    const result = await db.collection("banners").insertOne(newBanner);

    return NextResponse.json({ success: true, banner: newBanner, id: result.insertedId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ৩. স্ট্যাটাস অন/অফ করা (PATCH)
export async function PATCH(req) {
  try {
    const { id, isActive } = await req.json();

    const client = await clientPromise;
    const db = client.db();

    await db.collection("banners").updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: Boolean(isActive) } }
    );

    return NextResponse.json({ success: true, message: "Banner status updated" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ৪. ব্যানার ডিলিট করা (DELETE)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "Banner ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    await db.collection("banners").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}