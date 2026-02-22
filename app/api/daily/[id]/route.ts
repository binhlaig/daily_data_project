import { DailyNote } from "@/lib/mongoDB/models/DailyNote";
import { Note } from "@/lib/mongoDB/models/Notes";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectToDB();
  const body = await req.json().catch(() => ({}));

  const patch: any = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.content === "string") patch.content = body.content;

  const doc = await DailyNote.findByIdAndUpdate(params.id, patch, {
    new: true,
  }).lean();

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: String(doc._id),
    dateKey: doc.dateKey,
    title: doc.title,
    content: doc.content,
    updatedAt: doc.updatedAt?.getTime?.() ?? Date.now(),
  });
}

type Ctx = { params: Promise<{ id: string }> };
function validId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}



export async function DELETE(_req: NextRequest, { params }: Ctx) {
  await connectToDB();

  const { id } = await params; // ✅ unwrap

  if (!validId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const deleted = await Note.findByIdAndDelete(id);

  if (!deleted) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  // ✅ Either 200 with json OR 204 no content
  return NextResponse.json({ ok: true, id }, { status: 200 });
  // or: return new NextResponse(null, { status: 204 });
}