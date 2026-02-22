import Income from "@/lib/mongoDB/models/income";
import Outcome from "@/lib/mongoDB/models/outcome";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import { NextResponse } from "next/server";

function toYMD(d: Date) {
  // YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(req: Request) {
  await connectToDB();

  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") ?? 30);
  const n = Number.isFinite(days) ? Math.min(Math.max(days, 7), 180) : 30;

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setDate(start.getDate() - (n - 1));
  start.setHours(0, 0, 0, 0);

  // Income daily
  const incomeAgg = await Income.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        income: { $sum: { $toDouble: "$amount" } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Outcome daily
  const outcomeAgg = await Outcome.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        outcome: { $sum: { $toDouble: "$amount" } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const incomeMap = new Map(incomeAgg.map((x: any) => [x._id, Number(x.income ?? 0)]));
  const outcomeMap = new Map(outcomeAgg.map((x: any) => [x._id, Number(x.outcome ?? 0)]));

  // Fill missing days with 0
  const result: Array<{ name: string; income: number; outcome: number; profit: number }> = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toYMD(d);
    const income = incomeMap.get(key) ?? 0;
    const outcome = outcomeMap.get(key) ?? 0;
    result.push({ name: key, income, outcome, profit: income - outcome });
  }

  return NextResponse.json({ start, end, days: n, data: result });
}
