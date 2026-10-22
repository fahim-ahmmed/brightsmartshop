import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client";

export async function GET(req) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");
    const chainCollection = db.collection("global_chain");

    // চেক করা হচ্ছে আগে থেকেই অ্যাকাউন্টগুলো তৈরি করা আছে কি না
    const existingCount = await usersCollection.countDocuments({ isSystemFounder: true });
    if (existingCount >= 10) {
      return NextResponse.json({ 
        message: "আপনার ১০টি অ্যাডমিন/ফাউন্ডার অ্যাকাউন্ট আগে থেকেই তৈরি করা আছে!" 
      });
    }

    const createdAccounts = [];

    // ১ থেকে ১০ পর্যন্ত লুপ চালিয়ে অটোমেটিক অ্যাকাউন্ট তৈরি
    for (let i = 1; i <= 10; i++) {
      const name = `BRIGHT SMART SHOP ${i}`;
      // নাম্বার ইউনিক রাখার জন্য শেষে i যোগ করা হয়েছে
      const phone = i === 1 ? "01727629513" : `01727629513${i}`;
      const plainPassword = `brightsmartshop${i}`;

      // ১. Users কালেকশনে সেভ করা
      const userObj = {
        name: name,
        phone: phone,
        password: plainPassword,
        rawPassword: plainPassword, // আপনার সিস্টেমের সুবিধার্থে র-পাসওয়ার্ডও রাখা হলো
        role: "user", // সাধারণ ইউজার হিসেবেই থাকবে
        isSystemFounder: true, // চেনার সুবিধার জন্য স্পেশাল ফ্ল্যাগ
        level: 0,
        walletBalance: 0,
        totalPackages: 0,
        referralCode: `BSS-TOP-${i}`,
        createdAt: new Date(),
      };

      const insertedUser = await usersCollection.insertOne(userObj);
      const newUserId = insertedUser.insertedId.toString();

      // ২. Global Chain-এ সবার উপরের পজিশনে (Sequence 1-10) বসিয়ে দেওয়া
      const chainObj = {
        sequenceNo: i, // ১ থেকে ১০ নম্বর পজিশন
        userId: newUserId,
        userName: name,
        isManId: true, // ম্যান আইডি হিসেবে কাউন্ট হবে
        points: 0,
        packages: 0,
        accumulatedPackages: 0,
        currentLevel: 0,
        createdAt: new Date(),
      };

      await chainCollection.insertOne(chainObj);

      createdAccounts.push({
        পজিশন: i,
        নাম: name,
        লগইন_নাম্বার: phone,
        পাসওয়ার্ড: plainPassword
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "সফলভাবে ১০টি টপ লেভেল অ্যাকাউন্ট ডাটাবেসে যুক্ত হয়েছে!", 
      accounts: createdAccounts 
    });

  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}