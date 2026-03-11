// import Income from "@/lib/mongoDB/models/income";
// import Outcome from "@/lib/mongoDB/models/outcome";
// import { connectToDB } from "@/lib/mongoDB/mongoDB";
// import { NextResponse } from "next/server";

// function toYMD(d: Date) {
//   // YYYY-MM-DD
//   const y = d.getFullYear();
//   const m = String(d.getMonth() + 1).padStart(2, "0");
//   const day = String(d.getDate()).padStart(2, "0");
//   return `${y}-${m}-${day}`;
// }

// export async function GET(req: Request) {
//   await connectToDB();

//   const { searchParams } = new URL(req.url);
//   const days = Number(searchParams.get("days") ?? 30);
//   const n = Number.isFinite(days) ? Math.min(Math.max(days, 7), 180) : 30;

//   const end = new Date();
//   end.setHours(23, 59, 59, 999);

//   const start = new Date();
//   start.setDate(start.getDate() - (n - 1));
//   start.setHours(0, 0, 0, 0);

//   // Income daily
//   const incomeAgg = await Income.aggregate([
//     { $match: { createdAt: { $gte: start, $lte: end } } },
//     {
//       $group: {
//         _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//         income: { $sum: { $toDouble: "$amount" } },
//       },
//     },
//     { $sort: { _id: 1 } },
//   ]);

//   // Outcome daily
//   const outcomeAgg = await Outcome.aggregate([
//     { $match: { createdAt: { $gte: start, $lte: end } } },
//     {
//       $group: {
//         _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//         outcome: { $sum: { $toDouble: "$amount" } },
//       },
//     },
//     { $sort: { _id: 1 } },
//   ]);

//   const incomeMap = new Map(incomeAgg.map((x: any) => [x._id, Number(x.income ?? 0)]));
//   const outcomeMap = new Map(outcomeAgg.map((x: any) => [x._id, Number(x.outcome ?? 0)]));

//   // Fill missing days with 0
//   const result: Array<{ name: string; income: number; outcome: number; profit: number }> = [];
//   for (let i = 0; i < n; i++) {
//     const d = new Date(start);
//     d.setDate(start.getDate() + i);
//     const key = toYMD(d);
//     const income = incomeMap.get(key) ?? 0;
//     const outcome = outcomeMap.get(key) ?? 0;
//     result.push({ name: key, income, outcome, profit: income - outcome });
//   }

//   return NextResponse.json({ start, end, days: n, data: result });
// }


import Income from "@/lib/mongoDB/models/income";
import Outcome from "@/lib/mongoDB/models/outcome";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import { NextResponse } from "next/server";

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(req: Request) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const daysParam = Number(searchParams.get("days") ?? 30);

    const days = Number.isFinite(daysParam)
      ? Math.min(Math.max(daysParam, 7), 180)
      : 30;

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    // Income daily aggregate by "date"
    const incomeAgg = await Income.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
            },
          },
          income: {
            $sum: {
              $convert: {
                input: "$amount",
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Outcome daily aggregate by "date"
    const outcomeAgg = await Outcome.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
            },
          },
          outcome: {
            $sum: {
              $convert: {
                input: "$amount",
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const incomeMap = new Map<string, number>(
      incomeAgg.map((row: any) => [row._id, Number(row.income ?? 0)])
    );

    const outcomeMap = new Map<string, number>(
      outcomeAgg.map((row: any) => [row._id, Number(row.outcome ?? 0)])
    );

    const data: Array<{
      date: string;
      income: number;
      outcome: number;
      profit: number;
    }> = [];

    for (let i = 0; i < days; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);

      const key = toYMD(current);
      const income = incomeMap.get(key) ?? 0;
      const outcome = outcomeMap.get(key) ?? 0;

      data.push({
        date: key,
        income,
        outcome,
        profit: income - outcome,
      });
    }

    return NextResponse.json({
      success: true,
      start,
      end,
      days,
      data,
    });
  } catch (error) {
    console.error("GET /api/analytics/daily error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch daily analytics",
        data: [],
      },
      { status: 500 }
    );
  }
}