import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import Chat from "@/lib/mongoDB/models/chat";
import Message from "@/lib/mongoDB/models/message";
import Outcome from "@/lib/mongoDB/models/outcome"; // သင့် existing model
import mongoose from "mongoose";

const toMsg = (m: any) => ({
  id: String(m._id),
  role: m.role,
  text: m.text,
  meta: m.meta ?? null,
  createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
});

async function callPythonParse(text: string) {
  const base = process.env.PY_AI_BASE_URL;
  if (!base) throw new Error("Missing PY_AI_BASE_URL");

  const r = await fetch(`${base}/parse_outcome`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    cache: "no-store",
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`Python AI error: ${detail}`);
  }

  return await r.json();
}

export const POST = async (req: NextRequest, { params }: { params: { chatId: string } }) => {
  try {
    await connectToDB();

    const { chatId } = params;
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json({ error: "Invalid chatId" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const text = (body?.text ?? "").toString().trim();
    if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

    // 1) save user message
    const userMsg = await Message.create({ chatId, role: "user", text });

    // 2) AI parse (Python)
    const parsed = await callPythonParse(text);

    const aiText =
      `Amount: ${parsed.amount ?? "-"}\n` +
      `Shop: ${parsed.shop ?? "-"}\n` +
      `Category: ${parsed.category ?? "-"} (${typeof parsed.confidence === "number" ? parsed.confidence.toFixed(2) : parsed.confidence ?? "-"})\n` +
      `Note: ${parsed.notice ?? "-"}`;

    // 3) save AI message (+ meta)
    const aiMsg = await Message.create({
      chatId,
      role: "ai",
      text: aiText,
      meta: parsed,
    });

    // 4) optional: save outcome to Mongo (your schema)
    // NOTE: သင့် current API တစ်ချို့က amount Number လုပ်ထားတယ်ဆိုလည်း,
    // model/schema နဲ့一致အောင် သင့်ဘက်က adjust လုပ်နိုင်တယ်။
    try {
      await Outcome.create({
        date: new Date(),
        month: parsed.month ?? undefined, // if python returns
        amount: parsed.amount ?? "",      // keep compatible with your schema
        shop: parsed.shop ?? "",
        bank: parsed.bank ?? "true",
        notice: `[#${parsed.category ?? "Unknown"}] ${parsed.notice ?? ""}`.trim(),
      });
    } catch (e) {
      console.log("[OUTCOME_SAVE_WARN]", e);
    }

    // 5) update chat updatedAt + title auto (if still default)
    const chat = await Chat.findById(chatId).lean();
    const maybeDefault = !chat?.title || chat?.title === "New Chat";
    if (maybeDefault) {
      const autoTitle = text.length > 28 ? text.slice(0, 28) + "…" : text;
      await Chat.findByIdAndUpdate(chatId, { title: autoTitle }, { new: true });
    } else {
      await Chat.findByIdAndUpdate(chatId, { $set: { updatedAt: new Date() } });
    }

    return NextResponse.json(
      { user: toMsg(userMsg), ai: toMsg(aiMsg), parsed },
      { status: 200 }
    );
  } catch (e: any) {
    console.log("[CHAT_SEND]", e);
    return NextResponse.json({ error: e?.message ?? "Internal Server Error" }, { status: 500 });
  }
};