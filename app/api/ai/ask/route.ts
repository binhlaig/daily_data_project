// import { NextResponse } from "next/server";

// type AskIntent =
//   | "fun_qa"
//   | "learning_qa"
//   | "project_qa"
//   | "finance_qa"
//   | "general_qa";

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

// type AskResponse = {
//   ok: boolean;
//   intent: AskIntent | string;
//   assistant: {
//     role: "assistant";
//     message: string;
//     lines: string[];
//     cards: AssistantCard[];
//     actions: AssistantAction[];
//   };
//   payload: Record<string, any>;
// };

// function okResponse(
//   intent: AskIntent | string,
//   message: string,
//   lines: string[] = [],
//   cards: AssistantCard[] = [],
//   actions: AssistantAction[] = [],
//   payload: Record<string, any> = {}
// ): AskResponse {
//   return {
//     ok: true,
//     intent,
//     assistant: {
//       role: "assistant",
//       message,
//       lines,
//       cards,
//       actions,
//     },
//     payload,
//   };
// }

// function errResponse(message: string, detail?: any) {
//   return NextResponse.json(
//     {
//       ok: false,
//       intent: "general_qa",
//       assistant: {
//         role: "assistant",
//         message,
//         lines: detail ? [String(detail)] : [],
//         cards: [],
//         actions: [],
//       },
//       payload: {},
//     },
//     { status: 500 }
//   );
// }

// function normalizeText(input: string) {
//   return (input || "").trim().toLowerCase();
// }

// function includesAny(text: string, keywords: string[]) {
//   return keywords.some((k) => text.includes(k));
// }

// function randomPick<T>(arr: T[]): T {
//   return arr[Math.floor(Math.random() * arr.length)];
// }

// function detectDomain(text: string): "fun" | "learning" | "project" | "finance" | "general" {
//   const t = normalizeText(text);

//   const funWords = [
//     "joke",
//     "quote",
//     "motivation",
//     "bored",
//     "fun",
//     "ပျင်း",
//     "ဟာသ",
//     "အားပေး",
//     "quote တစ်ခု",
//   ];

//   const learningWords = [
//     "python",
//     "react",
//     "nextjs",
//     "next.js",
//     "fastapi",
//     "quiz",
//     "tip",
//     "learn",
//     "study",
//     "လေ့လာ",
//     "မေးခွန်း",
//   ];

//   const projectWords = [
//     "binhlaig",
//     "project idea",
//     "project",
//     "next step",
//     "startup",
//     "business",
//     "pos",
//     "dashboard",
//     "ai trainer",
//   ];

//   const financeWords = [
//     "outcome",
//     "income",
//     "expense",
//     "salary",
//     "chart",
//     "report",
//     "lawson",
//     "familymart",
//     "7-eleven",
//     "aeon",
//     "donki",
//     "paypay",
//     "အသုံးစရိတ်",
//     "ဝင်ငွေ",
//     "လစာ",
//     "ကုန်ကျ",
//     "ဒီလ",
//   ];

//   if (includesAny(t, funWords)) return "fun";
//   if (includesAny(t, learningWords)) return "learning";
//   if (includesAny(t, projectWords)) return "project";
//   if (includesAny(t, financeWords)) return "finance";

//   return "general";
// }

// function answerFunQA(text: string): AskResponse {
//   const t = normalizeText(text);

//   const jokes = [
//     "Programmer joke 😄 — Bug fix လုပ်လိုက်တာနဲ့ bug 2 ခုထပ်ပေါ်လာတယ်",
//     "Coffee မသောက်ရင် coding speed 50% လျော့သွားတယ် ☕",
//     "AI က မပျင်းဘူး၊ user ပျင်းရင် chat လို့ရတယ် 😄",
//     "Code run သွားရင် genius, error တက်ရင် debugging monk 😄",
//   ];

//   const quotes = [
//     "Small progress is still progress.",
//     "Start simple. Improve daily.",
//     "Consistency beats intensity.",
//     "Done is better than perfect.",
//   ];

//   const motivations = [
//     "ဒီနေ့ 10 minutes လုပ်ရင်တောင် forward movement ပါ ✅",
//     "Perfect ဖြစ်ဖို့မလိုဘူး, continue လုပ်ဖို့ပဲလိုတယ် ✅",
//     "Small code, small step, big future ✅",
//     "တနေ့တနေ့ နည်းနည်းတိုးရင် လုံလောက်ပါတယ် ✅",
//   ];

//   if (t.includes("joke") || t.includes("ဟာသ")) {
//     const msg = randomPick(jokes);
//     return okResponse(
//       "fun_qa",
//       msg,
//       ["😂 Joke", msg],
//       [],
//       [
//         { type: "prompt", label: "နောက်တစ်ခု", value: "joke တစ်ခု ထပ်ပြောပေး" },
//         { type: "prompt", label: "motivation ပေး", value: "motivation ပေး" },
//         { type: "prompt", label: "quote ပေး", value: "quote တစ်ခု ပေး" },
//       ]
//     );
//   }

//   if (t.includes("quote")) {
//     const msg = randomPick(quotes);
//     return okResponse(
//       "fun_qa",
//       msg,
//       ["✨ Quote", msg],
//       [],
//       [
//         { type: "prompt", label: "နောက်တစ်ခု", value: "quote တစ်ခု ထပ်ပေး" },
//         { type: "prompt", label: "motivation ပေး", value: "motivation ပေး" },
//       ]
//     );
//   }

//   if (t.includes("motivation") || t.includes("ပျင်း") || t.includes("bored")) {
//     const msg = randomPick(motivations);
//     return okResponse(
//       "fun_qa",
//       msg,
//       ["🔥 Motivation", msg, "Today mini task: 20 minutes coding."],
//       [{ label: "Mood", value: "Boosted" }],
//       [
//         { type: "prompt", label: "quote ပေး", value: "quote တစ်ခု ပေး" },
//         { type: "prompt", label: "joke ပေး", value: "joke တစ်ခု ပြောပေး" },
//         { type: "prompt", label: "python quiz", value: "python quiz တစ်ခု ပေး" },
//       ]
//     );
//   }

//   return okResponse(
//     "fun_qa",
//     "Fun QA ready 😄",
//     [
//       "Try:",
//       "• joke တစ်ခု ပြောပေး",
//       "• motivation ပေး",
//       "• quote တစ်ခု ပေး",
//     ],
//     [],
//     [
//       { type: "prompt", label: "Joke", value: "joke တစ်ခု ပြောပေး" },
//       { type: "prompt", label: "Motivation", value: "motivation ပေး" },
//       { type: "prompt", label: "Quote", value: "quote တစ်ခု ပေး" },
//     ]
//   );
// }

// function answerLearningQA(text: string): AskResponse {
//   const t = normalizeText(text);

//   if (t.includes("python") && t.includes("quiz")) {
//     return okResponse(
//       "learning_qa",
//       "Python mini quiz ✅",
//       [
//         "🐍 Python Quiz",
//         "Question: list နဲ့ tuple ဘာကွာလဲ?",
//         "Hint: mutable / immutable ကိုစဉ်းစားပါ",
//       ],
//       [{ label: "Level", value: "Beginner" }],
//       [
//         { type: "prompt", label: "Answer ပြ", value: "list and tuple answer ပြ" },
//         { type: "prompt", label: "နောက် quiz", value: "python quiz တစ်ခု ထပ်ပေး" },
//       ]
//     );
//   }

//   if (t.includes("react")) {
//     return okResponse(
//       "learning_qa",
//       "React tip ✅",
//       [
//         "⚛️ React Tip",
//         "UI state ကို small parts ခွဲပြီး component render လုပ်ပါ",
//         "Reusable components + props + hooks structure သုံးရင် project ကြီးလာလည်းထိန်းလို့ရတယ်",
//       ],
//       [{ label: "Topic", value: "React" }],
//       [{ type: "prompt", label: "Next.js tip", value: "nextjs tip တစ်ခု ပေး" }]
//     );
//   }

//   if (t.includes("nextjs") || t.includes("next.js")) {
//     return okResponse(
//       "learning_qa",
//       "Next.js tip ✅",
//       [
//         "▲ Next.js Tip",
//         "App Router သုံးရင် route structure ကိုသန့်အောင် folders ခွဲထားပါ",
//         "API routes နဲ့ UI parsing shape ကိုတစ်မျိုးတည်းထားရင် frontend ပိုလွယ်တယ်",
//       ],
//       [{ label: "Topic", value: "Next.js" }],
//       [{ type: "prompt", label: "React tip", value: "react tip တစ်ခု ပေး" }]
//     );
//   }

//   if (t.includes("fastapi")) {
//     return okResponse(
//       "learning_qa",
//       "FastAPI tip ✅",
//       [
//         "⚡ FastAPI Tip",
//         "routers / services / utils ခွဲထားရင် project သန့်တယ်",
//         "response shape ကို standardize လုပ်ထားရင် frontend integration ပိုကောင်းတယ်",
//       ],
//       [{ label: "Topic", value: "FastAPI" }],
//       [{ type: "prompt", label: "Python quiz", value: "python quiz တစ်ခု ပေး" }]
//     );
//   }

//   return okResponse(
//     "learning_qa",
//     "Learning QA ready ✅",
//     [
//       "Try:",
//       "• python quiz တစ်ခု ပေး",
//       "• react tip တစ်ခု ပေး",
//       "• fastapi tip တစ်ခု ပေး",
//     ],
//     [],
//     [
//       { type: "prompt", label: "Python Quiz", value: "python quiz တစ်ခု ပေး" },
//       { type: "prompt", label: "React Tip", value: "react tip တစ်ခု ပေး" },
//       { type: "prompt", label: "FastAPI Tip", value: "fastapi tip တစ်ခု ပေး" },
//     ]
//   );
// }

// function answerProjectQA(text: string): AskResponse {
//   const t = normalizeText(text);

//   if (t.includes("binhlaig") || t.includes("project idea") || t.includes("idea")) {
//     return okResponse(
//       "project_qa",
//       "BINHLAIG project idea ✅",
//       [
//         "🚀 Project Idea",
//         "Smart Finance Assistant Dashboard",
//         "• outcome / income QA chat",
//         "• monthly insight cards",
//         "• chart export + poster export",
//         "• AI suggestion for savings / spending",
//       ],
//       [
//         { label: "Brand", value: "BINHLAIG" },
//         { label: "Type", value: "AI Finance Assistant" },
//       ],
//       [
//         { type: "prompt", label: "next step ပေး", value: "BINHLAIG project next step ပေး" },
//       ]
//     );
//   }

//   if (t.includes("next step")) {
//     return okResponse(
//       "project_qa",
//       "Project next steps ✅",
//       [
//         "📌 Next Steps",
//         "1. /ask route တည်ဆောက်",
//         "2. assistant response format တစ်မျိုးတည်းသုံး",
//         "3. frontend action buttons ထည့်",
//         "4. finance + fun + learning modes ထည့်",
//       ],
//       [{ label: "Progress", value: "Planning" }],
//       [
//         { type: "prompt", label: "project idea", value: "BINHLAIG project idea ပေး" },
//       ]
//     );
//   }

//   return okResponse(
//     "project_qa",
//     "Project QA ready ✅",
//     ["Try:", "• BINHLAIG project idea ပေး", "• project next step ပေး"],
//     [],
//     [
//       { type: "prompt", label: "Project Idea", value: "BINHLAIG project idea ပေး" },
//       { type: "prompt", label: "Next Step", value: "project next step ပေး" },
//     ]
//   );
// }

// async function answerFinanceFallback(input: string): Promise<NextResponse> {
//   try {
//     const origin = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

//     const r = await fetch(new URL("/api/ai/parse-outcome", origin).toString(), {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ text: input }),
//       cache: "no-store",
//     });

//     const rawText = await r.text().catch(() => "");

//     let parsed: any = {};
//     try {
//       parsed = rawText ? JSON.parse(rawText) : {};
//     } catch {
//       parsed = { answer: rawText || "Finance response" };
//     }

//     if (!r.ok) {
//       return NextResponse.json(
//         {
//           ok: false,
//           intent: "finance_qa",
//           assistant: {
//             role: "assistant",
//             message: "Finance QA error",
//             lines: [parsed?.error || rawText || "Unknown finance error"],
//             cards: [],
//             actions: [],
//           },
//           payload: {},
//         },
//         { status: r.status }
//       );
//     }

//     return NextResponse.json(parsed);
//   } catch (e: any) {
//     return NextResponse.json(
//       {
//         ok: false,
//         intent: "finance_qa",
//         assistant: {
//           role: "assistant",
//           message: "Finance fallback error",
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

// function answerGeneralQA(): AskResponse {
//   return okResponse(
//     "general_qa",
//     "QA assistant ready ✅",
//     [
//       "Try:",
//       "• joke တစ်ခု ပြောပေး",
//       "• motivation ပေး",
//       "• python quiz တစ်ခု ပေး",
//       "• BINHLAIG project idea ပေး",
//       "• ဒီလ outcome chart ပြ",
//     ],
//     [],
//     [
//       { type: "prompt", label: "Joke", value: "joke တစ်ခု ပြောပေး" },
//       { type: "prompt", label: "Motivation", value: "motivation ပေး" },
//       { type: "prompt", label: "Python Quiz", value: "python quiz တစ်ခု ပေး" },
//       { type: "prompt", label: "Project Idea", value: "BINHLAIG project idea ပေး" },
//       { type: "prompt", label: "Outcome Chart", value: "ဒီလ outcome chart ပြ" },
//     ]
//   );
// }

// export async function POST(req: Request) {
//   try {
//     const body = (await req.json().catch(() => ({}))) as { text?: string };
//     const input = (body?.text ?? "").trim();

//     if (!input) {
//       return NextResponse.json({ error: "text is required" }, { status: 400 });
//     }

//     const domain = detectDomain(input);

//     if (domain === "fun") {
//       return NextResponse.json(answerFunQA(input));
//     }

//     if (domain === "learning") {
//       return NextResponse.json(answerLearningQA(input));
//     }

//     if (domain === "project") {
//       return NextResponse.json(answerProjectQA(input));
//     }

//     if (domain === "finance") {
//       return await answerFinanceFallback(input);
//     }

//     return NextResponse.json(answerGeneralQA());
//   } catch (e: any) {
//     return errResponse(e?.message ?? "Unknown error");
//   }
// }




import { NextResponse } from "next/server";

type AskIntent =
  | "fun_qa"
  | "learning_qa"
  | "project_qa"
  | "finance_qa"
  | "general_qa";

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
  payload: Record<string, any>;
};

function okResponse(
  intent: AskIntent | string,
  message: string,
  lines: string[] = [],
  cards: AssistantCard[] = [],
  actions: AssistantAction[] = [],
  payload: Record<string, any> = {}
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

function errResponse(message: string, detail?: any) {
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
    "Programmer joke 😄 — Bug fix လုပ်လိုက်တာနဲ့ bug 2 ခုထပ်ပေါ်လာတယ်",
    "Coffee မသောက်ရင် coding speed 50% လျော့သွားတယ် ☕",
    "AI က မပျင်းဘူး၊ user ပျင်းရင် chat လို့ရတယ် 😄",
    "Code run သွားရင် genius, error တက်ရင် debugging monk 😄",
  ];

  const quotes = [
    "Small progress is still progress.",
    "Start simple. Improve daily.",
    "Consistency beats intensity.",
    "Done is better than perfect.",
  ];

  const motivations = [
    "ဒီနေ့ 10 minutes လုပ်ရင်တောင် forward movement ပါ ✅",
    "Perfect ဖြစ်ဖို့မလိုဘူး, continue လုပ်ဖို့ပဲလိုတယ် ✅",
    "Small code, small step, big future ✅",
    "တနေ့တနေ့ နည်းနည်းတိုးရင် လုံလောက်ပါတယ် ✅",
  ];

  if (t.includes("joke") || t.includes("ဟာသ")) {
    const msg = randomPick(jokes);
    return okResponse(
      "fun_qa",
      msg,
      ["😂 Joke", msg],
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
      ["✨ Quote", msg],
      [],
      [{ type: "prompt", label: "နောက်တစ်ခု", value: "quote တစ်ခု ထပ်ပေး" }]
    );
  }

  if (t.includes("motivation") || t.includes("ပျင်း") || t.includes("bored")) {
    const msg = randomPick(motivations);
    return okResponse(
      "fun_qa",
      msg,
      ["🔥 Motivation", msg, "Today mini task: 20 minutes coding."],
      [{ label: "Mood", value: "Boosted" }],
      [
        { type: "prompt", label: "quote ပေး", value: "quote တစ်ခု ပေး" },
        { type: "prompt", label: "python quiz", value: "python quiz တစ်ခု ပေး" },
      ]
    );
  }

  return okResponse(
    "fun_qa",
    "Fun QA ready 😄",
    ["Try:", "• joke တစ်ခု ပြောပေး", "• motivation ပေး", "• quote တစ်ခု ပေး"]
  );
}

function answerLearningQA(text: string): AskResponse {
  const t = normalizeText(text);

  if (t.includes("python") && t.includes("quiz")) {
    return okResponse(
      "learning_qa",
      "Python mini quiz ✅",
      [
        "🐍 Python Quiz",
        "Question: list နဲ့ tuple ဘာကွာလဲ?",
        "Hint: mutable / immutable ကိုစဉ်းစားပါ",
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
      "React tip ✅",
      [
        "⚛️ React Tip",
        "UI state ကို small parts ခွဲပြီး component render လုပ်ပါ",
        "Reusable components + props + hooks structure သုံးရင် project ကြီးလာလည်းထိန်းလို့ရတယ်",
      ],
      [{ label: "Topic", value: "React" }]
    );
  }

  if (t.includes("fastapi")) {
    return okResponse(
      "learning_qa",
      "FastAPI tip ✅",
      [
        "⚡ FastAPI Tip",
        "routers / services / utils ခွဲထားရင် project သန့်တယ်",
        "response shape ကို standardize လုပ်ထားရင် frontend integration ပိုကောင်းတယ်",
      ],
      [{ label: "Topic", value: "FastAPI" }]
    );
  }

  return okResponse(
    "learning_qa",
    "Learning QA ready ✅",
    [
      "Try:",
      "• python quiz တစ်ခု ပေး",
      "• react tip တစ်ခု ပေး",
      "• fastapi tip တစ်ခု ပေး",
    ]
  );
}

function answerProjectQA(text: string): AskResponse {
  const t = normalizeText(text);

  if (t.includes("binhlaig") || t.includes("project idea") || t.includes("idea")) {
    return okResponse(
      "project_qa",
      "BINHLAIG project idea ✅",
      [
        "🚀 Project Idea",
        "Smart Finance Assistant Dashboard",
        "• outcome / income QA chat",
        "• monthly insight cards",
        "• chart export + poster export",
        "• AI suggestion for savings / spending",
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
      "Project next steps ✅",
      [
        "📌 Next Steps",
        "1. /ask route တည်ဆောက်",
        "2. assistant response format တစ်မျိုးတည်းသုံး",
        "3. frontend action buttons ထည့်",
        "4. finance + fun + learning modes ထည့်",
      ],
      [{ label: "Progress", value: "Planning" }]
    );
  }

  return okResponse(
    "project_qa",
    "Project QA ready ✅",
    ["Try:", "• BINHLAIG project idea ပေး", "• project next step ပေး"]
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

    let parsed: any = {};
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
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        intent: "finance_qa",
        assistant: {
          role: "assistant",
          message: "Finance fallback error",
          lines: [String(e?.message ?? "Unknown error")],
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
      "Try:",
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
      return await answerFinanceFallback(input);
    }

    return NextResponse.json(answerGeneralQA());
  } catch (e: any) {
    return errResponse(e?.message ?? "Unknown error");
  }
}