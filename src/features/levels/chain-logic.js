import clientPromise from "@/lib/mongo-client";

// ২৪ লেভেলের ক্রাইটেরিয়া, প্যাকেজ এবং লেভেল আপ ক্যাশব্যাক (টাকা) চার্ট
const LEVEL_CONFIG = [
  { level: 1, requiredPackages: 3, taka: 0 },
  { level: 2, requiredPackages: 5, taka: 3 },
  { level: 3, requiredPackages: 9, taka: 4 },
  { level: 4, requiredPackages: 16, taka: 8 },
  { level: 5, requiredPackages: 33, taka: 15 },
  { level: 6, requiredPackages: 65, taka: 32 },
  { level: 7, requiredPackages: 129, taka: 60 },
  { level: 8, requiredPackages: 257, taka: 100 },
  { level: 9, requiredPackages: 513, taka: 250 },
  { level: 10, requiredPackages: 1025, taka: 510 },
  { level: 11, requiredPackages: 2049, taka: 1025 },
  { level: 12, requiredPackages: 4097, taka: 2050 },
  { level: 13, requiredPackages: 8193, taka: 4050 },
  { level: 14, requiredPackages: 16385, taka: 8200 },
  { level: 15, requiredPackages: 32769, taka: 16000 },
  { level: 16, requiredPackages: 65537, taka: 30000 },
  { level: 17, requiredPackages: 131073, taka: 65000 },
  { level: 18, requiredPackages: 262145, taka: 100000 },
  { level: 19, requiredPackages: 524289, taka: 250000 },
  { level: 20, requiredPackages: 1048577, taka: 350000 },
  { level: 21, requiredPackages: 2097153, taka: 800000 },
  { level: 22, requiredPackages: 4194305, taka: 1500000 },
  { level: 23, requiredPackages: 8388609, taka: 2000000 },
  { level: 24, requiredPackages: 16777217, taka: 5000000 },
];

/**
 * গ্লোবাল চেইন, আপওয়ার্ড পুশ এবং লেভেল আপ ক্যাশব্যাক ওয়ালেটে পাঠানোর লজিক
 */
export async function processOrderToGlobalChain(orderData) {
  const { userId, userName, points } = orderData;
  const packagesGenerated = Math.floor(points / 40); // ৪০ পয়েন্ট = ১ প্যাকেজ

  if (packagesGenerated <= 0) {
    return { success: true, message: "No packages generated (less than 40 points)" };
  }

  const client = await clientPromise;
  const db = client.db();
  const chainCollection = db.collection("global_chain");
  const usersCollection = db.collection("users");

  // ১. চেক করা এটি ইউজারের প্রথম পারচেস কি না (Man ID নাকি Product ID)
  const existingNodesCount = await chainCollection.countDocuments({ userId: userId });
  const isManId = existingNodesCount === 0;

  // ২. চেইনের একদম শেষের (Bottom-most) সিকোয়েন্স নম্বর বের করা
  const lastNode = await chainCollection.findOne({}, { sort: { sequenceNo: -1 } });
  const nextSequenceNo = lastNode ? lastNode.sequenceNo + 1 : 1;

  // ৩. নতুন নোড তৈরি (ম্যান আইডি হোক বা প্রোডাক্ট আইডি, চেইনের নিচে বসবে)
  const newNode = {
    sequenceNo: nextSequenceNo,
    userId: userId,
    userName: userName || "Customer",
    isManId: isManId, 
    points: points,
    packages: packagesGenerated,
    accumulatedPackages: 0, 
    currentLevel: 0,
    createdAt: new Date(),
  };

  await chainCollection.insertOne(newNode);

  // ৪. আপওয়ার্ড পুশ লজিক: এই নতুন নোডের ওপরের দিকে থাকা সমস্ত নোডের প্যাকেজ কাউন্ট আপডেট করা
  const upperNodes = await chainCollection.find({ sequenceNo: { $lt: nextSequenceNo } }).toArray();

  for (const upNode of upperNodes) {
    const prevAccumulated = upNode.accumulatedPackages || 0;
    const newTotalPackages = prevAccumulated + packagesGenerated;

    // পূর্বের লেভেল এবং নতুন প্যাকেজ অনুযায়ী বর্তমান লেভেল হিসাব করা
    const previousLevel = upNode.currentLevel || 0;
    let calculatedLevel = previousLevel;
    let cashbackRewardToAdd = 0;

    for (const config of LEVEL_CONFIG) {
      if (newTotalPackages >= config.requiredPackages) {
        calculatedLevel = config.level;
      } else {
        break;
      }
    }

    // যদি নতুন লেভেল আগের লেভেলের চেয়ে বেশি হয়, তবে লেভেল আপ হয়েছে এবং ক্যাশব্যাক যোগ হবে
    if (calculatedLevel > previousLevel) {
      // প্রিভিয়াস লেভেল থেকে নতুন লেভেলের মধ্যকার ক্যাশব্যাক যোগ করা
      for (let lvl = previousLevel + 1; lvl <= calculatedLevel; lvl++) {
        const conf = LEVEL_CONFIG.find(c => c.level === lvl);
        if (conf) {
          cashbackRewardToAdd += conf.taka;
        }
      }
    }

    // গ্লোবাল চেইনে আপডেট করা
    await chainCollection.updateOne(
      { _id: upNode._id },
      { 
        $set: { 
          accumulatedPackages: newTotalPackages,
          currentLevel: calculatedLevel 
        } 
      }
    );

    // ৫. যদি এটি মেইন আইডি (Man ID) হয়, তবে মূল users কালেকশনে লেভেল এবং ওয়ালেটে ক্যাশব্যাক টাকা সরাসরি হিট করাবে
    if (upNode.isManId) {
      const updateData = {
        level: calculatedLevel,
        totalPackages: newTotalPackages
      };

      // যদি ক্যাশব্যাক রিওয়ার্ড থাকে, তবে ইউজারের ওয়ালেট ব্যালেন্সে টাকা যুক্ত হবে
      const dbQuery = {
        $set: updateData,
        ...(cashbackRewardToAdd > 0 && { $inc: { walletBalance: cashbackRewardToAdd } })
      };

      await usersCollection.updateOne(
        { _id: upNode.userId },
        dbQuery
      );
    }
  }

  return { 
    success: true, 
    message: "Global chain, level and wallet updated successfully", 
    sequenceNo: nextSequenceNo,
    isManId 
  };
}