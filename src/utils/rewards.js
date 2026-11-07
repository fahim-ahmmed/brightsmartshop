// 🟢 মোট পয়েন্ট থেকে প্যাকেজ সংখ্যা ও অতিরিক্ত পয়েন্ট হিসেব করার ফাংশন
export function calculatePackagesFromPoints(totalPoints = 0) {
  const points = Number(totalPoints) || 0;
  
  if (points < 40) {
    return {
      packages: 0,
      pendingPoints: points, // ৪০ এর কম হলে সব পেন্ডিং পয়েন্টে থাকবে
    };
  }

  const packages = Math.floor(points / 40); // প্রতি ৪০ পয়েন্টে ১টি প্যাকেজ
  const remainingPoints = Number((points % 40).toFixed(2)); // ৪০ দিয়ে ভাগ করার পর অবশিষ্ট পয়েন্ট

  return {
    packages,
    pendingPoints: remainingPoints,
  };
}