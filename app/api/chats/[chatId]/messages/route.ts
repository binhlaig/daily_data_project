import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import Message from "@/lib/mongoDB/models/message";
import mongoose from "mongoose";

export const runtime = "nodejs";

const toClient = (m: any) => ({
  id: String(m._id),
  role: m.role,
  text: m.text,
  meta: m.meta ?? null,
  createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
});

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ chatId: string }> }
) {
  try {
    await connectToDB();

    const { chatId } = await ctx.params; // ✅ IMPORTANT (params is Promise)

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json({ error: "Invalid chatId" }, { status: 400 });
    }

    const msgs = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json(msgs.map(toClient), { status: 200 });
  } catch (e) {
    console.log("[MESSAGES_GET]", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}