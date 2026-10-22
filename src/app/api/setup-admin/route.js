import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo-client"; 

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Better Auth বা সাধারণ কালেকশন চেক করার জন্য কালেকশনগুলোর নাম দেখে নেওয়া
    const usersCollection = db.collection("users");
    
    // বিভিন্ন সম্ভাব্য ফিল্ড নেম দিয়ে খোঁজা (যাতে মিস না হয়)
    const searchQueries = [
      { phone: "01305470835" },
      { phone: "+8801305470835" },
      { phoneNumber: "01305470835" },
      { phoneNumber: "+8801305470835" },
      { email: "brightsmartshop24@gmail.com" }
    ];

    let existingUser = null;
    let matchedQuery = null;

    for (const q of searchQueries) {
      existingUser = await usersCollection.findOne(q);
      if (existingUser) {
        matchedQuery = q;
        break;
      }
    }

    // যদি users কালেকশনে না পাওয়া যায়, তবে ডাটাবেসের অন্য কালেকশনগুলো চেক করা (Better Auth-এর জন্য)
    if (!existingUser) {
      const collections = await db.listCollections().toArray();
      for (const colInfo of collections) {
        const col = db.collection(colInfo.name);
        for (const q of searchQueries) {
          existingUser = await col.findOne(q);
          if (existingUser) {
            // যদি অন্য কোনো কালেকশনে (যেমন account বা member) পাওয়া যায়, সেখানে আপডেট করবে
            await col.updateOne(q, {
              $set: { 
                role: "admin", 
                isAdmin: true,
                email: "brightsmartshop24@gmail.com"
              }
            });
            return NextResponse.json({ 
              success: true, 
              message: `🎉 অভিনন্দন! '${colInfo.name}' কালেকশন থেকে ইউজার খুঁজে পাওয়া গেছে এবং সফলভাবে অ্যাডমিন বানানো হয়েছে!` 
            });
          }
        }
      }
    }

    if (!existingUser) {
      return NextResponse.json({ 
        success: false, 
        message: "ডাটাবেসে এই নাম্বার বা ইমেইল দিয়ে কোনো ইউজার রেকর্ড পাওয়া যায়নি। দয়া করে সাইন-আপ ফর্ম বা MongoDB Compass চেক করুন যে নাম্বারটি কোন ফিল্ড নামে সেভ হয়েছে।" 
      });
    }

    // মূল users কালেকশনে আপডেট করা
    await usersCollection.updateOne(
      matchedQuery,
      { 
        $set: { 
          email: "brightsmartshop24@gmail.com",
          role: "admin", 
          isAdmin: true 
        } 
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: "🎉 অভিনন্দন! অ্যাকাউন্টটিকে সফলভাবে পারমানেন্ট অ্যাডমিন বানানো হয়েছে এবং ইমেইল যুক্ত করা হয়েছে।" 
    });

  } catch (error) {
    console.error("Admin Setup Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
