export const RESERVED_TOP_POSITIONS = 10;

export const LEVEL_CONFIG = [
  { level: 1, requiredPackages: 3, taka: 0, designation: "Preferred Customer" },
  { level: 2, requiredPackages: 5, taka: 3, designation: "Preferred Customer" },
  { level: 3, requiredPackages: 9, taka: 4, designation: "Preferred Customer" },
  { level: 4, requiredPackages: 16, taka: 8, designation: "Preferred Customer" },
  { level: 5, requiredPackages: 33, taka: 15, designation: "General Customer" },
  { level: 6, requiredPackages: 65, taka: 32, designation: "General Customer" },
  { level: 7, requiredPackages: 129, taka: 60, designation: "General Customer" },
  { level: 8, requiredPackages: 257, taka: 100, designation: "General Customer" },
  { level: 9, requiredPackages: 513, taka: 250, designation: "General Customer" },
  { level: 10, requiredPackages: 1025, taka: 510, designation: "Regular Customer" },
  { level: 11, requiredPackages: 2049, taka: 1025, designation: "Regular Customer" },
  { level: 12, requiredPackages: 4097, taka: 2050, designation: "Regular Customer" },
  { level: 13, requiredPackages: 8193, taka: 4050, designation: "Regular Customer" },
  { level: 14, requiredPackages: 16385, taka: 8200, designation: "Regular Customer" },
  { level: 15, requiredPackages: 32769, taka: 16000, designation: "Special Customer" },
  { level: 16, requiredPackages: 65537, taka: 30000, designation: "Special Customer" },
  { level: 17, requiredPackages: 131073, taka: 65000, designation: "Silver Customer" },
  { level: 18, requiredPackages: 262145, taka: 100000, designation: "Silver Customer" },
  { level: 19, requiredPackages: 524289, taka: 250000, designation: "Gold Customer" },
  { level: 20, requiredPackages: 1048577, taka: 350000, designation: "Gold Customer" },
  { level: 21, requiredPackages: 2097153, taka: 800000, designation: "Diamond Customer" },
  { level: 22, requiredPackages: 4194305, taka: 1500000, designation: "Platinum Customer" },
  { level: 23, requiredPackages: 8388609, taka: 2000000, designation: "Royal Customer" },
  { level: 24, requiredPackages: 16777217, taka: 5000000, designation: "Crown Customer" },
];

export function designationFor(level) {
  if (!level || level <= 0) return "New Member";
  const found = LEVEL_CONFIG.find((c) => c.level === Number(level));
  return found ? found.designation : "Preferred Customer";
}