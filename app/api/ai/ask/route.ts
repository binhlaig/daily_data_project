
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB/mongoDB";
import Remittance from "@/lib/mongoDB/models/remittance";

type AskIntent =
  | "fun_qa"
  | "learning_qa"
  | "project_qa"
  | "remittance_qa"
  | "finance_qa"
  | "general_qa";

type RemittanceStatus = "pending" | "paid" | "cancelled";

type RemittanceRow = {
  id: string;
  date: string;
  customerName: string;
  receiverName: string;
  receiverPhone: string;
  payoutMethod: string;
  yenAmount: number;
  exchangeRate: number;
  serviceFee: number;
  status: RemittanceStatus;
  note: string;
};

type RemittanceDoc = {
  _id?: unknown;
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

type AssistantCard = {
  label?: string | null;
  value?: unknown;
};

type AssistantAction = {
  type?: string | null;
  label?: string | null;
  value?: string | null;
  field?: string | null;
};

type AskResponse = {
  ok: boolean;
  intent: AskIntent | string;
  assistant: {
    role: "assistant";
    message: string;
    lines: string[];
    cards: AssistantCard[];
    actions: AssistantAction[];
  };
  payload: Record<string, unknown>;
};

function okResponse(
  intent: AskIntent | string,
  message: string,
  lines: string[] = [],
  cards: AssistantCard[] = [],
  actions: AssistantAction[] = [],
  payload: Record<string, unknown> = {}
): AskResponse {
  return {
    ok: true,
    intent,
    assistant: {
      role: "assistant",
      message,
      lines,
      cards,
      actions,
    },
    payload,
  };
}

function errorMessage(error: unknown, fallback = "Unknown error") {
  return error instanceof Error ? error.message : fallback;
}

function errResponse(message: string, detail?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      intent: "general_qa",
      assistant: {
        role: "assistant",
        message,
        lines: detail ? [String(detail)] : [],
        cards: [],
        actions: [],
      },
      payload: {},
    },
    { status: 500 }
  );
}

function normalizeText(input: string) {
  return (input || "").trim().toLowerCase();
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((k) => text.includes(k));
}

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function cleanNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function cleanStatus(value: unknown): RemittanceStatus {
  return value === "paid" || value === "cancelled" ? value : "pending";
}

function formatJpy(value: number) {
  return `¥${Math.round(value || 0).toLocaleString("ja-JP")}`;
}

function formatMmk(value: number) {
  return `${Math.round(value || 0).toLocaleString("en-US")} MMK`;
}

function remittanceMmk(row: RemittanceRow) {
  return row.yenAmount * row.exchangeRate;
}

function isRemittanceText(input: string) {
  const t = normalizeText(input);
  return includesAny(t, [
    "remittance",
    "money transfer",
    "myanmar",
    "japan",
    "jpy",
    "yen",
    "mmk",
    "kbz",
    "wave",
    "aya",
    "ငွေလွှဲ",
    "မြန်မာ",
    "ဂျပန်",
    "လက်ခံ",
  ]);
}

function toRemittanceClient(doc: RemittanceDoc): RemittanceRow {
  return {
    id: String(doc._id),
    date: doc.date
      ? new Date(doc.date as string | Date).toISOString().slice(0, 10)
      : "",
    customerName: cleanString(doc.customerName),
    receiverName: cleanString(doc.receiverName),
    receiverPhone: cleanString(doc.receiverPhone),
    payoutMethod: cleanString(doc.payoutMethod),
    yenAmount: cleanNumber(doc.yenAmount),
    exchangeRate: cleanNumber(doc.exchangeRate),
    serviceFee: cleanNumber(doc.serviceFee),
    status: cleanStatus(doc.status),
    note: cleanString(doc.note),
  };
}

function filterRemittanceRows(input: string, rows: RemittanceRow[]) {
  const t = normalizeText(input);
  let filtered = [...rows];

  if (t.includes("pending") || t.includes("စောင်")) {
    filtered = filtered.filter((row) => row.status === "pending");
  } else if (t.includes("paid") || t.includes("ပြီး")) {
    filtered = filtered.filter((row) => row.status === "paid");
  } else if (t.includes("cancel") || t.includes("ပယ်")) {
    filtered = filtered.filter((row) => row.status === "cancelled");
  }

  if (t.includes("today") || t.includes("ယနေ့") || t.includes("ဒီနေ့")) {
    const today = new Date().toISOString().slice(0, 10);
    filtered = filtered.filter((row) => row.date === today);
  }

  const methods = ["kbz pay", "wave pay", "aya pay", "cb bank", "kbz bank", "cash pickup"];
  const exactMethod = methods.find((method) => t.includes(method));

  if (exactMethod) {
    filtered = filtered.filter(
      (row) => row.payoutMethod.toLowerCase() === exactMethod
    );
  } else if (t.includes("kbz")) {
    filtered = filtered.filter((row) => row.payoutMethod.toLowerCase().includes("kbz"));
  } else if (t.includes("wave")) {
    filtered = filtered.filter((row) => row.payoutMethod.toLowerCase().includes("wave"));
  } else if (t.includes("aya")) {
    filtered = filtered.filter((row) => row.payoutMethod.toLowerCase().includes("aya"));
  }

  return filtered;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectDomain(
  text: string
): "fun" | "learning" | "project" | "finance" | "general" {
  const t = normalizeText(text);

  const funWords = [
    "joke",
    "quote",
    "motivation",
    "bored",
    "fun",
    "ပျင်း",
    "ဟာသ",
    "အားပေး",
    "quote တစ်ခု",
  ];

  const learningWords = [
    "python",
    "react",
    "nextjs",
    "next.js",
    "fastapi",
    "quiz",
    "tip",
    "learn",
    "study",
    "လေ့လာ",
    "မေးခွန်း",
  ];

  const projectWords = [
    "binhlaig",
    "project idea",
    "project",
    "next step",
    "startup",
    "business",
    "pos",
    "dashboard",
    "ai trainer",
  ];

  const financeWords = [
    "outcome",
    "income",
    "expense",
    "salary",
    "chart",
    "report",
    "lawson",
    "familymart",
    "7-eleven",
    "aeon",
    "donki",
    "paypay",
    "remittance",
    "money transfer",
    "myanmar",
    "japan",
    "jpy",
    "yen",
    "mmk",
    "kbz",
    "wave",
    "aya",
    "ငွေလွှဲ",
    "မြန်မာ",
    "ဂျပန်",
    "company",
    "bonus",
    "allowance",
    "အသုံးစရိတ်",
    "ဝင်ငွေ",
    "လစာ",
    "ကုန်ကျ",
    "ဒီလ",
  ];

  if (includesAny(t, funWords)) return "fun";
  if (includesAny(t, learningWords)) return "learning";
  if (includesAny(t, projectWords)) return "project";
  if (isRemittanceText(text)) return "finance";
  if (includesAny(t, financeWords)) return "finance";

  return "general";
}

function detectFinanceTarget(text: string): "income" | "outcome" {
  const t = normalizeText(text);

  const incomeWords = [
    "income",
    "salary",
    "bonus",
    "allowance",
    "company",
    "compamy",
    "pay",
    "wage",
    "ဝင်ငွေ",
    "လစာ",
    "လုပ်ခ",
  ];

  const outcomeWords = [
    "outcome",
    "expense",
    "spend",
    "spent",
    "shop",
    "lawson",
    "familymart",
    "7-eleven",
    "aeon",
    "donki",
    "ကုန်ကျ",
    "အသုံးစရိတ်",
    "ဝယ်",
    "သုံး",
  ];

  const incomeScore = incomeWords.filter((k) => t.includes(k)).length;
  const outcomeScore = outcomeWords.filter((k) => t.includes(k)).length;

  if (incomeScore > outcomeScore) return "income";
  return "outcome";
}

function answerFunQA(text: string): AskResponse {
  const t = normalizeText(text);

  const jokes = [
    " Programmer joke 😄 — Bug fix လုပ်လိုက်တာနဲ့ bug 2 ခုထပ်ပေါ်လာတယ်",
    " Coffee မသောက်ရင် coding speed 50% လျော့သွားတယ် ☕",
    " AI က မပျင်းဘူး၊ user ပျင်းရင် chat လို့ရတယ် 😄",
    " Code run သွားရင် genius, error တက်ရင် debugging monk 😄",
    " မ မရှိလျင် မဖြစ်တဲ့ ကျွန်တော် ရဲ ဘဝ 😄",
    " မမ ကိုယ်တိုင်က ကျွန်တော်  ရဲ အလင်းတန်း  😄"
  ];

  const quotes = [
    " Small progress is still progress.",
    " Start simple. Improve daily.",
    " Consistency beats intensity.",
    " Done is better than perfect.",
  ];

  const motivations = [
    " ဒီနေ့ 10 minutes လုပ်ရင်တောင် forward movement ပါ ✅",
    " Perfect ဖြစ်ဖို့မလိုဘူး, continue လုပ်ဖို့ပဲလိုတယ် ✅",
    " Small code, small step, big future ✅",
    " တနေ့တနေ့ နည်းနည်းတိုးရင် လုံလောက်ပါတယ် ✅",
  ];

  if (t.includes("joke") || t.includes("ဟာသ")) {
    const msg = randomPick(jokes);
    return okResponse(
      "fun_qa",
      msg,
      [" 😂 Joke", msg],
      [],
      [
        { type: "prompt", label: "နောက်တစ်ခု", value: "joke တစ်ခု ထပ်ပြောပေး" },
        { type: "prompt", label: "motivation ပေး", value: "motivation ပေး" },
      ]
    );
  }

  if (t.includes("quote")) {
    const msg = randomPick(quotes);
    return okResponse(
      "fun_qa",
      msg,
      [" ✨ Quote", msg],
      [],
      [{ type: "prompt", label: "နောက်တစ်ခု", value: "quote တစ်ခု ထပ်ပေး" }]
    );
  }

  if (t.includes("motivation") || t.includes("ပျင်း") || t.includes("bored")) {
    const msg = randomPick(motivations);
    return okResponse(
      "fun_qa",
      msg,
      [" 🔥 Motivation", msg, " Today mini task: 20 minutes coding."],
      [{ label: "Mood", value: "Boosted" }],
      [
        { type: "prompt", label: "quote ပေး", value: "quote တစ်ခု ပေး" },
        { type: "prompt", label: "python quiz", value: "python quiz တစ်ခု ပေး" },
      ]
    );
  }

  return okResponse(
    "fun_qa",
    " Fun QA ready 😄",
    [" Try:", " • joke တစ်ခု ပြောပေး", " • motivation ပေး", " • quote တစ်ခု ပေး"]
  );
}

function answerLearningQA(text: string): AskResponse {
  const t = normalizeText(text);

  if (t.includes("python") && t.includes("quiz")) {
    return okResponse(
      "learning_qa",
      "Python mini quiz ✅",
      [
        " 🐍 Python Quiz",
        " : list နဲ့ tuple ဘာကွာလဲ?",
        " Hint: mutable / immutable ကိုစဉ်းစားပါ",
      ],
      [{ label: "Level", value: "Beginner" }],
      [
        { type: "prompt", label: "နောက် quiz", value: "python quiz တစ်ခု ထပ်ပေး" },
      ]
    );
  }

  if (t.includes("react")) {
    return okResponse(
      "learning_qa",
      "  tip ✅",
      [
        "  React Tip",
        " UI state ကို small parts ခွဲပြီး component render လုပ်ပါ",
        " Reusable components + props + hooks structure သုံးရင် project ကြီးလာလည်းထိန်းလို့ရတယ်",
      ],
      [{ label: "Topic", value: "React" }]
    );
  }

  if (t.includes("fastapi")) {
    return okResponse(
      "learning_qa",
      "FastAPI tip ✅",
      [
        " ⚡ FastAPI Tip",
        " routers / services / utils ခွဲထားရင် project သန့်တယ်",
        " response shape ကို standardize လုပ်ထားရင် frontend integration ပိုကောင်းတယ်",
      ],
      [{ label: "Topic", value: "FastAPI" }]
    );
  }

  return okResponse(
    "learning_qa",
    "Learning QA ready ✅",
    [
      " Try:",
      " • python quiz တစ်ခု ပေး",
      " • react tip တစ်ခု ပေး",
      " • fastapi tip တစ်ခု ပေး",
    ]
  );
}

function answerProjectQA(text: string): AskResponse {
  const t = normalizeText(text);

  if (t.includes("binhlaig") || t.includes("project idea") || t.includes("idea")) {
    return okResponse(
      "project_qa",
      " BINHLAIG project idea ✅",
      [
        " 🚀 Project Idea",
        " Smart Finance Assistant Dashboard",
        " • outcome / income QA chat",
        " • monthly insight cards",
        " • chart export + poster export",
        " • AI suggestion for savings / spending",
      ],
      [
        { label: "Brand", value: "BINHLAIG" },
        { label: "Type", value: "AI Finance Assistant" },
      ],
      [
        { type: "prompt", label: "next step ပေး", value: "BINHLAIG project next step ပေး" },
      ]
    );
  }

  if (t.includes("next step")) {
    return okResponse(
      "project_qa",
      " Project next steps ✅",
      [
        " 📌 Next Steps",
        " 1. /ask route တည်ဆောက်",
        " 2. assistant response format တစ်မျိုးတည်းသုံး",
        " 3. frontend action buttons ထည့်",
        " 4. finance + fun + learning modes ထည့်",
      ],
      [{ label: "Progress", value: "Planning" }]
    );
  }

  return okResponse(
    "project_qa",
    "Project QA ready ✅",
    [" Try:", " • BINHLAIG project idea ပေး", " • project next step ပေး"]
  );
}

async function answerFinanceFallback(input: string): Promise<NextResponse> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const target = detectFinanceTarget(input);

    const endpoint =
      target === "income" ? "/api/ai/parse-income" : "/api/ai/parse-outcome";

    const r = await fetch(new URL(endpoint, appUrl).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
      cache: "no-store",
    });

    const rawText = await r.text().catch(() => "");

    let parsed: Record<string, unknown> = {};
    try {
      parsed = rawText ? JSON.parse(rawText) : {};
    } catch {
      parsed = { answer: rawText || "Finance response" };
    }

    if (!r.ok) {
      return NextResponse.json(
        {
          ok: false,
          intent: "finance_qa",
          assistant: {
            role: "assistant",
            message: "Finance QA error",
            lines: [parsed?.error || rawText || "Unknown finance error"],
            cards: [],
            actions: [],
          },
          payload: {},
        },
        { status: r.status }
      );
    }

    return NextResponse.json(parsed);
  } catch (e: unknown) {
    return NextResponse.json(
      {
        ok: false,
        intent: "finance_qa",
        assistant: {
          role: "assistant",
          message: "Finance fallback error",
          lines: [errorMessage(e)],
          cards: [],
          actions: [],
        },
        payload: {},
      },
      { status: 500 }
    );
  }
}

async function answerRemittanceQA(input: string): Promise<NextResponse> {
  try {
    await connectToDB();

    const docs = await Remittance.find({}).sort({ createdAt: -1 }).lean();
    const rows = docs.map((doc) => toRemittanceClient(doc as RemittanceDoc));
    const filtered = filterRemittanceRows(input, rows);
    const active = filtered.filter((row) => row.status !== "cancelled");

    const totalJpy = active.reduce((sum, row) => sum + row.yenAmount, 0);
    const totalMmk = active.reduce((sum, row) => sum + remittanceMmk(row), 0);
    const totalFee = active.reduce((sum, row) => sum + row.serviceFee, 0);
    const pending = filtered.filter((row) => row.status === "pending").length;
    const paid = filtered.filter((row) => row.status === "paid").length;
    const cancelled = filtered.filter((row) => row.status === "cancelled").length;
    const t = normalizeText(input);

    let message = `စာရင်း ${filtered.length} ခု၊ JPY ${formatJpy(totalJpy)}၊ MMK ${formatMmk(totalMmk)}၊ Fee ${formatJpy(totalFee)} ဖြစ်ပါတယ်။`;

    if (t.includes("count") || t.includes("ဘယ်နှစ်") || t.includes("အရေအတွက်")) {
      message = `ငွေလွှဲစာရင်းအရေအတွက် ${filtered.length} ခုရှိပါတယ်။`;
    } else if (t.includes("fee") || t.includes("service")) {
      message = `Service fee စုစုပေါင်း ${formatJpy(totalFee)} ဖြစ်ပါတယ်။`;
    } else if (t.includes("mmk") || t.includes("မြန်မာ")) {
      message = `Myanmar ဘက်ပေးရန် စုစုပေါင်း ${formatMmk(totalMmk)} ဖြစ်ပါတယ်။`;
    } else if (t.includes("jpy") || t.includes("yen") || t.includes("ဂျပန်")) {
      message = `Japan ဘက်လက်ခံထားသော Yen စုစုပေါင်း ${formatJpy(totalJpy)} ဖြစ်ပါတယ်။`;
    }

    const outputRows = filtered.slice(0, 5).map((row) => ({
      date: row.date,
      customerName: row.customerName,
      receiverName: row.receiverName,
      payoutMethod: row.payoutMethod,
      status: row.status,
      yenAmount: row.yenAmount,
      mmkAmount: remittanceMmk(row),
    }));

    return NextResponse.json(
      okResponse(
        "remittance_qa",
        message,
        [
          message,
          `Records: \`${filtered.length}\``,
          `JPY: \`${formatJpy(totalJpy)}\``,
          `MMK: \`${formatMmk(totalMmk)}\``,
        ],
        [
          { label: "Pending", value: pending },
          { label: "Paid", value: paid },
          { label: "Cancelled", value: cancelled },
        ],
        [
          { type: "prompt", label: "Pending", value: "pending ငွေလွှဲ ဘယ်နှစ်ခုရှိလဲ" },
          { type: "prompt", label: "KBZ MMK", value: "KBZ Pay MMK total" },
        ],
        {
          remittance: {
            summary: {
              records: filtered.length,
              totalJpy,
              totalMmk,
              totalFee,
              pending,
              paid,
              cancelled,
            },
            rows: outputRows,
          },
        }
      )
    );
  } catch (e: unknown) {
    return NextResponse.json(
      {
        ok: false,
        intent: "remittance_qa",
        assistant: {
          role: "assistant",
          message: "Remittance QA error",
          lines: [errorMessage(e, "Unknown remittance error")],
          cards: [],
          actions: [],
        },
        payload: {},
      },
      { status: 500 }
    );
  }
}

function answerGeneralQA(): AskResponse {
  return okResponse(
    "general_qa",
    "QA assistant ready ✅",
    [
      " Try:",
      "• joke တစ်ခု ပြောပေး",
      "• motivation ပေး",
      "• python quiz တစ်ခု ပေး",
      "• BINHLAIG project idea ပေး",
      "• ဒီလ outcome chart ပြ",
      "• ဒီလ income chart ပြ",
    ],
    [],
    [
      { type: "prompt", label: "Joke", value: "joke တစ်ခု ပြောပေး" },
      { type: "prompt", label: "Motivation", value: "motivation ပေး" },
      { type: "prompt", label: "Python Quiz", value: "python quiz တစ်ခု ပေး" },
      { type: "prompt", label: "Project Idea", value: "BINHLAIG project idea ပေး" },
      { type: "prompt", label: "Outcome Chart", value: "ဒီလ outcome chart ပြ" },
      { type: "prompt", label: "Income Chart", value: "ဒီလ income chart ပြ" },
    ]
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { text?: string };
    const input = (body?.text ?? "").trim();

    if (!input) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const domain = detectDomain(input);

    if (domain === "fun") {
      return NextResponse.json(answerFunQA(input));
    }

    if (domain === "learning") {
      return NextResponse.json(answerLearningQA(input));
    }

    if (domain === "project") {
      return NextResponse.json(answerProjectQA(input));
    }

    if (domain === "finance") {
      if (isRemittanceText(input)) {
        return await answerRemittanceQA(input);
      }

      return await answerFinanceFallback(input);
    }

    return NextResponse.json(answerGeneralQA());
  } catch (e: unknown) {
    return errResponse(errorMessage(e));
  }
}


// //api/ai/ask/route.ts

// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
//   try {
//     const body = (await req.json().catch(() => ({}))) as { text?: string };
//     const text = String(body?.text ?? "").trim();

//     if (!text) {
//       return NextResponse.json({ error: "text is required" }, { status: 400 });
//     }

//     const AI_SERVER_URL =
//       process.env.AI_SERVER_URL || "http://127.0.0.1:8000";

//     const r = await fetch(`${AI_SERVER_URL}/predict`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ text }),
//       cache: "no-store",
//     });

//     const raw = await r.text();
//     let parsed: any = null;

//     try {
//       parsed = raw ? JSON.parse(raw) : null;
//     } catch {
//       parsed = {
//         ok: false,
//         intent: "general_qa",
//         assistant: {
//           role: "assistant",
//           message: "Invalid AI server response",
//           lines: [raw || "Unknown response"],
//           cards: [],
//           actions: [],
//         },
//         payload: {},
//       };
//     }

//     return NextResponse.json(parsed, { status: r.status });
//   } catch (e: any) {
//     return NextResponse.json(
//       {
//         ok: false,
//         intent: "general_qa",
//         assistant: {
//           role: "assistant",
//           message: "Ask API error",
//           lines: [String(e?.message ?? "Unknown error")],
//           cards: [],
//           actions: [],
//         },
//         payload: {},
//       },
//       { status: 500 }
//     );
//   }
// }




// import { NextResponse } from "next/server";

// type AssistantCard = {
//   label?: string | null;
//   value?: any;
// };

// type AssistantAction = {
//   type?: string | null;
//   label?: string | null;
//   value?: string | null;
//   field?: string | null;
// };

// type AskApiResponse = {
//   ok: boolean;
//   intent: string;
//   assistant: {
//     role: "assistant";
//     message: string;
//     lines: string[];
//     cards: AssistantCard[];
//     actions: AssistantAction[];
//   };
//   payload: Record<string, any>;
// };

// export async function POST(req: Request) {
//   try {
//     const body = (await req.json().catch(() => ({}))) as { text?: string };
//     const text = String(body?.text ?? "").trim();

//     if (!text) {
//       return NextResponse.json({ error: "text is required" }, { status: 400 });
//     }

//     const AI_SERVER_URL = process.env.AI_SERVER_URL || "http://127.0.0.1:8000";
//     const AI_SERVER_ASK_PATH = process.env.AI_SERVER_ASK_PATH || "/api/ask";

//     const r = await fetch(`${AI_SERVER_URL}${AI_SERVER_ASK_PATH}`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ text }),
//       cache: "no-store",
//     });

//     const raw = await r.text().catch(() => "");
//     let parsed: AskApiResponse | any = null;

//     try {
//       parsed = raw ? JSON.parse(raw) : null;
//     } catch {
//       parsed = {
//         ok: false,
//         intent: "general_qa",
//         assistant: {
//           role: "assistant",
//           message: "Invalid AI server response",
//           lines: [raw || "Unknown response"],
//           cards: [],
//           actions: [],
//         },
//         payload: {},
//       };
//     }

//     if (!parsed) {
//       parsed = {
//         ok: false,
//         intent: "general_qa",
//         assistant: {
//           role: "assistant",
//           message: "Empty AI server response",
//           lines: [],
//           cards: [],
//           actions: [],
//         },
//         payload: {},
//       };
//     }

//     return NextResponse.json(parsed, { status: r.status });
//   } catch (e: any) {
//     return NextResponse.json(
//       {
//         ok: false,
//         intent: "general_qa",
//         assistant: {
//           role: "assistant",
//           message: "Ask API error",
//           lines: [String(e?.message ?? "Unknown error")],
//           cards: [],
//           actions: [],
//         },
//         payload: {},
//       },
//       { status: 500 }
//     );
//   }
// }
