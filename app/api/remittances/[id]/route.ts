import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectToDB } from "@/lib/mongoDB/mongoDB";
import Remittance from "@/lib/mongoDB/models/remittance";

type RemittanceStatus = "pending" | "paid" | "cancelled";
type RouteContext = { params: Promise<{ id: string }> };

type UpdateInput = {
  status?: unknown;
};

const statuses = new Set<RemittanceStatus>(["pending", "paid", "cancelled"]);

function validId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function cleanStatus(value: unknown): RemittanceStatus | null {
  return statuses.has(value as RemittanceStatus)
    ? (value as RemittanceStatus)
    : null;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await connectToDB();

    const { id } = await context.params;
    const body = (await req.json()) as UpdateInput;
    const status = cleanStatus(body.status);

    if (!validId(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid remittance id" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { ok: false, error: "Valid status is required" },
        { status: 400 }
      );
    }

    const doc = await Remittance.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!doc) {
      return NextResponse.json(
        { ok: false, error: "Remittance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/remittances/[id] error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update remittance" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    await connectToDB();

    const { id } = await context.params;

    if (!validId(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid remittance id" },
        { status: 400 }
      );
    }

    const doc = await Remittance.findByIdAndDelete(id);

    if (!doc) {
      return NextResponse.json(
        { ok: false, error: "Remittance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/remittances/[id] error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete remittance" },
      { status: 500 }
    );
  }
}
