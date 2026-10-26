const PACKAGES = [3, 5, 9, 16, 33, 65, 129, 257, 513, 1025, 2049, 4097, 8193, 16385, 32769, 65537, 131073, 262145, 524289, 1048577, 2097153, 4194305, 8388609, 16777217];
const TAKA = [0, 3, 4, 8, 15, 32, 60, 100, 250, 510, 1025, 2050, 4050, 8200, 16000, 30000, 65000, 100000, 250000, 350000, 800000, 1500000, 2000000, 5000000];
const DESIGNATIONS = {
  1: "Preferred Customer", 5: "General Customer", 10: "Regular Customer", 15: "Special Customer",
  17: "Silver Customer", 19: "Gold Customer", 21: "Diamond Customer", 22: "Platinum Customer",
  23: "Royal Customer", 24: "Crown Customer",
};

export const LEVEL_CONFIG = PACKAGES.map((requiredPackages, i) => ({
  level: i + 1,
  requiredPackages,
  taka: TAKA[i],
  designation: DESIGNATIONS[i + 1] || "",
}));

// চেইনের প্রথম ১০টি পজিশন টপ আইডির জন্য সংরক্ষিত
export const RESERVED_TOP_POSITIONS = 10;

export function designationFor(level) {
  let d = "No Level";
  for (const c of LEVEL_CONFIG) {
    if (c.level > level) break;
    if (c.designation) d = c.designation;
  }
  return d;
}