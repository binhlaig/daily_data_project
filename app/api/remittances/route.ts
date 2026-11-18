import { NextRequest, NextResponse } from "next/server";

import { connectToDB } from "@/lib/mongoDB/mongoDB";
import Remittance from "@/lib/mongoDB/models/remittance";

type RemittanceStatus = "pending" | "paid" | "cancelled";

type RemittanceInput = {
  date?: unknown;
  customerName?: unknown;
  receiverName?: unknown;
  receiverPhone?: unknown;
  payoutMethod?: unknown;
  yenAmount?: unknown;
  exchangeRate?: unknown;
  serviceFee?: unknown;
  status?: unknown;
  note?: unknown;
};

type RemittanceDoc = RemittanceInput & {
  _id?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const statuses = new Set<RemittanceStatus>(["pending", "paid", "cancelled"]);

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function cleanNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function cleanDate(value: unknown) {
  const date = value ? new Date(value as string | Date) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function cleanStatus(value: unknown): RemittanceStatus {
  return statuses.has(value as RemittanceStatus)
    ? (value as RemittanceStatus)
    : "pending";
}

function toClient(doc: RemittanceDoc) {
  return {
    id: String(doc._id),
    date: doc.date ? new Date(doc.date as string | Date).toISOString().slice(0, 10) : "",
    customerName: cleanString(doc.customerName),
    receiverName: cleanString(doc.receiverName),
    receiverPhone: cleanString(doc.receiverPhone),
    payoutMethod: cleanString(doc.payoutMethod),
    yenAmount: cleanNumber(doc.yenAmount),
    exchangeRate: cleanNumber(doc.exchangeRate),
    serviceFee: cleanNumber(doc.serviceFee),
    status: cleanStatus(doc.status),
    note: cleanString(doc.note),
    createdAt: doc.createdAt
      ? new Date(doc.createdAt as string | Date).toISOString()
      : null,
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt as string | Date).toISOString()
      : null,
  };
}

export async function GET() {
  try {
    await connectToDB();

    const rows = await Remittance.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      { ok: true, remittances: rows.map((row) => toClient(row as RemittanceDoc)) },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/remittances error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch remittances" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = (await req.json()) as RemittanceInput;
    const customerName = cleanString(body.customerName);
    const receiverName = cleanString(body.receiverName);
    const payoutMethod = cleanString(body.payoutMethod);
    const yenAmount = cleanNumber(body.yenAmount);
    const exchangeRate = cleanNumber(body.exchangeRate);

    if (!customerName || !receiverName || !payoutMethod) {
      return NextResponse.json(
        { ok: false, error: "Customer, receiver and payout method are required" },
        { status: 400 }
      );
    }

    if (yenAmount <= 0 || exchangeRate <= 0) {
      return NextResponse.json(
        { ok: false, error: "JPY amount and exchange rate must be positive" },
        { status: 400 }
      );
    }

    const doc = await Remittance.create({
      date: cleanDate(body.date),
      customerName,
      receiverName,
      receiverPhone: cleanString(body.receiverPhone),
      payoutMethod,
      yenAmount,
      exchangeRate,
      serviceFee: cleanNumber(body.serviceFee),
      status: cleanStatus(body.status),
      note: cleanString(body.note),
    });

    return NextResponse.json(
      { ok: true, remittance: toClient(doc as RemittanceDoc) },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/remittances error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create remittance" },
      { status: 500 }
    );
  }
}
