import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import Chat from "@/lib/mongoDB/models/chat";

const toClient = (c: any) => ({
  id: String(c._id),
  title: c.title ?? "New Chat",
  updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : null,
  createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null,
});

export const GET = async () => {
  try {
    await connectToDB();
    const chats = await Chat.find().sort({ updatedAt: -1 }).lean();
    return NextResponse.json(chats.map(toClient), { status: 200 });
  } catch (e) {
    console.log("[CHATS_GET]", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  try {
    await connectToDB();
    const body = await req.json().catch(() => ({}));
    const title = (body?.title ?? "New Chat").toString().trim() || "New Chat";

    const chat = await Chat.create({ title });
    return NextResponse.json(toClient(chat), { status: 201 });
  } catch (e) {
    console.log("[CHATS_POST]", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};