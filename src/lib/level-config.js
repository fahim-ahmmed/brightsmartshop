export const RESERVED_TOP_POSITIONS = 10;

// 🟢 ২৪টি লেভেলের মেইন প্যাকেজ, এক্সট্রা প্যাকেজ, ক্যাশব্যাক টাকা এবং ইনসেন্টিভ চার্ট
export const LEVEL_CONFIG = [
  { level: 1, requiredPackages: 3, extraPackages: 0, taka: 0, designation: "Preferred Customer", incentive: "" },
  { level: 2, requiredPackages: 6, extraPackages: 0, taka: 2, designation: "Preferred Customer", incentive: "" },
  { level: 3, requiredPackages: 12, extraPackages: 0, taka: 4, designation: "Preferred Customer", incentive: "" },
  { level: 4, requiredPackages: 24, extraPackages: 0, taka: 8, designation: "Preferred Customer", incentive: "" },
  { level: 5, requiredPackages: 48, extraPackages: 0, taka: 15, designation: "General Customer", incentive: "" },
  { level: 6, requiredPackages: 96, extraPackages: 0, taka: 30, designation: "General Customer", incentive: "" },
  { level: 7, requiredPackages: 192, extraPackages: 0, taka: 50, designation: "General Customer", incentive: "" },
  { level: 8, requiredPackages: 384, extraPackages: 0, taka: 100, designation: "General Customer", incentive: "" },
  { level: 9, requiredPackages: 768, extraPackages: 0, taka: 150, designation: "General Customer", incentive: "" },
  { level: 10, requiredPackages: 1536, extraPackages: 10, taka: 300, designation: "Regular Customer", incentive: "" },
  { level: 11, requiredPackages: 3072, extraPackages: 15, taka: 1000, designation: "Regular Customer", incentive: "" },
  { level: 12, requiredPackages: 6144, extraPackages: 25, taka: 2000, designation: "Regular Customer", incentive: "" },
  { level: 13, requiredPackages: 12288, extraPackages: 50, taka: 4000, designation: "Regular Customer", incentive: "" },
  { level: 14, requiredPackages: 24576, extraPackages: 100, taka: 7000, designation: "Regular Customer", incentive: "" },
  { level: 15, requiredPackages: 49152, extraPackages: 150, taka: 12000, designation: "Special Customer", incentive: "Cox's Bazar Tour" },
  { level: 16, requiredPackages: 98304, extraPackages: 230, taka: 20000, designation: "Special Customer", incentive: "" },
  { level: 17, requiredPackages: 196608, extraPackages: 400, taka: 30000, designation: "Silver Customer", incentive: "Sylhet Jaflong Tour" },
  { level: 18, requiredPackages: 393216, extraPackages: 500, taka: 45000, designation: "Silver Customer", incentive: "" },
  { level: 19, requiredPackages: 786432, extraPackages: 750, taka: 70000, designation: "Gold Customer", incentive: "Malaysia Tour" },
  { level: 20, requiredPackages: 1572864, extraPackages: 1200, taka: 100000, designation: "Gold Customer", incentive: "" },
  { level: 21, requiredPackages: 3145728, extraPackages: 4000, taka: 350000, designation: "Diamond Customer", incentive: "Dubai Tour" },
  { level: 22, requiredPackages: 6291456, extraPackages: 6000, taka: 500000, designation: "Platinum Customer", incentive: "" },
  { level: 23, requiredPackages: 12582912, extraPackages: 12000, taka: 1000000, designation: "Royal Customer", incentive: "Singapore Tour" },
  { level: 24, requiredPackages: 25165824, extraPackages: 25000, taka: 2000000, designation: "Crown Customer", incentive: "Umrah Hajj" },
];

export function designationFor(level) {
  const num = Number(level || 0);
  if (num <= 0) return "New Member";
  const found = LEVEL_CONFIG.find((c) => c.level === num);
  return found ? found.designation : "Crown Customer";
}

export function getLevelConfig(level) {
  return LEVEL_CONFIG[Number(level) - 1] || null;
}

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
  let anyReachedLevel9 = false; // ফাস্ট ট্র্যাকিং ফ্ল্যাগ

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
      level: 0,
      mainLevel: 0,
      mainStepPackages: 0,
      extraLevel: 9,
      extraStepPackages: 0,
      mainChainPackagesAfter: 0,
      rawPackagesAfter: 0,
      extraPackagesReceived: 0,
      earnedTaka: 0,
      extraQueueTick: { 9: 0 },
    };
  });

  function syncCompletedLevel(st) {
    let targetCompleted = st.mainLevel;
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

  function applyMainChainHit(limitIndex) {
    for (let j = 0; j < limitIndex; j++) {
      const st = states[j];
      st.mainChainPackagesAfter += 1;

      if (st.mainLevel < 24) {
        st.mainStepPackages += 1;
        const nextMainCfg = getLevelConfig(st.mainLevel + 1);
        if (nextMainCfg && st.mainStepPackages >= nextMainCfg.requiredPackages) {
          st.mainLevel += 1;
          st.mainStepPackages = 0;

          if (st.mainLevel === 9 && st.shouldBeManId && !st.isSystemFounder) {
            st.extraQueueTick[9] = ++tickCounter;
            anyReachedLevel9 = true;
          }

          syncCompletedLevel(st);
        }
      }
    }
  }

  function applyExtraPackageHit(limitIndex) {
    for (let waitingLvl = 9; waitingLvl <= 23; waitingLvl++) {
      const targetLvl = waitingLvl + 1;
      const targetCfg = getLevelConfig(targetLvl);
      if (!targetCfg) continue;

      let winner = null;
      let bestTick = Infinity;
      let bestSeq = Infinity;

      for (let j = 0; j < limitIndex; j++) {
        const st = states[j];
        if (
          st.shouldBeManId &&
          !st.isSystemFounder &&
          st.mainLevel >= 9 &&
          st.extraLevel === waitingLvl &&
          st.extraStepPackages < targetCfg.extraPackages
        ) {
          const tick = st.extraQueueTick[waitingLvl] || st.sequenceNo || 0;
          const seq = st.sequenceNo || 0;
          if (tick < bestTick || (tick === bestTick && seq < bestSeq)) {
            bestTick = tick;
            bestSeq = seq;
            winner = st;
          }
        }
      }

      if (winner) {
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

  for (let i = 0; i < states.length; i++) {
    const current = states[i];
    if (current.isSystemFounder || current.packages <= 0 || i === 0) continue;

    for (let p = 0; p < current.packages; p++) {
      for (let j = 0; j < i; j++) {
        states[j].rawPackagesAfter += 1;
      }

      if (!anyReachedLevel9) {
        applyMainChainHit(i);
      } else {
        splitToggle += 1;
        if (splitToggle % 2 === 1) {
          applyMainChainHit(i);
        } else {
          const consumed = applyExtraPackageHit(i);
          if (!consumed) {
            applyMainChainHit(i);
          }
        }
      }
    }
  }

  return states.map((st) => {
    const nextMainLvl = Math.min(24, st.mainLevel + 1);
    const nextMainCfg = getLevelConfig(nextMainLvl);
    const mainTarget = nextMainCfg ? nextMainCfg.requiredPackages : 0;

    const showExtraCard = st.mainLevel >= 9 || st.level >= 9;
    const nextExtraLvl = Math.min(24, st.extraLevel + 1);
    const nextExtraCfg = getLevelConfig(nextExtraLvl);
    const extraTarget = nextExtraCfg ? nextExtraCfg.extraPackages : 0;

    return {
      ...st,
      nextLevel: nextMainLvl,
      isExtraStage: showExtraCard,
      currentStepPackages: st.mainStepPackages,
      nextLevelTarget: mainTarget,
      packagesNeededForNext: Math.max(0, mainTarget - st.mainStepPackages),
      extraTargetLevel: nextExtraLvl,
      extraStepPackages: st.extraStepPackages,
      extraNextLevelTarget: extraTarget,
      extraPackagesNeeded: Math.max(0, extraTarget - st.extraStepPackages),
      designation: designationFor(st.level),
    };
  });
}

// 🟢 সুপার-ফাস্ট ক্যাশিং সিস্টেম (১৫ সেকেন্ড পর্যন্ত মেমরিতে ডাটা ধরে রাখবে)
export async function getCachedGlobalChain(db) {
  const now = Date.now();
  const cache = globalThis.__BSS_GLOBAL_CHAIN_CACHE__;
  if (cache && now - cache.time < 15000) {
    return cache;
  }

  const allChainNodes = await db
    .collection("global_chain")
    .find({})
    .sort({ sequenceNo: 1, createdAt: 1 })
    .toArray();
  const evaluatedChain = evaluateGlobalChain(allChainNodes);

  const result = { allChainNodes, evaluatedChain, time: now };
  globalThis.__BSS_GLOBAL_CHAIN_CACHE__ = result;
  return result;
}

export function invalidateChainCache() {
  globalThis.__BSS_GLOBAL_CHAIN_CACHE__ = null;
}