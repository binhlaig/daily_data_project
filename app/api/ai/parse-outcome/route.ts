
// // app/api/ai/parse-outcome/route.ts
// import { NextResponse } from "next/server";

// type Intent =
//   | "create_outcome"
//   | "query_outcome"
//   | "list_outcomes"
//   | "next_steps_report"
//   | "charts_outcomes"
//   | "outcome_image"
//   | "poster_image"; // ✅ NEW

// type ChartSeries = {
//   trend?: { x: string; y: number }[];
//   byShop?: { name: string; value: number }[];
//   byCategory?: { name: string; value: number }[];
//   byBank?: { name: string; value: number }[];
// };

// type ImagePayload = {
//   data_url?: string | null; // "data:image/png;base64,..."
//   mime?: string | null; // "image/png"
//   title?: string | null;
// };

// type Normalized = {
//   intent: Intent;

//   // create_outcome
//   amount?: number | string | null;
//   shop?: string | null;
//   category?: string | null;
//   notice?: string | null;
//   bank?: string | null;
//   confidence?: number | null;
//   needs_confirm?: boolean | null;

//   // query_outcome
//   metric?: "total" | "byShop" | "count" | "last" | string;
//   from?: string | null;
//   to?: string | null;
//   data?: any;

//   // list_outcomes
//   count?: number | null;
//   items?: any[] | null;
//   meta?: any | null;

//   // next_steps_report
//   report?: any | null;

//   // charts_outcomes
//   series?: ChartSeries | null;
//   filters?: any | null;

//   // ✅ image
//   image?: ImagePayload | null;

//   // drafting
//   answer_lines?: string[] | null;

//   answer: string;
// };

// const OUTPUT_MODE =
//   (process.env.AI_OUTPUT_MODE as
//     | "answer_only"
//     | "amount_only"
//     | "shop_only"
//     | "amount_shop"
//     | "full"
//     | undefined) ?? "answer_only";

// function num(v: any): number | null {
//   if (v === null || v === undefined) return null;
//   if (typeof v === "number") return Number.isFinite(v) ? v : null;
//   const s = String(v).replace(/[^\d.-]/g, "");
//   if (!s) return null;
//   const n = Number(s);
//   return Number.isFinite(n) ? n : null;
// }

// function pickItems(raw: any): any[] | null {
//   if (Array.isArray(raw?.items)) return raw.items;
//   if (Array.isArray(raw?.data) && raw?.intent === "list_outcomes") return raw.data;
//   if (Array.isArray(raw?.outcomes)) return raw.outcomes;
//   if (Array.isArray(raw?.rows)) return raw.rows;

//   if (Array.isArray(raw?.payload?.items)) return raw.payload.items;
//   if (Array.isArray(raw?.result?.items)) return raw.result.items;

//   return null;
// }

// function pickAnswerLines(raw: any): string[] | null {
//   const al =
//     (Array.isArray(raw?.answer_lines) ? raw.answer_lines : null) ??
//     (Array.isArray(raw?.payload?.answer_lines) ? raw.payload.answer_lines : null);
//   if (!al) return null;
//   return al.map((x: any) => String(x)).filter(Boolean);
// }

// function pickSeries(raw: any): ChartSeries | null {
//   const s =
//     raw?.series ??
//     raw?.payload?.series ??
//     raw?.chart?.series ??
//     raw?.payload?.chart?.series ??
//     null;

//   if (!s || typeof s !== "object") return null;

//   const out: ChartSeries = {};
//   if (Array.isArray(s.trend)) out.trend = s.trend;
//   if (Array.isArray(s.byShop)) out.byShop = s.byShop;
//   if (Array.isArray(s.byCategory)) out.byCategory = s.byCategory;
//   if (Array.isArray(s.byBank)) out.byBank = s.byBank;

//   return out;
// }

// function pickChartFilters(raw: any): any | null {
//   return (
//     raw?.filters ??
//     raw?.payload?.filters ??
//     raw?.chart?.filters ??
//     raw?.payload?.chart?.filters ??
//     null
//   );
// }

// // ✅ image picker
// function pickImage(raw: any): ImagePayload | null {
//   const img = raw?.image ?? raw?.payload?.image ?? null;
//   if (!img || typeof img !== "object") return null;

//   const data_url =
//     typeof img?.data_url === "string" && img.data_url.startsWith("data:image/")
//       ? img.data_url
//       : null;

//   return {
//     data_url,
//     mime: typeof img?.mime === "string" ? img.mime : null,
//     title: typeof img?.title === "string" ? img.title : null,
//   };
// }

// function makeAnswerFromRaw(d: any): string {
//   if (d?.intent === "outcome_image") return "Outcome image ready ✅";
//   if (d?.intent === "poster_image") return "Poster image ready ✅";

//   const items = pickItems(d);

//   if (d?.intent === "charts_outcomes") {
//     const s = pickSeries(d);
//     const pts = Array.isArray(s?.trend) ? s!.trend!.length : 0;
//     return pts > 0 ? `Chart ready (${pts} points)` : "Chart ready";
//   }

//   if (typeof d?.count === "number") return `Outcome count: ${d.count}`;
//   if (items) return `Outcome count: ${items.length}`;

//   if (d?.intent === "query_outcome") {
//     if (typeof d?.data === "number") return `Total: ¥${d.data.toLocaleString()}`;
//     const nd = num(d?.data);
//     if (nd !== null) return `Total: ¥${nd.toLocaleString()}`;
//   }

//   const amount = num(d?.amount);
//   const shop = typeof d?.shop === "string" ? d.shop : null;
//   const category = typeof d?.category === "string" ? d.category : null;

//   if (amount !== null) return `¥${amount}${shop ? ` (${shop})` : ""}`;
//   if (shop) return shop;
//   if (category) return category;
//   return "OK";
// }

// function normalizeIntent(raw: any): Intent {
//   const i = String(raw?.intent ?? "").trim();
//   if (
//     i === "create_outcome" ||
//     i === "query_outcome" ||
//     i === "list_outcomes" ||
//     i === "next_steps_report" ||
//     i === "charts_outcomes" ||
//     i === "outcome_image" ||
//     i === "poster_image"
//   ) return i as Intent;

//   return "create_outcome";
// }

// function normalize(raw: any): Normalized {
//   const intent = normalizeIntent(raw);
//   const items = pickItems(raw);

//   const answer =
//     typeof raw?.answer === "string" && raw.answer.trim()
//       ? raw.answer.trim()
//       : makeAnswerFromRaw(raw);

//   const count =
//     typeof raw?.count === "number"
//       ? raw.count
//       : typeof raw?.meta?.total === "number"
//       ? raw.meta.total
//       : items
//       ? items.length
//       : null;

//   const answer_lines = pickAnswerLines(raw);
//   const series = pickSeries(raw);
//   const filters = pickChartFilters(raw);
//   const image = pickImage(raw);

//   return {
//     intent,

//     amount: raw?.amount ?? raw?.payload?.amount ?? null,
//     shop: raw?.shop ?? raw?.payload?.shop ?? null,
//     category: raw?.category ?? raw?.payload?.category ?? null,
//     notice: raw?.notice ?? raw?.payload?.notice ?? null,
//     bank: raw?.bank ?? raw?.payload?.bank ?? null,
//     confidence:
//       typeof raw?.confidence === "number"
//         ? raw.confidence
//         : num(raw?.confidence ?? raw?.payload?.confidence) ?? null,
//     needs_confirm:
//       typeof raw?.needs_confirm === "boolean"
//         ? raw.needs_confirm
//         : typeof raw?.payload?.needs_confirm === "boolean"
//         ? raw.payload.needs_confirm
//         : null,

//     metric: raw?.metric ?? raw?.payload?.metric ?? null,
//     from: raw?.from ?? raw?.payload?.from ?? null,
//     to: raw?.to ?? raw?.payload?.to ?? null,
//     data: raw?.data ?? raw?.payload?.data ?? null,

//     count,
//     items: items ?? null,
//     meta: raw?.meta ?? raw?.payload?.meta ?? null,

//     report: raw?.report ?? raw?.payload?.report ?? null,

//     series: series ?? null,
//     filters: filters ?? null,

//     image: image ?? null,

//     answer_lines: answer_lines ?? null,
//     answer,
//   };
// }

// function formatOutput(n: Normalized) {
//   switch (OUTPUT_MODE) {
//     case "amount_only": {
//       const a = num(n.amount);
//       return { answer: `¥${a ?? "-"}`, intent: n.intent };
//     }
//     case "shop_only": {
//       return { answer: `${n.shop ?? "-"}`, intent: n.intent };
//     }
//     case "amount_shop": {
//       const a = num(n.amount);
//       const s = n.shop ? ` (${n.shop})` : "";
//       return { answer: `¥${a ?? "-"}${s}`, intent: n.intent };
//     }
//     case "full": {
//       return n;
//     }
//     case "answer_only":
//     default: {
//       return {
//         answer: n.answer,
//         intent: n.intent,
//         payload: {
//           answer_lines: n.answer_lines,

//           amount: n.amount,
//           shop: n.shop,
//           category: n.category,
//           notice: n.notice,
//           bank: n.bank,
//           confidence: n.confidence,
//           needs_confirm: n.needs_confirm,

//           metric: n.metric,
//           from: n.from,
//           to: n.to,
//           data: n.data,

//           count: n.count,
//           meta: n.meta,
//           items: n.items,

//           report: n.report,

//           series: n.series,
//           filters: n.filters,

//           image: n.image,
//         },
//       };
//     }
//   }
// }

// export async function POST(req: Request) {
//   try {
//     const { text } = (await req.json()) as { text?: string };
//     const input = (text ?? "").trim();
//     if (!input) {
//       return NextResponse.json({ error: "text is required" }, { status: 400 });
//     }

//     const base = process.env.PY_AI_BASE_URL;
//     if (!base) {
//       return NextResponse.json({ error: "Missing PY_AI_BASE_URL" }, { status: 500 });
//     }

//     const r = await fetch(`${base}/parse_outcome`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ text: input }),
//       cache: "no-store",
//     });

//     if (!r.ok) {
//       const detail = await r.text().catch(() => "");
//       return NextResponse.json(
//         { error: "Python AI error", status: r.status, detail },
//         { status: 502 }
//       );
//     }

//     const raw = await r.json();

//     if (raw?.error) {
//       return NextResponse.json({ error: raw.error, detail: raw }, { status: 400 });
//     }

//     const normalized = normalize(raw);
//     const output = formatOutput(normalized);

//     return NextResponse.json(output);
//   } catch (e: any) {
//     return NextResponse.json(
//       { error: e?.message ?? "Unknown error" },
//       { status: 500 }
//     );
//   }
// }




// app/api/ai/parse-outcome/route.ts
import { NextResponse } from "next/server";

type Intent =
  | "create_outcome"
  | "query_outcome"
  | "list_outcomes"
  | "next_steps_report"
  | "charts_outcomes"
  | "outcome_image"
  | "poster_image";

type ChartSeries = {
  trend?: { x: string; y: number }[];
  byShop?: { name: string; value: number }[];
  byCategory?: { name: string; value: number }[];
  byBank?: { name: string; value: number }[];
};

type ImagePayload = {
  data_url?: string | null;
  mime?: string | null;
  title?: string | null;
};

type PosterPayload = {
  size?: string | null;
  title?: string | null;
  subtitle?: string | null;
  bullets?: string[] | null;
  footer?: string | null;
  theme?: string | null;
  style?: string | null;
};

type Normalized = {
  intent: Intent;

  // create_outcome
  amount?: number | string | null;
  shop?: string | null;
  category?: string | null;
  notice?: string | null;
  bank?: string | null;
  confidence?: number | null;
  needs_confirm?: boolean | null;

  // query_outcome
  metric?: "total" | "byShop" | "count" | "last" | string;
  from?: string | null;
  to?: string | null;
  data?: any;

  // list_outcomes
  count?: number | null;
  items?: any[] | null;
  meta?: any | null;

  // next_steps_report
  report?: any | null;

  // charts_outcomes
  series?: ChartSeries | null;
  filters?: any | null;

  // image
  image?: ImagePayload | null;

  // ✅ poster
  poster?: PosterPayload | null;

  // drafting
  answer_lines?: string[] | null;

  answer: string;
};

const OUTPUT_MODE =
  (process.env.AI_OUTPUT_MODE as
    | "answer_only"
    | "amount_only"
    | "shop_only"
    | "amount_shop"
    | "full"
    | undefined) ?? "answer_only";

function num(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[^\d.-]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function pickItems(raw: any): any[] | null {
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data) && raw?.intent === "list_outcomes") return raw.data;
  if (Array.isArray(raw?.outcomes)) return raw.outcomes;
  if (Array.isArray(raw?.rows)) return raw.rows;

  if (Array.isArray(raw?.payload?.items)) return raw.payload.items;
  if (Array.isArray(raw?.result?.items)) return raw.result.items;

  return null;
}

function pickAnswerLines(raw: any): string[] | null {
  const al =
    (Array.isArray(raw?.answer_lines) ? raw.answer_lines : null) ??
    (Array.isArray(raw?.payload?.answer_lines) ? raw.payload.answer_lines : null);

  if (!al) return null;
  return al.map((x: any) => String(x)).filter(Boolean);
}

function pickSeries(raw: any): ChartSeries | null {
  const s =
    raw?.series ??
    raw?.payload?.series ??
    raw?.chart?.series ??
    raw?.payload?.chart?.series ??
    null;

  if (!s || typeof s !== "object") return null;

  const out: ChartSeries = {};
  if (Array.isArray(s.trend)) out.trend = s.trend;
  if (Array.isArray(s.byShop)) out.byShop = s.byShop;
  if (Array.isArray(s.byCategory)) out.byCategory = s.byCategory;
  if (Array.isArray(s.byBank)) out.byBank = s.byBank;

  return out;
}

function pickChartFilters(raw: any): any | null {
  return (
    raw?.filters ??
    raw?.payload?.filters ??
    raw?.chart?.filters ??
    raw?.payload?.chart?.filters ??
    null
  );
}

function pickImage(raw: any): ImagePayload | null {
  const img = raw?.image ?? raw?.payload?.image ?? null;
  if (!img || typeof img !== "object") return null;

  const data_url =
    typeof img?.data_url === "string" && img.data_url.startsWith("data:image/")
      ? img.data_url
      : null;

  return {
    data_url,
    mime: typeof img?.mime === "string" ? img.mime : null,
    title: typeof img?.title === "string" ? img.title : null,
  };
}

// ✅ NEW
function pickPoster(raw: any): PosterPayload | null {
  const p = raw?.poster ?? raw?.payload?.poster ?? null;
  if (!p || typeof p !== "object") return null;

  return {
    size: typeof p?.size === "string" ? p.size : null,
    title: typeof p?.title === "string" ? p.title : null,
    subtitle: typeof p?.subtitle === "string" ? p.subtitle : null,
    bullets: Array.isArray(p?.bullets) ? p.bullets.map((x: any) => String(x)) : null,
    footer: typeof p?.footer === "string" ? p.footer : null,
    theme: typeof p?.theme === "string" ? p.theme : null,
    style: typeof p?.style === "string" ? p.style : null,
  };
}

function makeAnswerFromRaw(d: any): string {
  if (d?.intent === "outcome_image") return "Outcome image ready ✅";
  if (d?.intent === "poster_image") return "Poster image ready ✅";

  const items = pickItems(d);

  if (d?.intent === "charts_outcomes") {
    const s = pickSeries(d);
    const pts = Array.isArray(s?.trend) ? s!.trend!.length : 0;
    return pts > 0 ? `Chart ready (${pts} points)` : "Chart ready";
  }

  if (typeof d?.count === "number") return `Outcome count: ${d.count}`;
  if (items) return `Outcome count: ${items.length}`;

  if (d?.intent === "query_outcome") {
    if (typeof d?.data === "number") return `Total: ¥${d.data.toLocaleString()}`;
    const nd = num(d?.data);
    if (nd !== null) return `Total: ¥${nd.toLocaleString()}`;
  }

  const amount = num(d?.amount);
  const shop = typeof d?.shop === "string" ? d.shop : null;
  const category = typeof d?.category === "string" ? d.category : null;

  if (amount !== null) return `¥${amount}${shop ? ` (${shop})` : ""}`;
  if (shop) return shop;
  if (category) return category;
  return "OK";
}

function normalizeIntent(raw: any): Intent {
  const i = String(raw?.intent ?? "").trim();

  if (
    i === "create_outcome" ||
    i === "query_outcome" ||
    i === "list_outcomes" ||
    i === "next_steps_report" ||
    i === "charts_outcomes" ||
    i === "outcome_image" ||
    i === "poster_image"
  ) {
    return i as Intent;
  }

  return "create_outcome";
}

function normalize(raw: any): Normalized {
  const intent = normalizeIntent(raw);
  const items = pickItems(raw);

  const answer =
    typeof raw?.answer === "string" && raw.answer.trim()
      ? raw.answer.trim()
      : makeAnswerFromRaw(raw);

  const count =
    typeof raw?.count === "number"
      ? raw.count
      : typeof raw?.meta?.total === "number"
      ? raw.meta.total
      : items
      ? items.length
      : null;

  const answer_lines = pickAnswerLines(raw);
  const series = pickSeries(raw);
  const filters = pickChartFilters(raw);
  const image = pickImage(raw);
  const poster = pickPoster(raw);

  return {
    intent,

    amount: raw?.amount ?? raw?.payload?.amount ?? null,
    shop: raw?.shop ?? raw?.payload?.shop ?? null,
    category: raw?.category ?? raw?.payload?.category ?? null,
    notice: raw?.notice ?? raw?.payload?.notice ?? null,
    bank: raw?.bank ?? raw?.payload?.bank ?? null,

    confidence:
      typeof raw?.confidence === "number"
        ? raw.confidence
        : num(raw?.confidence ?? raw?.payload?.confidence) ?? null,

    needs_confirm:
      typeof raw?.needs_confirm === "boolean"
        ? raw.needs_confirm
        : typeof raw?.payload?.needs_confirm === "boolean"
        ? raw.payload.needs_confirm
        : null,

    metric: raw?.metric ?? raw?.payload?.metric ?? null,
    from: raw?.from ?? raw?.payload?.from ?? null,
    to: raw?.to ?? raw?.payload?.to ?? null,
    data: raw?.data ?? raw?.payload?.data ?? null,

    count,
    items: items ?? null,
    meta: raw?.meta ?? raw?.payload?.meta ?? null,

    report: raw?.report ?? raw?.payload?.report ?? null,

    series: series ?? null,
    filters: filters ?? null,

    image: image ?? null,
    poster: poster ?? null,

    answer_lines: answer_lines ?? null,
    answer,
  };
}

function formatOutput(n: Normalized) {
  switch (OUTPUT_MODE) {
    case "amount_only": {
      const a = num(n.amount);
      return { answer: `¥${a ?? "-"}`, intent: n.intent };
    }

    case "shop_only": {
      return { answer: `${n.shop ?? "-"}`, intent: n.intent };
    }

    case "amount_shop": {
      const a = num(n.amount);
      const s = n.shop ? ` (${n.shop})` : "";
      return { answer: `¥${a ?? "-"}${s}`, intent: n.intent };
    }

    case "full": {
      return n;
    }

    case "answer_only":
    default: {
      return {
        answer: n.answer,
        intent: n.intent,
        payload: {
          answer_lines: n.answer_lines,

          amount: n.amount,
          shop: n.shop,
          category: n.category,
          notice: n.notice,
          bank: n.bank,
          confidence: n.confidence,
          needs_confirm: n.needs_confirm,

          metric: n.metric,
          from: n.from,
          to: n.to,
          data: n.data,

          count: n.count,
          meta: n.meta,
          items: n.items,

          report: n.report,

          series: n.series,
          filters: n.filters,

          image: n.image,
          poster: n.poster,
        },
      };
    }
  }
}

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

    const r = await fetch(`${base}/parse_outcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
      cache: "no-store",
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return NextResponse.json(
        { error: "Python AI error", status: r.status, detail },
        { status: 502 }
      );
    }

    const raw = await r.json();

    if (raw?.error) {
      return NextResponse.json(
        { error: raw.error, detail: raw },
        { status: 400 }
      );
    }

    const normalized = normalize(raw);
    const output = formatOutput(normalized);

    return NextResponse.json(output);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}