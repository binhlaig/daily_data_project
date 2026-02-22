import Outcome from "../mongoDB/models/outcome";
import { connectToDB } from "../mongoDB/mongoDB";

export type OutcomeRow = {
  _id: string;
  title?: string;
  note?: string;
  category?: string;
  amount: number;
  createdAt?: string;
};

export async function fetchOutcomesTable() {
  await connectToDB();

  const docs = await Outcome.find({})
    .sort({ createdAt: -1 })
    .lean();

  const rows: OutcomeRow[] = docs.map((d: any) => ({
    _id: String(d._id),
    title: d.title ?? d.name ?? "Outcome",
    note: d.note ?? "",
    category: d.category ?? "General",
    amount: Number(d.amount ?? 0),
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
  }));

  const total = rows.reduce((acc, r) => acc + Number(r.amount || 0), 0);

  return { rows, total };
}

