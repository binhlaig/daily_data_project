"use server";

import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoDB/mongoDB";
import Outcome from "../mongoDB/models/outcome";

type ActionState =
  | { ok: true }
  | { ok: false; message: string };

function toNumber(v: FormDataEntryValue | null) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function createOutcomeAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const amount = toNumber(formData.get("amount"));
    const shop = String(formData.get("shop") ?? "").trim();
    const bank = String(formData.get("bank") ?? "").trim();
    const notice = String(formData.get("notice") ?? "").trim();
    const dateStr = String(formData.get("date") ?? "").trim(); // "YYYY-MM-DD" expected

    if (!amount || amount <= 0) return { ok: false, message: "Amount မမှန်ပါ" };
    if (!shop) return { ok: false, message: "Shop လိုအပ်ပါတယ်" };

    await connectToDB();

    await Outcome.create({
      amount,
      shop,
      bank,
      notice,
      date: dateStr ? new Date(dateStr) : new Date(),
    });

    // ✅ Outcome page ကို cache invalidate
    revalidatePath("/dashboard/outcome");
    // (dashboard summary တွေလည်း outcome သုံးနေတယ်ဆို)
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Create failed" };
  }
}

export async function deleteOutcomeAction(id: string): Promise<ActionState> {
  try {
    await connectToDB();
    await Outcome.findByIdAndDelete(id);

    revalidatePath("/dashboard/outcome");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Delete failed" };
  }
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
  