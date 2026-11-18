  

import Income from "../mongoDB/models/income";
import Outcome from "../mongoDB/models/outcome";
import { connectToDB } from "../mongoDB/mongoDB";





type DailyPoint = { date: string; income: number; outcome: number; profit: number };

async function sumIncomeByCreatedAtRange(start?: Date, end?: Date) {
  const match =
    start && end ? [{ $match: { createdAt: { $gte: start, $lte: end } } }] : [];

  const [row] = await Income.aggregate([
    ...match,
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  return Number(row?.total ?? 0);
}

async function sumOutcomeByCreatedAtRange(start?: Date, end?: Date) {
  const match =
    start && end ? [{ $match: { createdAt: { $gte: start, $lte: end } } }] : [];

  const [row] = await Outcome.aggregate([
    ...match,
    {
      $project: {
        amountNumber: {
          $convert: {
            input: "$amount",
            to: "double",
            onError: 0,
            onNull: 0,
          },
        },
      },
    },
    { $group: { _id: null, total: { $sum: "$amountNumber" } } },
  ]);

  return Number(row?.total ?? 0);
}

function formatDayTokyo(d: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // YYYY-MM-DD
}



export async function fetchIncomesTotal() {
  try {
    await connectToDB();
    return await sumIncomeByCreatedAtRange();
  } catch (err) {
    console.log(err);
    return 0;
  }
}

// export async function fetchOutcomes() {
//   try {
//     await connectToDB();

//     const outcomes = await Outcome.find({});
//     return { outcomes, totalout: outcomes };
//   } catch (error) {
//     console.log(error);
//     return { outcomes: [], totalout: [] };
//   }
// }


// ======================================================
// ✅ NEW: TODAY TOTALS
// ======================================================

export async function fetchTodayTotals() {
  await connectToDB();

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const [incomeToday, outcomeToday] = await Promise.all([
    sumIncomeByCreatedAtRange(start, end),
    sumOutcomeByCreatedAtRange(start, end),
  ]);

  return {
    incomeToday,
    outcomeToday,
    profitToday: incomeToday - outcomeToday,
  };
}


// ======================================================
// ✅ NEW: MONTH TOTALS
// ======================================================

export async function fetchMonthTotals() {
  await connectToDB();

  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [incomeMonth, outcomeMonth] = await Promise.all([
    sumIncomeByCreatedAtRange(start, end),
    sumOutcomeByCreatedAtRange(start, end),
  ]);

  return {
    incomeMonth,
    outcomeMonth,
    profitMonth: incomeMonth - outcomeMonth,
  };
}




function tokyoLikeRange(timezone: string, type: "today" | "month") {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);

  // timezone offset ကို JS ကမပေးလို့ simple approach:
  // ✅ Most apps: server timezone ကို Japan (or same) ထားထားရင် OK
  // ✅ If you deploy elsewhere & need perfect TZ: ပြောပါ—full TZ UTC conversion version ပေးမယ်။

  if (type === "today") {
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    const end = new Date(y, m - 1, d, 23, 59, 59, 999);
    return { start, end };
  } else {
    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 0, 23, 59, 59, 999);
    return { start, end };
  }
}

export async function fetchTodayTotalsTZ(timezone = "Asia/Tokyo") {
  await connectToDB();
  const { start, end } = tokyoLikeRange(timezone, "today");
  const [incomeToday, outcomeToday] = await Promise.all([
    sumIncomeByCreatedAtRange(start, end),
    sumOutcomeByCreatedAtRange(start, end),
  ]);

  return { incomeToday, outcomeToday, profitToday: incomeToday - outcomeToday };
}

export async function fetchMonthTotalsTZ(timezone = "Asia/Tokyo") {
  await connectToDB();
  const { start, end } = tokyoLikeRange(timezone, "month");
  const [incomeMonth, outcomeMonth] = await Promise.all([
    sumIncomeByCreatedAtRange(start, end),
    sumOutcomeByCreatedAtRange(start, end),
  ]);

  return { incomeMonth, outcomeMonth, profitMonth: incomeMonth - outcomeMonth };
}




export async function fetchDailySeries(days = 14): Promise<DailyPoint[]> {
  await connectToDB();

  const now = new Date();
  const endLabel = formatDayTokyo(now);

  // Build date labels (YYYY-MM-DD) for last N days
  const labels: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    labels.push(formatDayTokyo(d));
  }

  // Get start/end Date range in server local time (OK for Japan-hosting; if deploy elsewhere, tell me—I'll give full UTC conversion)
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const incomes = await Income.find({ createdAt: { $gte: start, $lte: end } }).lean();
  const outcomes = await Outcome.find({ createdAt: { $gte: start, $lte: end } }).lean();


 
  const mapIncome = new Map<string, number>();
  const mapOutcome = new Map<string, number>();

  for (const it of incomes) {
    const label = formatDayTokyo(new Date((it as any).createdAt));
    mapIncome.set(label, (mapIncome.get(label) ?? 0) + Number((it as any).amount ?? 0));
  }
  for (const it of outcomes) {
    const label = formatDayTokyo(new Date((it as any).createdAt));
    mapOutcome.set(label, (mapOutcome.get(label) ?? 0) + Number((it as any).amount ?? 0));
  }

  return labels.map((date) => {
    const income = mapIncome.get(date) ?? 0;
    const outcome = mapOutcome.get(date) ?? 0;
    return { date, income, outcome, profit: income - outcome };
  });
}


export async function fetchOutcomes() {
  try {
    await connectToDB();

    const outcomes = await Outcome.find({}).lean();

    const safe = outcomes.map((o: any) => ({
      ...o,
      _id: String(o._id),
      date: o.date ? new Date(o.date).toISOString() : null,
      createdAt: o.createdAt?.toISOString?.() ?? null,
      updatedAt: o.updatedAt?.toISOString?.() ?? null,
    }));

    return { outcomes: safe, totalout: safe };

  } catch (error) {
    console.log(error);
    return { outcomes: [], totalout: [] };
  }
}

export async function fetchIncomes() {
  try {
    await connectToDB();
    // ✅ lean() => plain objects (ပို safe)
    const incomes = await Income.find({}).lean();
    return incomes;
  } catch (e) {
    console.log(e);
    return [];
  }
}


export async function totalOutcometest() {
  try {
    await connectToDB();
    return await sumOutcomeByCreatedAtRange();
  } catch (e) {
    console.log(e);
    return 0;
  }
}
