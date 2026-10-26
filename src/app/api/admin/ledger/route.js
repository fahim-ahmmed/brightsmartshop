import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/mongo-client";
import { requireAdmin } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const TYPES = ["purchase", "profit"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const deny = () => NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
const bad = (message) => NextResponse.json({ success: false, message }, { status: 400 });
const col = () => db.collection("ledger_entries");

function scope(type, month) {
  const q = { type };
  if (month && MONTH_RE.test(month)) q.date = { $gte: `${month}-01`, $lte: `${month}-31` };
  return q;
}

export async function GET(req) {
  try {
    if (!(await requireAdmin(req))) return deny();
    const sp = new URL(req.url).searchParams;
    const type = sp.get("type");
    if (!TYPES.includes(type)) return bad("Invalid type");

    const rows = await col()
      .find(scope(type, sp.get("month")))
      .sort({ date: -1, createdAt: -1 })
      .toArray();
    const entries = rows.map((r) => ({ id: String(r._id), name: r.name, date: r.date, amount: r.amount }));
    return NextResponse.json({ success: true, entries });
  } catch (error) {
    console.error("[ledger GET]", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    if (!(await requireAdmin(req))) return deny();
    const body = await req.json();

    const type = body.type;
    const name = String(body.name || "").trim().slice(0, 200);
    const date = String(body.date || "");
    const amount = Math.round(Number(body.amount) * 100) / 100;

    if (!TYPES.includes(type)) return bad("Invalid type");
    if (!name) return bad("নাম বা নোট লিখুন");
    if (!DATE_RE.test(date)) return bad("তারিখ ঠিক নয়");
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12) return bad("টাকার অংক ঠিক নয়");

    const doc = { type, name, date, amount, createdAt: new Date() };
    const res = await col().insertOne(doc);
    return NextResponse.json({ success: true, id: String(res.insertedId) });
  } catch (error) {
    console.error("[ledger POST]", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    if (!(await requireAdmin(req))) return deny();
    const sp = new URL(req.url).searchParams;

    // একটা এন্ট্রি মোছা
    const id = sp.get("id");
    if (id) {
      if (!ObjectId.isValid(id)) return bad("Invalid id");
      const r = await col().deleteOne({ _id: new ObjectId(id) });
      if (!r.deletedCount) {
        return NextResponse.json({ success: false, message: "Entry not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    // সব ক্লিয়ার (মাস দিলে শুধু ওই মাস)
    if (sp.get("clear") === "1") {
      const type = sp.get("type");
      if (!TYPES.includes(type)) return bad("Invalid type");
      const r = await col().deleteMany(scope(type, sp.get("month")));
      return NextResponse.json({ success: true, deleted: r.deletedCount });
    }

    return bad("id বা clear দিন");
  } catch (error) {
    console.error("[ledger DELETE]", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}