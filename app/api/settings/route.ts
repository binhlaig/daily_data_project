import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import Settings from "@/lib/mongoDB/models/settings";

export async function GET() {
  const h = await headers();
  const session = await auth.api.getSession({
    headers: Object.fromEntries(h.entries()),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any)?.id ?? session.user.email; // ✅ id မရှိရင် email နဲ့ fallback

  await connectToDB();
  const doc =
    (await Settings.findOne({ userId }).lean()) ??
    (await Settings.create({ userId })).toObject();

  return NextResponse.json({ settings: doc });
}

export async function PUT(req: Request) {
  const h = await headers();
  const session = await auth.api.getSession({
    headers: Object.fromEntries(h.entries()),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any)?.id ?? session.user.email;

  const body = await req.json();

  // ✅ minimal allow-list (security)
  const patch: any = {};
  const allow = [
    "currency",
    "timezone",
    "theme",
    "notifyEmail",
    "notifyDailySummary",
    "pinLock",
    "twoFA",
  ];

  for (const k of allow) {
    if (k in body) patch[k] = body[k];
  }

  await connectToDB();
  const updated = await Settings.findOneAndUpdate(
    { userId },
    { $set: patch, $setOnInsert: { userId } },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json({ settings: updated });
}
