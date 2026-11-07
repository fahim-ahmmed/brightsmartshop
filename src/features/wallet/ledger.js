import WalletAccount from '../../models/WalletAccount.js';
import WalletLedger from '../../models/WalletLedger.js';

const SIGN = { credit: 1, release: 1, debit: -1, hold: -1 };

/**
 * Wallet-এ একটাই প্রবেশপথ। সব লেনদেন Ledger-এ লেখা হয়, ব্যালেন্স atomic ভাবে বদলায়।
 * - debit/hold: ব্যালেন্স যথেষ্ট না থাকলে কিছুই হয় না (দুটো রিকোয়েস্ট একসাথে এলেও ওভারড্র হবে না)
 * - একই (userId, reason, refType, refId) দুবার লেখা যায় না (idempotent)
 */
export async function postLedger({ userId, type, reason, amountPaisa, refType, refId, note = '', pointsX100 = 0 }) {
  const sign = SIGN[type];
  if (!sign) throw new Error(`Unknown ledger type: ${type}`);
  if (!Number.isInteger(amountPaisa) || amountPaisa < 1) throw new Error('amountPaisa must be a positive integer');
  const entry = { userId, type, reason, amountPaisa, refType, refId: String(refId), note, pointsX100 };

  if (sign < 0) {
    const res = await WalletAccount.updateOne({ userId, balancePaisa: { $gte: amountPaisa } }, { $inc: { balancePaisa: -amountPaisa } });
    if (res.modifiedCount !== 1) return { ok: false, reason: 'insufficient' };
    try {
      await WalletLedger.create(entry);
      return { ok: true };
    } catch (err) {
      await WalletAccount.updateOne({ userId }, { $inc: { balancePaisa: amountPaisa } }); // ফেরত
      if (err?.code === 11000) return { ok: false, reason: 'duplicate' };
      throw err;
    }
  }

  try {
    await WalletLedger.create(entry);
  } catch (err) {
    if (err?.code === 11000) return { ok: false, reason: 'duplicate' };
    throw err;
  }
  await WalletAccount.updateOne({ userId }, { $inc: { balancePaisa: amountPaisa } }, { upsert: true });
  return { ok: true };
}

// Ledger থেকে আসল ব্যালেন্স হিসাব করে account মিলিয়ে দেয় (কোনো ব্যর্থতায় গরমিল হলে চালানোর জন্য)
export async function reconcileAccount(userId) {
  const rows = await WalletLedger.aggregate([{ $match: { userId } }, { $group: { _id: '$type', total: { $sum: '$amountPaisa' } } }]);
  const t = Object.fromEntries(rows.map((r) => [r._id, r.total]));
  const balancePaisa = (t.credit || 0) + (t.release || 0) - (t.debit || 0) - (t.hold || 0);
  await WalletAccount.updateOne({ userId }, { $set: { balancePaisa } }, { upsert: true });
  return balancePaisa;
}
