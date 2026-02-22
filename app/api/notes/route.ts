import { Note } from "@/lib/mongoDB/models/Notes";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import { NextResponse } from "next/server";

export async function GET() {
  await connectToDB();

  const docs = await Note.find().sort({ updatedAt: -1 }).lean();

  const notes = docs.map((n: any) => ({
    id: String(n._id),
    title: n.title ?? "Untitled",
    content: n.content ?? "",
    updatedAt: n.updatedAt ? new Date(n.updatedAt).getTime() : Date.now(),
  }));

  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  await connectToDB();

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title : "Untitled";
  const content = typeof body.content === "string" ? body.content : "";

  const doc = await Note.create({ title, content });

  return NextResponse.json(
    {
      id: String(doc._id),
      title: doc.title,
      content: doc.content,
      updatedAt: doc.updatedAt ? doc.updatedAt.getTime() : Date.now(),
    },
    { status: 201 }
  );
}