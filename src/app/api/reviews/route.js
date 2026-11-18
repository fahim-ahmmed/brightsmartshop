import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongo-client";

export const dynamic = "force-dynamic";

// প্রথমবার ডেটাবেজ খালি থাকলে এই ৭টি রিভিউ অটোমেটিক সেভ হয়ে ওয়েবসাইট ও অ্যাপে দেখাবে
const INITIAL_REVIEWS = [
  {
    name: "তানজিলা আক্তার মিম",
    address: "মিরপুর-১০, ঢাকা",
    rating: 5,
    topic: "ফ্যামিলি কম্বো প্যাকেজ",
    comment: "মেগা ফ্যামিলি প্যাকেজটি অর্ডার করেছিলাম। প্রতিটি পণ্যের মান খুবই ভালো এবং বাজারের চেয়ে সাশ্রয়ী মূল্যে পেয়েছি। সাথে পয়েন্টও যোগ হয়েছে!",
    source: "Website",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
  },
  {
    name: "মো. রাশেদুল ইসলাম",
    address: "সাহেব বাজার, রাজশাহী",
    rating: 5,
    topic: "ডেলিভারি সার্ভিস",
    comment: "সময়মতো ডেলিভারি পেয়ে খুবই খুশি। প্যাকেজিং অনেক সুন্দর ছিল এবং কাস্টমার সাপোর্ট ব্যবহার খুব ভালো।",
    source: "App",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
  },
  {
    name: "নুসরাত জাহান বৃষ্টি",
    address: "ধানমন্ডি, ঢাকা",
    rating: 5,
    topic: "কসমেটিকস ও বিউটি কেয়ার",
    comment: "আসল প্রোডাক্ট নিয়ে একটু চিন্তায় ছিলাম, কিন্তু হাতে পাওয়ার পর একদম ১০০% অরিজিনাল পেয়েছি। নিশ্চিন্তে অর্ডার করতে পারেন।",
    source: "Website",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
  },
  {
    name: "সাব্বির আহমেদ জয়",
    address: "আগ্রাবাদ, চট্টগ্রাম",
    rating: 4,
    topic: "লেভেল ও ক্যাশব্যাক সিস্টেম",
    comment: "দৈনন্দিন প্রয়োজনীয় বাজার করার পাশাপাশি পয়েন্ট ও লেভেল ক্যাশব্যাক পাওয়ার আইডিয়াটা দারুণ লেগেছে। আমার প্রথম লেভেল কমপ্লিট হয়েছে।",
    source: "App",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
  },
  {
    name: "ফারজানা ইয়াসমিন লিজা",
    address: "জিন্দাবাজার, সিলেট",
    rating: 5,
    topic: "হিজাব ও ফ্যাশন",
    comment: "হিজাবের কাপড়ের কোয়ালিটি ছবিতে যেমন দেখেছিলাম তার চেয়েও সুন্দর। অফিস রিসিভ ও হোম ডেলিভারি দুটো সুবিধাই দারুণ।",
    source: "Website",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
  },
  {
    name: "মাহমুদুল হাসান শান্ত",
    address: "শিববাড়ী মোড়, খুলনা",
    rating: 5,
    topic: "মোবাইল অ্যাপ অভিজ্ঞতা",
    comment: "অ্যাপটি অনেক ফাস্ট এবং ব্যবহার করা খুব সহজ। অর্ডার করার পর পিডিএফ ইনভয়েস ডাউনলোড করতে পারাটা খুব প্রফেশনাল লেগেছে।",
    source: "App",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
  {
    name: "সুমাইয়া রহমান",
    address: "কান্দিরপাড়, কুমিল্লা",
    rating: 5,
    topic: "গ্রোসারি ও নিত্যপণ্য",
    comment: "সরিষার তেল ও নিত্যপ্রয়োজনীয় গ্রোসারি নিয়মিত এখান থেকেই নিই। মানের দিক থেকে কোনো আপস করে না। ব্রাইট স্মার্ট শপের জন্য শুভকামনা!",
    source: "Website",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
  },
];

// GET: সব রিভিউ লোড করা (খালি থাকলে অটো-সিড হবে)
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("reviews");

    const count = await col.countDocuments();
    if (count === 0) {
      await col.insertMany(INITIAL_REVIEWS);
    }

    const reviews = await col.find({}).sort({ createdAt: -1 }).limit(50).toArray();

    return NextResponse.json({
      success: true,
      reviews: reviews.map((r) => ({ ...r, _id: String(r._id) })),
    });
  } catch (error) {
    console.error("[reviews GET]", error);
    return NextResponse.json(
      { success: false, message: "রিভিউ লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

// POST: নতুন রিভিউ জমা দেওয়া (ওয়েবসাইট ও অ্যাপ উভয় থেকেই)
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, address, rating, topic, comment, source } = body;

    if (!name?.trim() || !comment?.trim()) {
      return NextResponse.json(
        { success: false, message: "অনুগ্রহ করে আপনার নাম এবং মতামত লিখুন।" },
        { status: 400 }
      );
    }

    const numRating = Math.min(5, Math.max(1, Number(rating) || 5));

    const client = await clientPromise;
    const db = client.db();

    const doc = {
      name: name.trim(),
      address: (address || "বাংলাদেশ").trim(),
      rating: numRating,
      topic: (topic || "সাধারণ রিভিউ").trim(),
      comment: comment.trim(),
      source: source || "Website",
      createdAt: new Date(),
    };

    const result = await db.collection("reviews").insertOne(doc);

    return NextResponse.json(
      {
        success: true,
        message: "আপনার মূল্যবান রিভিউটির জন্য অসংখ্য ধন্যবাদ!",
        review: { ...doc, _id: String(result.insertedId) },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[reviews POST]", error);
    return NextResponse.json(
      { success: false, message: "রিভিউ সেভ করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

// DELETE: অ্যাডমিন প্রয়োজনে রিভিউ মুছতে পারবে
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "সঠিক আইডি পাওয়া যায়নি।" }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db();
    await db.collection("reviews").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true, message: "রিভিউ মুছে ফেলা হয়েছে।" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "ডিলিট করা যায়নি।" }, { status: 500 });
  }
}