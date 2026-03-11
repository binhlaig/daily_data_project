import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import Chat from "@/lib/mongoDB/models/chat";
import Message from "@/lib/mongoDB/models/message";
import mongoose from "mongoose";

export const DELETE = async (_req: Request, { params }: { params: { chatId: string } }) => {
  try {
    await connectToDB();

    const { chatId } = params;
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json({ error: "Invalid chatId" }, { status: 400 });
    }

    await Message.deleteMany({ chatId });
    await Chat.findByIdAndDelete(chatId);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.log("[CHAT_DELETE]", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};