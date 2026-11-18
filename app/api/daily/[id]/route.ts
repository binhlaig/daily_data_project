
import { DailyNote } from "@/lib/mongoDB/models/DailyNote";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// Next.js 15/16 Dynamic Route Context
type Ctx = {
  params: Promise<{ id: string }>;
};

// MongoDB ObjectId validation
function validId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

// PATCH - Update Daily Note
export async function PATCH(
  req: NextRequest,
  { params }: Ctx
) {
  try {
    await connectToDB();

    const { id } = await params;

    if (!validId(id)) {
      return NextResponse.json(
        { error: "Invalid id" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const patch: {
      title?: string;
      content?: string;
    } = {};

    if (typeof body.title === "string") {
      patch.title = body.title;
    }

    if (typeof body.content === "string") {
      patch.content = body.content;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const doc = await DailyNote.findByIdAndUpdate(
      id,
      { $set: patch },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!doc) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        id: String(doc._id),
        dateKey: doc.dateKey,
        title: doc.title,
        content: doc.content,
        updatedAt:
          doc.updatedAt?.getTime?.() ?? Date.now(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DAILY_PATCH]", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete Daily Note
export async function DELETE(
  _req: NextRequest,
  { params }: Ctx
) {
  try {
    await connectToDB();

    const { id } = await params;

    if (!validId(id)) {
      return NextResponse.json(
        { error: "Invalid id" },
        { status: 400 }
      );
    }

    const deleted = await DailyNote.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Daily Note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DAILY_DELETE]", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
