export const RESERVED_TOP_POSITIONS = 10;

// 🟢 ২৪টি লেভেলের মেইন প্যাকেজ, এক্সট্রা প্যাকেজ এবং ক্যাশব্যাক টাকার চার্ট
export const LEVEL_CONFIG = [
  { level: 1, requiredPackages: 3, extraPackages: 0, taka: 0, designation: "Preferred Customer" },
  { level: 2, requiredPackages: 6, extraPackages: 0, taka: 2, designation: "Preferred Customer" },
  { level: 3, requiredPackages: 12, extraPackages: 0, taka: 4, designation: "Preferred Customer" },
  { level: 4, requiredPackages: 24, extraPackages: 0, taka: 8, designation: "Preferred Customer" },
  { level: 5, requiredPackages: 48, extraPackages: 0, taka: 15, designation: "General Customer" },
  { level: 6, requiredPackages: 96, extraPackages: 0, taka: 30, designation: "General Customer" },
  { level: 7, requiredPackages: 192, extraPackages: 0, taka: 50, designation: "General Customer" },
  { level: 8, requiredPackages: 384, extraPackages: 0, taka: 100, designation: "General Customer" },
  { level: 9, requiredPackages: 768, extraPackages: 0, taka: 150, designation: "General Customer" },
  { level: 10, requiredPackages: 1536, extraPackages: 10, taka: 300, designation: "Regular Customer" },
  { level: 11, requiredPackages: 3072, extraPackages: 15, taka: 1000, designation: "Regular Customer" },
  { level: 12, requiredPackages: 6144, extraPackages: 25, taka: 2000, designation: "Regular Customer" },
  { level: 13, requiredPackages: 12288, extraPackages: 50, taka: 4000, designation: "Regular Customer" },
  { level: 14, requiredPackages: 24576, extraPackages: 100, taka: 7000, designation: "Regular Customer" },
  { level: 15, requiredPackages: 49152, extraPackages: 150, taka: 12000, designation: "Special Customer" },
  { level: 16, requiredPackages: 98304, extraPackages: 230, taka: 20000, designation: "Special Customer" },
  { level: 17, requiredPackages: 196608, extraPackages: 400, taka: 30000, designation: "Silver Customer" },
  { level: 18, requiredPackages: 393216, extraPackages: 500, taka: 45000, designation: "Silver Customer" },
  { level: 19, requiredPackages: 786432, extraPackages: 750, taka: 70000, designation: "Gold Customer" },
  { level: 20, requiredPackages: 1572864, extraPackages: 1200, taka: 100000, designation: "Gold Customer" },
  { level: 21, requiredPackages: 3145728, extraPackages: 4000, taka: 350000, designation: "Diamond Customer" },
  { level: 22, requiredPackages: 6291456, extraPackages: 6000, taka: 500000, designation: "Platinum Customer" },
  { level: 23, requiredPackages: 12582912, extraPackages: 12000, taka: 1000000, designation: "Royal Customer" },
  { level: 24, requiredPackages: 25165824, extraPackages: 25000, taka: 2000000, designation: "Crown Customer" },
];

export function designationFor(level) {
  const num = Number(level || 0);
  if (num <= 0) return "New Member";
  const found = LEVEL_CONFIG.find((c) => c.level === num);
  return found ? found.designation : "Crown Customer";
}

export function getLevelConfig(level) {
  return LEVEL_CONFIG.find((c) => c.level === Number(level)) || null;
}

// 🟢 গ্লোবাল চেইন ক্যালকুলেশন ইঞ্জিন:
// ১. কেউ লেভেল ৯-এ ওঠার আগে ১০০% প্যাকেজ মেইন চেইনে (লেভেল ১ থেকে ২৪ পর্যন্ত) হিট করবে।
// ২. অন্তত একজন লেভেল ৯ হিট করার সাথে সাথে ৫০% যাবে মেইন চেইনে (যা লেভেল ১ থেকে ২৪ পর্যন্ত সবাইকে একটানা হিট করবে) এবং ৫০% যাবে এক্সট্রা প্যাকেজ ফান্ডে।
// ৩. এক্সট্রা প্যাকেজগুলো লেভেল ৯ বা তার ওপরে থাকা ম্যান আইডিগুলোর মধ্যে নিচ থেকে ওপরের দিকে (9->10, 10->11...) এবং FIFO (যিনি আগে লেভেলে পৌঁছেছেন) অনুযায়ী বণ্টন হবে।
export function evaluateGlobalChain(allNodes) {
  const seenManIdForUser = new Set();
  const usersWithPurchasedNodes = new Set();

  for (const n of allNodes) {
    if (!n.isSystemFounder) {
      const uid = String(n.userId || n.phone || "");
      if (uid) usersWithPurchasedNodes.add(uid);
    }
  }

  let tickCounter = 0;
  let splitToggle = 0;

  const states = allNodes.map((node, index) => {
    const uid = String(node.userId || node.phone || "");
    let shouldBeManId = false;
    if (uid && !seenManIdForUser.has(uid)) {
      if (!node.isSystemFounder || !usersWithPurchasedNodes.has(uid)) {
        seenManIdForUser.add(uid);
        shouldBeManId = true;
      }
    }

    return {
      index,
      _id: node._id,
      sequenceNo: node.sequenceNo,
      userId: node.userId,
      phone: node.phone,
      isSystemFounder: Boolean(node.isSystemFounder),
      shouldBeManId,
      packages: node.isSystemFounder ? 0 : Number(node.packages ?? 1),
      level: 0, // চূড়ান্ত অর্জিত লেভেল
      mainLevel: 0, // মেইন চেইনে অর্জিত লেভেল (১ থেকে ২৪ পর্যন্ত একটানা চলবে)
      mainStepPackages: 0, // মেইন চেইনে বর্তমান লেভেলের জমা প্যাকেজ
      extraLevel: 9, // লেভেল ৯-এ ওঠার পর এক্সট্রা প্যাকেজ কোটার ধাপ (৯ -> ২৪)
      extraStepPackages: 0, // বর্তমান এক্সট্রা লেভেলের জন্য জমা হওয়া এক্সট্রা প্যাকেজ
      mainChainPackagesAfter: 0, // মেইন চেইনে পাওয়া মোট প্যাকেজ
      rawPackagesAfter: 0, // এই আইডির পরে ওয়েবসাইটে সেল হওয়া মোট প্যাকেজ
      extraPackagesReceived: 0, // এই ম্যান আইডির ফান্ডে পাওয়া মোট এক্সট্রা প্যাকেজ
      earnedTaka: 0,
      extraQueueTick: { 9: 0 },
    };
  });

  // 🟢 কোন লেভেল পর্যন্ত সম্পূর্ণ হয়েছে তা আপডেট ও ক্যাশব্যাক টাকা যোগ করার হেল্পার
  function syncCompletedLevel(st) {
    let targetCompleted = st.mainLevel;

    // ম্যান আইডির ক্ষেত্রে লেভেল ১০ থেকে ২৪ কমপ্লিট হতে মেইন চেইনের পাশাপাশি এক্সট্রা প্যাকেজ কোটাও পূর্ণ হতে হবে
    if (st.shouldBeManId && !st.isSystemFounder && st.mainLevel >= 10) {
      targetCompleted = Math.min(st.mainLevel, st.extraLevel);
    }

    while (st.level < targetCompleted) {
      const nextLvl = st.level + 1;
      const cfg = getLevelConfig(nextLvl);
      st.level = nextLvl;
      if (cfg) {
        st.earnedTaka += Number(cfg.taka || 0);
      }
    }
  }

  // 🟢 মেইন চেইন হিট: কখনোই লেভেল ৮ বা ৯-এ আটকে থাকবে না, লেভেল ১ থেকে ২৪ পর্যন্ত সবাইকে একটানা হিট করবে
  function applyMainChainHit(upperStates) {
    for (const st of upperStates) {
      st.mainChainPackagesAfter += 1;

      if (st.mainLevel < 24) {
        st.mainStepPackages += 1;
        const nextMainCfg = getLevelConfig(st.mainLevel + 1);
        if (nextMainCfg && st.mainStepPackages >= nextMainCfg.requiredPackages) {
          st.mainLevel += 1;
          st.mainStepPackages = 0;

          // যে মুহূর্তে কোনো ম্যান আইডি লেভেল ৯ হিট করবে, সে সাথে সাথে এক্সট্রা প্যাকেজের FIFO লাইনে যুক্ত হবে
          if (st.mainLevel === 9 && st.shouldBeManId && !st.isSystemFounder) {
            st.extraQueueTick[9] = ++tickCounter;
          }

          syncCompletedLevel(st);
        }
      }
    }
  }

  // 🟢 এক্সট্রা প্যাকেজ হিট (৫০% ফান্ড): যারা লেভেল ৯ বা তার ওপরে উঠেছে তাদের মধ্যে নিচ থেকে ওপরে (9->10, 10->11...) ও FIFO নিয়মে বণ্টন
  function applyExtraPackageHit(upperStates) {
    for (let waitingLvl = 9; waitingLvl <= 23; waitingLvl++) {
      const targetLvl = waitingLvl + 1;
      const targetCfg = getLevelConfig(targetLvl);
      if (!targetCfg) continue;

      const waitingManNodes = upperStates.filter(
        (st) =>
          st.shouldBeManId &&
          !st.isSystemFounder &&
          st.mainLevel >= 9 &&
          st.extraLevel === waitingLvl &&
          st.extraStepPackages < targetCfg.extraPackages
      );

      if (waitingManNodes.length > 0) {
        // FIFO: যিনি আগে ওই লেভেলে পৌঁছেছেন তিনি আগে এক্সট্রা প্যাকেজ পাবেন
        waitingManNodes.sort((a, b) => {
          const tickA = a.extraQueueTick[waitingLvl] || a.sequenceNo || 0;
          const tickB = b.extraQueueTick[waitingLvl] || b.sequenceNo || 0;
          if (tickA !== tickB) return tickA - tickB;
          return (a.sequenceNo || 0) - (b.sequenceNo || 0);
        });

        const winner = waitingManNodes[0];
        winner.extraStepPackages += 1;
        winner.extraPackagesReceived += 1;

        if (winner.extraStepPackages >= targetCfg.extraPackages) {
          winner.extraLevel = targetLvl;
          winner.extraStepPackages = 0;
          winner.extraQueueTick[targetLvl] = ++tickCounter;
          syncCompletedLevel(winner);
        }
        return true;
      }
    }
    return false;
  }

  // শুরু থেকে শেষ পর্যন্ত প্রতিটি প্যাকেজ ক্রমানুসারে চালানো
  for (let i = 0; i < states.length; i++) {
    const current = states[i];
    if (current.isSystemFounder || current.packages <= 0) continue;

    const upperStates = states.slice(0, i);
    if (upperStates.length === 0) continue;

    for (let p = 0; p < current.packages; p++) {
      for (const st of upperStates) {
        st.rawPackagesAfter += 1;
      }

      // চেক করা: ওয়েবসাইটে অন্তত একজন ব্যক্তি লেভেল ৯ বা তার ওপরে উঠেছে কি না
      const anyReachedLevel9 = states.some(
        (st) => st.shouldBeManId && !st.isSystemFounder && st.mainLevel >= 9
      );

      if (!anyReachedLevel9) {
        // সাধারণ অবস্থা (কেউ লেভেল ৯-এ ওঠেনি): ১০০% প্যাকেজ মেইন চেইনে (লেভেল ১ থেকে ২৪) হিট করবে
        applyMainChainHit(upperStates);
      } else {
        // অন্তত একজন লেভেল ৯ হিট করেছে: ৫০% মেইন চেইনে (লেভেল ১-২৪) এবং ৫০% এক্সট্রা প্যাকেজ ফান্ডে যাবে
        splitToggle += 1;
        if (splitToggle % 2 === 1) {
          applyMainChainHit(upperStates);
        } else {
          const consumed = applyExtraPackageHit(upperStates);
          if (!consumed) {
            // যদি লেভেল ৯+ এর কারো এক্সট্রা কোটা বাকি না থাকে, তবে প্যাকেজটি নষ্ট না হয়ে মেইন চেইনে যুক্ত হবে
            applyMainChainHit(upperStates);
          }
        }
      }
    }
  }

  return states.map((st) => {
    // মেইন চেইনের পরবর্তী লেভেল টার্গেট (১ থেকে ২৪)
    const nextMainLvl = Math.min(24, st.mainLevel + 1);
    const nextMainCfg = getLevelConfig(nextMainLvl);
    const mainTarget = nextMainCfg ? nextMainCfg.requiredPackages : 0;

    // এক্সট্রা প্যাকেজের পরবর্তী লেভেল টার্গেট (শুধুমাত্র লেভেল ৯ বা তার ওপরে ওঠা ইউজারদের জন্য)
    const showExtraCard = st.mainLevel >= 9 || st.level >= 9;
    const nextExtraLvl = Math.min(24, st.extraLevel + 1);
    const nextExtraCfg = getLevelConfig(nextExtraLvl);
    const extraTarget = nextExtraCfg ? nextExtraCfg.extraPackages : 0;

    return {
      ...st,
      nextLevel: nextMainLvl,
      isExtraStage: showExtraCard,
      // মেইন চেইন প্রগ্রেস (সবসময় লেভেল ১ থেকে ২৪ পর্যন্ত চলবে)
      currentStepPackages: st.mainStepPackages,
      nextLevelTarget: mainTarget,
      packagesNeededForNext: Math.max(0, mainTarget - st.mainStepPackages),
      // এক্সট্রা প্যাকেজ প্রগ্রেস (লেভেল ৯ বা তার ওপরে উঠলে ড্যাশবোর্ডের টপ কার্ডে দেখাবে)
      extraTargetLevel: nextExtraLvl,
      extraStepPackages: st.extraStepPackages,
      extraNextLevelTarget: extraTarget,
      extraPackagesNeeded: Math.max(0, extraTarget - st.extraStepPackages),
      designation: designationFor(st.level),
    };
  });
}