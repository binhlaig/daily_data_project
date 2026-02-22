import { DailyNote } from "@/lib/mongoDB/models/DailyNote";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import { NextResponse } from "next/server";

function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export async function GET() {
    await connectToDB();
    const key = todayKey();

    const doc = await DailyNote.findOneAndUpdate(
        { dateKey: key },
        { $setOnInsert: { dateKey: key, title: key, content: "" } },
        { new: true, upsert: true }).lean();


        return NextResponse.json({
            id: String(doc._id),
            dateKey: doc!.dateKey,
            title: doc!.title,
            content: doc!.content,
            updatedAt:doc!.updatedAt?.getTime?.() ?? Date.now(),

        })
}