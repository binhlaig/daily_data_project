import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import Income from "@/lib/mongoDB/models/income";



// =========================
// ✅ GET /api/incomes
// =========================
export async function GET(req: Request) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);

    // optional query
    const month = searchParams.get("month"); // e.g. 2026-03
    const limit = Number(searchParams.get("limit") ?? "200");
    const skip = Number(searchParams.get("skip") ?? "0");
    const sort = searchParams.get("sort") ?? "-createdAt"; // default newest

    const filter: any = {};
    if (month) filter.month = month;

    const incomes = await Income.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Income.countDocuments(filter);

    return NextResponse.json({ ok: true, total, incomes });
  } catch (err: any) {
    console.error("GET /api/incomes error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Failed to fetch incomes" },
      { status: 500 }
    );
  }
}

// =========================
// ✅ POST /api/incomes
// body: { date?, amount, month, compamy?, notice? }
// =========================
export async function POST(req: Request) {
  try {
    await connectToDB();

    const body = await req.json();

    const amount = Number(body?.amount);
    const month = String(body?.month ?? "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "amount is required and must be a positive number" },
        { status: 400 }
      );
    }

    if (!month) {
      return NextResponse.json(
        { ok: false, error: "month is required" },
        { status: 400 }
      );
    }

    // ✅ keep schema field name "compamy" as you wrote (typo-safe)
    const doc = await Income.create({
      date: body?.date ? new Date(body.date) : new Date(),
      amount,
      month,
      compamy: body?.compamy ?? false,
      notice: body?.notice ?? "",
    });

    return NextResponse.json({ ok: true, income: doc }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/incomes error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Failed to create income" },
      { status: 500 }
    );
  }
}