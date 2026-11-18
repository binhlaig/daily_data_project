
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import Chat from "@/lib/mongoDB/models/chat";
import Message from "@/lib/mongoDB/models/message";
import Outcome from "@/lib/mongoDB/models/outcome";
import mongoose from "mongoose";

const toMsg = (m: any) => ({
  id: String(m._id),
  role: m.role,
  text: m.text,
  meta: m.meta ?? null,
  createdAt: m.createdAt
    ? new Date(m.createdAt).toISOString()
    : null,
});

async function callPythonParse(text: string) {
  const base = process.env.PY_AI_BASE_URL;

  if (!base) {
    throw new Error("Missing PY_AI_BASE_URL");
  }

  const r = await fetch(`${base}/parse_outcome`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
    cache: "no-store",
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`Python AI error: ${detail}`);
  }

  return await r.json();
}

// Next.js 15/16 compatible POST route
export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) => {
  try {
    await connectToDB();

    // Await dynamic route params
    const { chatId } = await params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json(
        { error: "Invalid chatId" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const text = (body?.text ?? "").toString().trim();

    if (!text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    // 1) Save user message
    const userMsg = await Message.create({
      chatId,
      role: "user",
      text,
    });

    // 2) AI parse (Python)
    const parsed = await callPythonParse(text);

    const aiText =
      `Amount: ${parsed.amount ?? "-"}\n` +
      `Shop: ${parsed.shop ?? "-"}\n` +
      `Category: ${parsed.category ?? "-"} (${
        typeof parsed.confidence === "number"
          ? parsed.confidence.toFixed(2)
          : parsed.confidence ?? "-"
      })\n` +
      `Note: ${parsed.notice ?? "-"}`;

    // 3) Save AI message
    const aiMsg = await Message.create({
      chatId,
      role: "ai",
      text: aiText,
      meta: parsed,
    });

    // 4) Save outcome to MongoDB
    try {
      await Outcome.create({
        date: new Date(),
        month: parsed.month ?? undefined,
        amount: parsed.amount ?? "",
        shop: parsed.shop ?? "",
        bank: parsed.bank ?? "true",
        notice: `[#${parsed.category ?? "Unknown"}] ${
          parsed.notice ?? ""
        }`.trim(),
      });
    } catch (e) {
      console.error("[OUTCOME_SAVE_WARN]", e);
    }

    // 5) Update chat title and updatedAt
    const chat = await Chat.findById(chatId).lean();

    const maybeDefault =
      !chat?.title || chat?.title === "New Chat";

    if (maybeDefault) {
      const autoTitle =
        text.length > 28
          ? text.slice(0, 28) + "…"
          : text;

      await Chat.findByIdAndUpdate(
        chatId,
        { title: autoTitle },
        { new: true }
      );
    } else {
      await Chat.findByIdAndUpdate(chatId, {
        $set: {
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json(
      {
        user: toMsg(userMsg),
        ai: toMsg(aiMsg),
        parsed,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[CHAT_SEND]", e);

    return NextResponse.json(
      {
        error: e?.message ?? "Internal Server Error",
      },
      { status: 500 }
    );
  }
};
