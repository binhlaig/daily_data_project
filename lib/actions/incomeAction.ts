"use server";

import { connectToDB } from "@/lib/mongoDB/mongoDB";
import Income from "@/lib/mongoDB/models/income";
import { revalidatePath } from "next/cache";

export type IncomeActionState = { ok: boolean; message?: string };

function toNumber(v: FormDataEntryValue | null) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : NaN;
}

function toStr(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

export async function createIncomeAction(
  _prev: IncomeActionState,
  fd: FormData
): Promise<IncomeActionState> {
  try {
    const amount = toNumber(fd.get("amount"));
    const month = toStr(fd.get("month"));
    const compamy = toStr(fd.get("compamy")); // ✅ သင့် field name အတိုင်း
    const notice = toStr(fd.get("notice"));
    const dateRaw = toStr(fd.get("date")); // ISO string

    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, message: "Amount မှန်အောင်ထည့်ပါ" };
    }
    if (!month) return { ok: false, message: "Month မဖြစ်မနေလိုပါတယ်" };
    if (!compamy) return { ok: false, message: "Company မဖြစ်မနေလိုပါတယ်" };

    const date = dateRaw ? new Date(dateRaw) : new Date();
    if (Number.isNaN(date.getTime())) {
      return { ok: false, message: "Date မမှန်ပါ" };
    }

    await connectToDB();

    // ⚠️ Model ထဲမှာ field က company ဆိုရင် company: compamy လုပ်ပါ
    await Income.create({
      amount,
      month,
      compamy,
      notice,
      date,
    });

    return { ok: true };
  } catch (e: any) {
    console.error("[createIncomeAction]", e);
    return { ok: false, message: e?.message ?? "Create income failed" };
  }
}


export async function deleteIncomeAction(id: string) {
    if (!id) throw new Error("Missing id");
  
    await connectToDB();
    await Income.findByIdAndDelete(id);
  
    // ✅ သင့် route အလိုက် ပြင်ပါ
    revalidatePath("/income");
    revalidatePath("/dashboard");
  
    return { ok: true as const };
  }