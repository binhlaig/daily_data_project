// // app/api/ai/parse-income/route.ts
// import { NextResponse } from "next/server";

// type Intent =
//   | "create_income"
//   | "query_income"
//   | "list_incomes"
//   | "income_report"
//   | "charts_incomes"
//   | "income_image"
//   | "poster_image"; // ✅ NEW

// type ChartSeries = {
//   trend?: { x: string; y: number }[];
//   byCompany?: { name: string; value: number }[];
// };

// type ImagePayload = {
//   data_url?: string | null; // "data:image/png;base64,..."
//   mime?: string | null; // "image/png"
//   title?: string | null;
// };

// type Normalized = {
//   intent: Intent;

//   // create_income
//   amount?: number | string | null;
//   company?: string | null;
//   month?: string | null;
//   notice?: string | null;
//   confidence?: number | null;
//   needs_confirm?: boolean | null;

//   // query_income
//   metric?: "total" | "byCompany" | "count" | "last" | string;
//   from?: string | null;
//   to?: string | null;
//   data?: any;

//   // list_incomes
//   count?: number | null;
//   items?: any[] | null;
//   meta?: any | null;

//   // income_report
//   report?: any | null;

//   // charts_incomes
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
//     | "company_only"
//     | "amount_company"
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
//   if (Array.isArray(raw?.data) && raw?.intent === "list_incomes") return raw.data;
//   if (Array.isArray(raw?.incomes)) return raw.incomes;
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
//   if (Array.isArray(s.byCompany)) out.byCompany = s.byCompany;

//   // (fallback) if python reused byShop for company
//   if (!out.byCompany && Array.isArray((s as any).byShop)) out.byCompany = (s as any).byShop;

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
//   if (d?.intent === "income_image") return "Income image ready ✅";
//   if (d?.intent === "poster_image") return "Poster image ready ✅";

//   const items = pickItems(d);

//   if (d?.intent === "charts_incomes") {
//     const s = pickSeries(d);
//     const pts = Array.isArray(s?.trend) ? s!.trend!.length : 0;
//     return pts > 0 ? `Chart ready (${pts} points)` : "Chart ready";
//   }

//   if (typeof d?.count === "number") return `Income count: ${d.count}`;
//   if (items) return `Income count: ${items.length}`;

//   if (d?.intent === "query_income") {
//     if (typeof d?.data === "number") return `Total: ¥${d.data.toLocaleString()}`;
//     const nd = num(d?.data);
//     if (nd !== null) return `Total: ¥${nd.toLocaleString()}`;
//   }

//   const amount = num(d?.amount);
//   const company = typeof d?.company === "string" ? d.company : null;

//   if (amount !== null) return `¥${amount}${company ? ` (${company})` : ""}`;
//   if (company) return company;
//   return "OK";
// }

// function normalizeIntent(raw: any): Intent {
//   const i = String(raw?.intent ?? "").trim();
//   if (
//     i === "create_income" ||
//     i === "query_income" ||
//     i === "list_incomes" ||
//     i === "income_report" ||
//     i === "charts_incomes" ||
//     i === "income_image" ||
//     i === "poster_image"
//   ) return i as Intent;

//   return "create_income";
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
//     company: raw?.company ?? raw?.payload?.company ?? null,
//     month: raw?.month ?? raw?.payload?.month ?? null,
//     notice: raw?.notice ?? raw?.payload?.notice ?? null,
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
//     case "company_only": {
//       return { answer: `${n.company ?? "-"}`, intent: n.intent };
//     }
//     case "amount_company": {
//       const a = num(n.amount);
//       const s = n.company ? ` (${n.company})` : "";
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
//           company: n.company,
//           month: n.month,
//           notice: n.notice,
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

//     const r = await fetch(`${base}/parse_income`, {
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


// app/api/ai/parse-income/route.ts
import { NextResponse } from "next/server";

type Intent =
  | "create_income"
  | "query_income"
  | "list_incomes"
  | "income_report"
  | "charts_incomes"
  | "income_image"
  | "poster_image";

type ChartSeries = {
  trend?: { x: string; y: number }[];
  byCompany?: { name: string; value: number }[];
  byBank?: { name: string; value: number }[];
  byCategory?: { name: string; value: number }[];
  byShop?: { name: string; value: number }[];
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

type AssistantCard = {
  label?: string | null;
  value?: any;
};

type AssistantAction = {
  type?: string | null;
  label?: string | null;
  value?: string | null;
  field?: string | null;
};

type AssistantPayload = {
  role?: "assistant" | string | null;
  message?: string | null;
  lines?: string[] | null;
  cards?: AssistantCard[] | null;
  actions?: AssistantAction[] | null;
};

type Normalized = {
  intent: Intent;

  assistant?: AssistantPayload | null;

  // create_income
  amount?: number | string | null;
  company?: string | null;
  compamy?: string | null;
  category?: string | null;
  notice?: string | null;
  bank?: string | null;
  month?: string | null;
  confidence?: number | null;
  needs_confirm?: boolean | null;
  missing_fields?: string[] | null;
  suggested_date?: string | null;

  // query_income
  metric?: "total" | "byCompany" | "count" | "last" | string | null;
  from?: string | null;
  to?: string | null;
  data?: any;

  // list_incomes
  count?: number | null;
  items?: any[] | null;
  meta?: any | null;

  // reports
  report?: any | null;

  // charts
  series?: ChartSeries | null;
  filters?: any | null;

  // image
  image?: ImagePayload | null;

  // poster
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

function pickAssistant(raw: any): AssistantPayload | null {
  const a = raw?.assistant ?? null;
  if (!a || typeof a !== "object") return null;

  return {
    role: typeof a?.role === "string" ? a.role : "assistant",
    message: typeof a?.message === "string" ? a.message : null,
    lines: Array.isArray(a?.lines) ? a.lines.map((x: any) => String(x)) : null,
    cards: Array.isArray(a?.cards)
      ? a.cards.map((c: any) => ({
          label: typeof c?.label === "string" ? c.label : null,
          value: c?.value ?? null,
        }))
      : null,
    actions: Array.isArray(a?.actions)
      ? a.actions.map((ac: any) => ({
          type: typeof ac?.type === "string" ? ac.type : null,
          label: typeof ac?.label === "string" ? ac.label : null,
          value: typeof ac?.value === "string" ? ac.value : null,
          field: typeof ac?.field === "string" ? ac.field : null,
        }))
      : null,
  };
}

function pickItems(raw: any): any[] | null {
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data) && raw?.intent === "list_incomes") return raw.data;
  if (Array.isArray(raw?.incomes)) return raw.incomes;
  if (Array.isArray(raw?.rows)) return raw.rows;

  if (Array.isArray(raw?.payload?.items)) return raw.payload.items;
  if (Array.isArray(raw?.result?.items)) return raw.result.items;

  return null;
}

function pickAnswerLines(raw: any): string[] | null {
  const assistantLines = Array.isArray(raw?.assistant?.lines)
    ? raw.assistant.lines
    : null;

  const al =
    assistantLines ??
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
  if (Array.isArray(s.byCompany)) out.byCompany = s.byCompany;
  if (Array.isArray(s.byBank)) out.byBank = s.byBank;
  if (Array.isArray(s.byCategory)) out.byCategory = s.byCategory;
  if (Array.isArray(s.byShop)) out.byShop = s.byShop;

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

function pickString(raw: any, ...paths: string[]): string | null {
  for (const path of paths) {
    const parts = path.split(".");
    let cur = raw;
    for (const k of parts) cur = cur?.[k];
    if (typeof cur === "string" && cur.trim()) return cur;
  }
  return null;
}

function pickBoolean(raw: any, ...paths: string[]): boolean | null {
  for (const path of paths) {
    const parts = path.split(".");
    let cur = raw;
    for (const k of parts) cur = cur?.[k];
    if (typeof cur === "boolean") return cur;
  }
  return null;
}

function pickArrayStrings(raw: any, ...paths: string[]): string[] | null {
  for (const path of paths) {
    const parts = path.split(".");
    let cur = raw;
    for (const k of parts) cur = cur?.[k];
    if (Array.isArray(cur)) return cur.map((x: any) => String(x)).filter(Boolean);
  }
  return null;
}

function makeAnswerFromRaw(d: any): string {
  const assistantMessage = pickString(d, "assistant.message");
  if (assistantMessage) return assistantMessage;

  if (d?.intent === "income_image") return "Income image ready ✅";
  if (d?.intent === "poster_image") return "Poster image ready ✅";

  const items = pickItems(d);

  if (d?.intent === "charts_incomes") {
    const s = pickSeries(d);
    const pts = Array.isArray(s?.trend) ? s!.trend!.length : 0;
    return pts > 0 ? `Chart ready (${pts} points)` : "Chart ready";
  }

  if (typeof d?.count === "number") return `Income count: ${d.count}`;
  if (items) return `Income count: ${items.length}`;

  if (d?.intent === "query_income") {
    if (typeof d?.data === "number") return `Total: ¥${d.data.toLocaleString()}`;
    const nd = num(d?.data);
    if (nd !== null) return `Total: ¥${nd.toLocaleString()}`;
  }

  const amount = num(d?.amount);
  const company =
    typeof d?.company === "string"
      ? d.company
      : typeof d?.compamy === "string"
      ? d.compamy
      : null;

  const category = typeof d?.category === "string" ? d.category : null;

  if (amount !== null) return `¥${amount}${company ? ` (${company})` : ""}`;
  if (company) return company;
  if (category) return category;
  return "OK";
}

function normalizeIntent(raw: any): Intent {
  const i = String(raw?.intent ?? raw?.payload?.intent ?? "").trim();

  if (
    i === "create_income" ||
    i === "query_income" ||
    i === "list_incomes" ||
    i === "income_report" ||
    i === "charts_incomes" ||
    i === "income_image" ||
    i === "poster_image"
  ) {
    return i as Intent;
  }

  return "create_income";
}

function normalize(raw: any): Normalized {
  const intent = normalizeIntent(raw);
  const items = pickItems(raw);
  const assistant = pickAssistant(raw);

  const answer =
    pickString(raw, "assistant.message", "answer", "payload.answer") ??
    makeAnswerFromRaw(raw);

  const count =
    typeof raw?.count === "number"
      ? raw.count
      : typeof raw?.meta?.total === "number"
      ? raw.meta.total
      : typeof raw?.payload?.meta?.total === "number"
      ? raw.payload.meta.total
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
    assistant: assistant ?? null,

    amount: raw?.amount ?? raw?.payload?.amount ?? null,
    company: raw?.company ?? raw?.payload?.company ?? null,
    compamy: raw?.compamy ?? raw?.payload?.compamy ?? null,
    category: raw?.category ?? raw?.payload?.category ?? null,
    notice: raw?.notice ?? raw?.payload?.notice ?? null,
    bank: raw?.bank ?? raw?.payload?.bank ?? null,
    month: raw?.month ?? raw?.payload?.month ?? null,

    confidence:
      typeof raw?.confidence === "number"
        ? raw.confidence
        : num(raw?.confidence ?? raw?.payload?.confidence) ?? null,

    needs_confirm:
      pickBoolean(raw, "needs_confirm", "payload.needs_confirm") ?? null,

    missing_fields:
      pickArrayStrings(raw, "missing_fields", "payload.missing_fields") ?? null,

    suggested_date:
      pickString(raw, "suggested_date", "payload.suggested_date") ?? null,

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
      const company = n.company ?? n.compamy ?? "-";
      return { answer: `${company}`, intent: n.intent };
    }

    case "amount_shop": {
      const a = num(n.amount);
      const company = n.company ?? n.compamy;
      const s = company ? ` (${company})` : "";
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
        assistant: n.assistant
          ? {
              role: n.assistant.role ?? "assistant",
              message: n.assistant.message ?? n.answer,
              lines: n.assistant.lines ?? n.answer_lines ?? null,
              cards: n.assistant.cards ?? [],
              actions: n.assistant.actions ?? [],
            }
          : {
              role: "assistant",
              message: n.answer,
              lines: n.answer_lines ?? null,
              cards: [],
              actions: [],
            },
        payload: {
          answer_lines: n.answer_lines,

          amount: n.amount,
          company: n.company,
          compamy: n.compamy,
          category: n.category,
          notice: n.notice,
          bank: n.bank,
          month: n.month,
          confidence: n.confidence,
          needs_confirm: n.needs_confirm,
          missing_fields: n.missing_fields,
          suggested_date: n.suggested_date,

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

    const r = await fetch(`${base}/parse_income`, {
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