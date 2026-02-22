import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs"; // important for fs

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const filepath = path.join(uploadsDir, filename);

  await fs.writeFile(filepath, buffer);

  // return public url
  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 200 });
}
