// scripts/restore-founders.mjs
// একবার চালানোর স্ক্রিপ্ট: টপ আইডি ৬–১০ ফিরিয়ে আনে। দুবার চালালেও ডুপ্লিকেট হয় না।
// চালানোর আগে `npm run dev` চালু থাকতে হবে।
// চালানো শেষে এই ফাইল মুছে ফেলুন, GitHub-এ তুলবেন না (পাসওয়ার্ড আছে)।

import { MongoClient } from "mongodb";

const BASE = process.env.SITE_URL || "http://localhost:3000";
const URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
const DB_NAME = "bright_shop_db";
const DOMAIN = "@brightsmartshop.local";
const ADDRESS = "Bright Smart Shop";

const FOUNDERS = [
  { seq: 6, name: "BRIGHT SMART SHOP 6", phone: "017276295136", password: "iM9tWQMCJzkp" },
  { seq: 7, name: "BRIGHT SMART SHOP 7", phone: "017276295137", password: "cjj4FzJo0Ek6" },
  { seq: 8, name: "BRIGHT SMART SHOP 8", phone: "017276295138", password: "1b1J1XUdEWyp" },
  { seq: 9, name: "BRIGHT SMART SHOP 9", phone: "017276295139", password: "hwT5g8CzbTfi" },
  { seq: 10, name: "BRIGHT SMART SHOP 10", phone: "0172762951310", password: "wHLpVzl_o3mS" },
];

if (!URI) {
  console.error("MongoDB URI পাওয়া যায়নি। .env.local-এ ডাটাবেস লিংকের ভেরিয়েবলের নাম দেখে এই ফাইলের URI লাইন মিলিয়ে নিন।");
  process.exit(1);
}

const client = new MongoClient(URI);

try {
  await client.connect();
  const db = client.db(DB_NAME);
  const authCol = db.collection("user");
  const usersCol = db.collection("users");
  const chain = db.collection("global_chain");

  for (const f of FOUNDERS) {
    console.log(`\n== ${f.name} (${f.phone}) ==`);
    const email = `${f.phone}${DOMAIN}`;

    // ১. লগইন অ্যাকাউন্ট
    let authDoc = await authCol.findOne({ email });
    if (!authDoc) {
      const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: BASE },
        body: JSON.stringify({
          email,
          password: f.password,
          name: f.name,
          mobile: f.phone,
          address: ADDRESS,
        }),
      });
      if (!res.ok) {
        console.error("  সাইনআপ ব্যর্থ:", res.status, (await res.text()).slice(0, 300));
        continue;
      }
      authDoc = await authCol.findOne({ email });
      console.log("  লগইন অ্যাকাউন্ট বানানো হয়েছে");
    } else {
      console.log("  লগইন অ্যাকাউন্ট আগেই আছে (পাসওয়ার্ড বদলানো হয়নি)");
    }
    if (!authDoc) {
      console.error("  অ্যাকাউন্ট ডকুমেন্ট পাওয়া গেল না, বাদ দিলাম");
      continue;
    }

    // ২. users প্রোফাইল (টপ আইডি চিহ্নসহ)
    const authUserId = String(authDoc._id);
    try {
      await usersCol.updateOne(
        { authUserId },
        {
          $set: {
            name: f.name,
            phone: f.phone,
            email: "",
            address: ADDRESS,
            role: "user",
            isSystemFounder: true,
            updatedAt: new Date(),
          },
          $setOnInsert: { level: 0, walletBalance: 0, totalPackages: 0, createdAt: new Date() },
        },
        { upsert: true }
      );
    } catch (err) {
      console.error("  প্রোফাইল বসানো ব্যর্থ:", err.message);
      continue;
    }
    const profile = await usersCol.findOne({ authUserId });
    console.log("  প্রোফাইল ঠিক আছে");

    // ৩. চেইনে পজিশন দখল
    const occupant = await chain.findOne({ sequenceNo: f.seq });
    if (occupant && String(occupant.userId) !== String(profile._id) && occupant.userName !== f.name) {
      console.error(`  পজিশন ${f.seq} অন্য কেউ দখল করে আছে (${occupant.userName || occupant.userId}), আমাকে জানান`);
      continue;
    }
    const agg = await chain
      .aggregate([
        { $match: { sequenceNo: { $gt: f.seq } } },
        { $group: { _id: null, total: { $sum: "$packages" } } },
      ])
      .toArray();
    const accumulated = agg[0]?.total || 0;

    await chain.updateOne(
      { sequenceNo: f.seq },
      {
        $set: {
          userId: String(profile._id),
          userName: f.name,
          isManId: true,
          isSystemFounder: true,
          accumulatedPackages: accumulated,
        },
        $setOnInsert: { points: 0, packages: 0, currentLevel: 0, createdAt: new Date() },
      },
      { upsert: true }
    );
    console.log(`  চেইন পজিশন ${f.seq} দখল (accumulatedPackages: ${accumulated})`);
  }

  console.log("\nশেষ। এবার এই ফাইলটা মুছে ফেলুন।");
} finally {
  await client.close();
}