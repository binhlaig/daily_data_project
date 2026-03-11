import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text?: string };
    const input = (text ?? "").trim();
    if (!input) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const base = process.env.PY_AI_BASE_URL;
    if (!base) {
      return NextResponse.json(
        { error: "Missing PY_AI_BASE_URL" },
        { status: 500 }
      );
    }

    const r = await fetch(`${base}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
      // NOTE: App Router server fetch is fine; no-store avoids caching weirdness
      cache: "no-store",
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      return NextResponse.json(
        { error: "Python AI error", detail: errText },
        { status: 502 }
      );
    }

    const data = await r.json();
    // data example: { label:"Food", confidence:0.93 }  (or {class: idx})
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}