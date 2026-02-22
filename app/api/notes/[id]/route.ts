// app/api/notes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import { Note } from "@/lib/mongoDB/models/Notes";

function validId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, { params }: Ctx) {
  await connectToDB();

  const { id } = await params; // ✅ Promise unwrap here

  if (!validId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json();

  const updated = await Note.findByIdAndUpdate(id, body, { new: true });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated, { status: 200 });
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