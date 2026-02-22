

// app/api/outcome/route.ts

import Outcome from "@/lib/mongoDB/models/outcome";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import { NextRequest, NextResponse } from "next/server";

export const GET = async () => {
  try {
    await connectToDB();

    // ✅ createdAt (createAt မဟုတ်)
    const outcome = await Outcome.find().sort({ createdAt: -1 });

    return NextResponse.json(outcome, { status: 200 });
  } catch (err) {
    console.log("[OutCome_GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  try {
    await connectToDB();

    const { date, month, amount, shop, bank, notice } = await req.json();

    // ✅ basic validation (optional but recommended)
    if (amount === undefined || amount === null) {
      return new NextResponse("amount is required", { status: 400 });
    }

    const newOutcome = await Outcome.create({
      date,
      month,
      amount: Number(amount),
      shop,
      bank,
      notice,
    });

    return NextResponse.json(newOutcome, { status: 200 });
  } catch (err) {
    console.log("[OUT_Data_POST]", err);
    return new NextResponse("Internal Server Fail", { status: 500 });
  }
};
