// app/api/ai/next-steps/route.ts
import { NextResponse } from "next/server";

/**
 * Proxy to FastAPI /next_steps
 * - Set FASTAPI_BASE in .env.local (recommended)
 *   FASTAPI_BASE="http://localhost:8000"
 *
 * Then this route becomes:
 *   GET /api/ai/next-steps  ->  {FASTAPI_BASE}/next_steps
 */
export async function GET() {
  try {
    const base = process.env.FASTAPI_BASE || "http://localhost:8000";
    const url = `${base.replace(/\/$/, "")}/next_steps`;

    const r = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      // avoid caching in Next.js route handlers
      cache: "no-store",
    });

    const contentType = r.headers.get("content-type") || "";

    if (!r.ok) {
      const errText = contentType.includes("application/json")
        ? JSON.stringify(await r.json().catch(() => ({})))
        : await r.text().catch(() => "");

      return NextResponse.json(
        {
          intent: "next_steps_report",
          answer: "❌ FastAPI /next_steps error",
          error: `HTTP ${r.status}: ${errText.slice(0, 500)}`,
          report: null,
        },
        { status: 200 } // keep 200 so UI can display message cleanly
      );
    }

    const data = contentType.includes("application/json")
      ? await r.json()
      : { raw: await r.text().catch(() => "") };

    // Ensure consistent shape for the chat UI:
    // - data may already be: { intent, answer, report }
    // - if not, wrap it
    if (data?.intent === "next_steps_report") {
      return NextResponse.json(data, { status: 200 });
    }

    return NextResponse.json(
      {
        intent: "next_steps_report",
        answer: data?.answer ?? "Next steps report",
        report: data?.report ?? data,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        intent: "next_steps_report",
        answer:
          "❌ Cannot reach FastAPI. FASTAPI_BASE / server port ကိုစစ်ပါ။",
        error: String(e?.message ?? e),
        report: null,
      },
      { status: 200 }
    );
  }
}