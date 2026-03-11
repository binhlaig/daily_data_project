// app/api/outcomes/route.ts
import Outcome from "@/lib/mongoDB/models/outcome";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import { NextRequest, NextResponse } from "next/server";

const toClient = (d: any) => ({
  id: String(d._id),
  date: d.date ? new Date(d.date).toISOString() : null,
  month: d.month ?? null,
  amount: d.amount ?? null,     // keep as-is (string or number)
  shop: d.shop ?? "",
  bank: d.bank ?? "",
  notice: d.notice ?? "",
  createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
  updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
});

export const GET = async () => {
  try {
    await connectToDB();

    const rows = await Outcome.find().sort({ createdAt: -1 }).lean();

    // ✅ UI-friendly output
    const data = rows.map(toClient);

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.log("[OUTCOME_GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  try {
    await connectToDB();

    const { date, month, amount, shop, bank, notice } = await req.json();

    if (amount === undefined || amount === null || String(amount).trim() === "") {
      return new NextResponse("amount is required", { status: 400 });
    }

    // ✅ IMPORTANT: Your schema earlier showed amount as String.
    // So we store as String to avoid mismatch.
    const newOutcome = await Outcome.create({
      date: date ? new Date(date) : new Date(),
      month: month ?? undefined,
      amount: String(amount), // ✅ store as string
      shop: shop ?? undefined,
      bank: bank ?? "true",
      notice: notice ?? undefined,
    });

    return NextResponse.json(toClient(newOutcome), { status: 200 });
  } catch (err) {
    console.log("[OUTCOME_POST]", err);
    return new NextResponse("Internal Server Fail", { status: 500 });
  }
};