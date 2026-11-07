import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

// আপটাইম মনিটর (UptimeRobot ইত্যাদি) এই ঠিকানায় নজর রাখতে পারে
export async function GET() {
  try {
    await connectDB();
    await mongoose.connection.db.admin().ping();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
