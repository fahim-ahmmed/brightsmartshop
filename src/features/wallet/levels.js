// নির্ভেজাল হিসাব (DB নেই): threshold Point-এ, pointsX100 = জমা Point ×100
export function computeLevelInfo(levels, pointsX100) {
  const sorted = [...levels].sort((a, b) => a.level - b.level);
  let current = null;
  for (const l of sorted) {
    if (pointsX100 >= l.threshold * 100) current = l;
    else break;
  }
  const next = sorted.find((l) => l.level > (current?.level || 0)) || null;

  const designationFor = (level) => {
    let d = '';
    for (const l of sorted) {
      if (l.level > level) break;
      if (l.designation) d = l.designation;
    }
    return d;
  };

  const base = current ? current.threshold * 100 : 0;
  const percent = next ? Math.max(0, Math.min(100, Math.floor(((pointsX100 - base) / (next.threshold * 100 - base)) * 100))) : 100;

  return {
    current,
    next,
    designation: current ? designationFor(current.level) : '',
    nextDesignation: next ? designationFor(next.level) : '',
    percent,
    pointsToNextX100: next ? Math.max(0, next.threshold * 100 - pointsX100) : 0,
    designationFor,
  };
}
