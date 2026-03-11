"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Table
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Charts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

type Mode = "outcome" | "income";
type DetectKind = Mode | "mixed";

type PosterMeta = {
  size?: string | null;
  title?: string | null;
  subtitle?: string | null;
  bullets?: string[] | null;
  footer?: string | null;
  theme?: string | null;
  style?: string | null;
};

type AICard = {
  label?: string;
  value?: any;
};

type AIAction = {
  type?: string;
  label?: string;
  value?: string;
  field?: string;
};

type Msg = {
  id: string;
  role: "user" | "ai";
  text: string;
  lines?: string[];
  streaming?: boolean;
  done?: boolean;

  cards?: AICard[];
  actions?: AIAction[];

  table?: { title?: string; rows: any[]; kind?: Mode };
  report?: any;
  reportKind?: Mode | "mixed";
  chart?: {
    series?: {
      trend?: { x: string; y: number }[];
      byShop?: { name: string; value: number }[];
      byCategory?: { name: string; value: number }[];
      byBank?: { name: string; value: number }[];
      byCompany?: { name: string; value: number }[];
    };
    filters?: any;
    kind?: Mode;
  };
  image?: {
    src: string;
    title?: string;
    kind?: Mode | "mixed";
    poster?: PosterMeta | null;
  };
};

type AIResult = any;

// helpers
function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(16).slice(2);
}

function getPayload(ai: any) {
  return ai?.payload ?? ai;
}

function getAssistant(ai: any) {
  return ai?.assistant ?? null;
}

function toISODate(v: any): string {
  if (!v) return "";
  const raw = v?.$date ?? v;
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function yen(v: any): string {
  const n = toNumber(v);
  if (n === null) return v ? `¥${String(v)}` : "—";
  return `¥${n.toLocaleString()}`;
}

function cellText(v: any): string {
  if (v === null || v === undefined) return "—";
  const s = String(v).trim();
  return s ? s : "—";
}

function csvEscape(s: string) {
  const t = s.replace(/"/g, '""');
  return `"${t}"`;
}

function exportOutcomesCSV(rows: any[], filename = "outcomes.csv") {
  const headers = ["date", "shop", "bank", "amount", "notice"];
  const lines: string[] = [];
  lines.push(headers.join(","));

  for (const r of rows) {
    const date = toISODate(r?.date) || toISODate(r?.createdAt);
    const shop = String(r?.shop ?? "");
    const bank = String(r?.bank ?? "");
    const amount = String(r?.amount ?? "");
    const notice = String(r?.notice ?? "");

    lines.push(
      [
        csvEscape(date),
        csvEscape(shop),
        csvEscape(bank),
        csvEscape(amount),
        csvEscape(notice),
      ].join(",")
    );
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportIncomesCSV(rows: any[], filename = "incomes.csv") {
  const headers = ["date", "company", "month", "amount", "notice"];
  const lines: string[] = [];
  lines.push(headers.join(","));

  for (const r of rows) {
    const date = toISODate(r?.date) || toISODate(r?.createdAt);
    const company = String(r?.company ?? r?.compamy ?? "");
    const month = String(r?.month ?? "");
    const amount = String(r?.amount ?? "");
    const notice = String(r?.notice ?? "");

    lines.push(
      [
        csvEscape(date),
        csvEscape(company),
        csvEscape(month),
        csvEscape(amount),
        csvEscape(notice),
      ].join(",")
    );
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function parseItemsFromAnswer(answer: string): any[] {
  const lines = (answer ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const rows: any[] = [];
  for (const line of lines) {
    const m = line.match(
      /^\d+\.\s*(.+?)\s+¥\s*([\d,]+)(?:\s+\[(.*?)\])?(?:\s+(.*))?$/i
    );
    if (!m) continue;

    rows.push({
      date: "",
      shop: (m[1] ?? "").trim(),
      amount: (m[2] ?? "").replace(/,/g, ""),
      category: (m[3] ?? "").trim() || "-",
      notice: (m[4] ?? "").trim() || "",
      bank: "",
    });
  }
  return rows;
}

function pickLines(ai: any): string[] {
  const assistant = getAssistant(ai);
  const payload = getPayload(ai);

  const lines =
    (Array.isArray(assistant?.lines) ? assistant.lines : null) ??
    (Array.isArray(payload?.answer_lines) ? payload.answer_lines : null) ??
    (Array.isArray(ai?.answer_lines) ? ai.answer_lines : null) ??
    [];

  return Array.isArray(lines) ? lines.map(String).filter(Boolean) : [];
}

function pickCards(ai: any): AICard[] {
  const assistant = getAssistant(ai);
  const cards = Array.isArray(assistant?.cards) ? assistant.cards : [];
  return cards.map((c: any) => ({
    label: typeof c?.label === "string" ? c.label : "",
    value: c?.value,
  }));
}

function pickActions(ai: any): AIAction[] {
  const assistant = getAssistant(ai);
  const actions = Array.isArray(assistant?.actions) ? assistant.actions : [];
  return actions.map((a: any) => ({
    type: typeof a?.type === "string" ? a.type : "",
    label: typeof a?.label === "string" ? a.label : "",
    value: typeof a?.value === "string" ? a.value : "",
    field: typeof a?.field === "string" ? a.field : "",
  }));
}

function pickAnswerText(ai: any): string {
  const assistant = getAssistant(ai);
  const payload = getPayload(ai);
  return String(
    assistant?.message ?? ai?.answer ?? payload?.answer ?? ai?.message ?? "OK"
  );
}

function pickChartSeries(ai: any) {
  const payload = getPayload(ai);

  const s =
    payload?.series ??
    payload?.chart?.series ??
    ai?.series ??
    ai?.chart?.series ??
    null;

  const series = {
    trend: Array.isArray(s?.trend) ? s.trend : [],
    byShop: Array.isArray(s?.byShop) ? s.byShop : [],
    byCategory: Array.isArray(s?.byCategory) ? s.byCategory : [],
    byBank: Array.isArray(s?.byBank) ? s.byBank : [],
    byCompany: Array.isArray(s?.byCompany)
      ? s.byCompany
      : Array.isArray(s?.byShop)
      ? s.byShop
      : [],
  };

  const filters =
    payload?.filters ??
    payload?.chart?.filters ??
    ai?.filters ??
    ai?.chart?.filters ??
    null;

  return { series, filters };
}

function pickImage(ai: any): { src: string; title?: string } | null {
  const payload = getPayload(ai);
  const img = payload?.image ?? ai?.image ?? null;

  const src =
    typeof img?.data_url === "string" && img.data_url.startsWith("data:image/")
      ? img.data_url
      : null;

  if (!src) return null;

  return {
    src,
    title: typeof img?.title === "string" ? img.title : undefined,
  };
}

function pickPoster(ai: any): PosterMeta | null {
  const payload = getPayload(ai);
  const poster = payload?.poster ?? ai?.poster ?? null;

  if (!poster || typeof poster !== "object") return null;

  return {
    size: typeof poster?.size === "string" ? poster.size : null,
    title: typeof poster?.title === "string" ? poster.title : null,
    subtitle: typeof poster?.subtitle === "string" ? poster.subtitle : null,
    bullets: Array.isArray(poster?.bullets)
      ? poster.bullets.map((x: any) => String(x))
      : null,
    footer: typeof poster?.footer === "string" ? poster.footer : null,
    theme: typeof poster?.theme === "string" ? poster.theme : null,
    style: typeof poster?.style === "string" ? poster.style : null,
  };
}

function detectKindByText(input: string): DetectKind {
  const t = (input || "").toLowerCase().trim();

  const incomeHints = [
    "income",
    "incomes",
    "salary",
    "pay",
    "wage",
    "bonus",
    "allowance",
    "company",
    "compamy",
    "ဝင်ငွေ",
    "လစာ",
    "လုပ်ခ",
    "အလုပ်လစာ",
  ];

  const outcomeHints = [
    "outcome",
    "outcomes",
    "spend",
    "expense",
    "spent",
    "buy",
    "bought",
    "shop",
    "lawson",
    "familymart",
    "7-eleven",
    "aeon",
    "donki",
    "don quijote",
    "ကုန်ကျ",
    "အသုံးစရိတ်",
    "သုံး",
    "ဝယ်",
  ];

  const mixedHints = [
    "report",
    "analysis",
    "insight",
    "next steps",
    "poster",
    "image",
    "chart",
    "graph",
    "ai poster",
    "summary",
    "အကြံပြု",
    "ဘာတွေလုပ်ရမလဲ",
    "ပုံ",
    "ပိုစတာ",
    "ဓာတ်ပုံ",
    "joke",
    "motivation",
    "quote",
    "quiz",
    "tip",
    "project idea",
    "binhlaig",
    "ပျင်း",
    "ဟာသ",
  ];

  const hasIncome = incomeHints.some((k) => t.includes(k));
  const hasOutcome = outcomeHints.some((k) => t.includes(k));
  const hasMixed = mixedHints.some((k) => t.includes(k));

  if (hasIncome && !hasOutcome) return "income";
  if (hasOutcome && !hasIncome) return "outcome";
  if (hasMixed) return "mixed";

  return "mixed";
}

function detectKindByIntent(ai: any): Mode | "mixed" {
  const payload = getPayload(ai);
  const intent = String(ai?.intent ?? payload?.intent ?? "").toLowerCase();

  if (!intent) return "mixed";
  if (intent.includes("income")) return "income";
  if (intent.includes("outcome")) return "outcome";
  if (intent === "poster_image") return "mixed";
  if (intent.includes("list_incomes") || intent.includes("charts_incomes"))
    return "income";
  if (intent.includes("list_outcomes") || intent.includes("charts_outcomes"))
    return "outcome";

  return "mixed";
}

function isFinanceIntent(ai: any): boolean {
  const payload = getPayload(ai);
  const intent = String(ai?.intent ?? payload?.intent ?? "").toLowerCase();

  const okIntents = [
    "create_outcome",
    "list_outcomes",
    "charts_outcomes",
    "query_outcome",
    "outcome_image",
    "next_steps_report",
    "create_income",
    "list_incomes",
    "charts_incomes",
    "income_image",
    "income_report",
    "poster_image",
  ];

  return okIntents.includes(intent);
}

function isFunLikeIntent(ai: any): boolean {
  const payload = getPayload(ai);
  const intent = String(ai?.intent ?? payload?.intent ?? "").toLowerCase();
  return (
    intent.includes("fun_qa") ||
    intent.includes("learning_qa") ||
    intent.includes("project_qa") ||
    intent.includes("general_qa")
  );
}

function isBadRequestLike(error: any): boolean {
  const msg = String(error?.message ?? "").toLowerCase();
  return (
    msg.includes("400") ||
    msg.includes("bad request") ||
    msg.includes("text is required") ||
    msg.includes("invalid request") ||
    msg.includes("unsupported")
  );
}

// avatars
function AIAvatar() {
  return (
    <div className="mt-1 grid h-10 w-10 place-items-center rounded-2xl border bg-gradient-to-br from-primary/25 to-muted shadow-sm">
      <Sparkles className="h-5 w-5 text-primary" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="mt-1 grid h-10 w-10 place-items-center rounded-2xl border bg-muted/40 shadow-sm">
      <span className="text-xs font-semibold text-muted-foreground">You</span>
    </div>
  );
}

// pretty lines
function InlineCodeText({ text }: { text: string }) {
  const parts = String(text).split(/(`[^`]+`)/g);

  return (
    <>
      {parts.map((p, i) => {
        const isCode = p.startsWith("`") && p.endsWith("`");
        if (!isCode) return <span key={i}>{p}</span>;
        const code = p.slice(1, -1);
        return (
          <code
            key={i}
            className="mx-1 rounded-md border bg-background px-2 py-0.5 font-mono text-xs text-foreground"
          >
            {code}
          </code>
        );
      })}
    </>
  );
}

function DraftingBadge({ done }: { done?: boolean }) {
  return (
    <div
      className={[
        "inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[11px]",
        done
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-muted-foreground",
      ].join(" ")}
    >
      {done ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Saved</span>
        </>
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5" />
          <span>Drafting…</span>
        </>
      )}
    </div>
  );
}

function DonePop() {
  return (
    <div className="pointer-events-none absolute right-3 top-3 animate-[pop_650ms_ease-out_1]">
      <div className="flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400 shadow-sm">
        <CheckCircle2 className="h-4 w-4" />
        Done
      </div>
    </div>
  );
}

function PrettyLinesBubble({
  lines,
  streaming,
  done,
}: {
  lines: string[];
  streaming?: boolean;
  done?: boolean;
}) {
  const safeLines = Array.isArray(lines) ? lines : [];

  if (!safeLines?.length) {
    return (
      <div className="relative rounded-3xl border bg-muted/50 px-4 py-3 text-sm leading-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">AI</div>
          <DraftingBadge done={false} />
        </div>
        <div className="mt-2 text-muted-foreground">
          Writing…
          <span className="ml-1 inline-block w-2 animate-pulse">▍</span>
        </div>
      </div>
    );
  }

  const head = safeLines[0] ?? "";
  const rest = safeLines.slice(1);
  const isBullet = (s: string) => /^\s*[•\-*]\s+/.test(s);

  return (
    <div className="relative rounded-3xl border bg-muted/50 px-4 py-3 text-sm leading-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-base font-semibold">
          <InlineCodeText text={head} />
        </div>

        <div className="flex items-center gap-2">
          <DraftingBadge done={done} />
          {streaming ? (
            <span className="inline-block w-2 animate-pulse text-muted-foreground">
              ▍
            </span>
          ) : null}
        </div>
      </div>

      {!streaming && done ? <DonePop /> : null}

      {rest.length > 0 ? (
        <div className="mt-2 space-y-2">
          {rest.map((line, idx) => {
            const bullet = isBullet(line);
            const clean = bullet ? line.replace(/^\s*[•\-*]\s+/, "") : line;

            return (
              <div key={idx} className={bullet ? "flex gap-2" : ""}>
                {bullet ? <span className="mt-[2px]">•</span> : null}
                <div className="text-muted-foreground">
                  <InlineCodeText text={clean} />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function CardsRow({ cards }: { cards: AICard[] }) {
  if (!cards?.length) return null;

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c, i) => (
        <div
          key={`${c.label}-${i}`}
          className="rounded-2xl border bg-background px-3 py-3 shadow-sm"
        >
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {c.label || "Info"}
          </div>
          <div className="mt-1 text-sm font-semibold break-words">
            {String(c.value ?? "—")}
          </div>
        </div>
      ))}
    </div>
  );
}

// outcome table
function OutcomesTableCard({ title, rows }: { title: string; rows: any[] }) {
  const [bankFilter, setBankFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const banks = useMemo(() => {
    return Array.from(
      new Set(rows.map((r) => String(r?.bank ?? "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filtered = useMemo(() => {
    if (bankFilter === "ALL") return rows;
    return rows.filter((r) => String(r?.bank ?? "").trim() === bankFilter);
  }, [rows, bankFilter]);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  useEffect(() => {
    setPage(1);
  }, [bankFilter, pageSize]);

  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const totalAmount = useMemo(() => {
    return filtered.reduce((sum, r) => sum + (toNumber(r?.amount) ?? 0), 0);
  }, [filtered]);

  const fromIdx = totalRows === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const toIdx = Math.min(safePage * pageSize, totalRows);

  return (
    <div className="mt-3 overflow-hidden rounded-3xl border bg-background shadow-sm">
      <div className="flex flex-col gap-2 border-b bg-muted/30 px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold">Outcomes</div>
            <div className="text-xs text-muted-foreground">{title}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Bank</span>
              <select
                className="h-8 rounded-md border bg-background px-2 text-sm"
                value={bankFilter}
                onChange={(e) => setBankFilter(e.target.value)}
              >
                <option value="ALL">All</option>
                {banks.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows</span>
              <select
                className="h-8 rounded-md border bg-background px-2 text-sm"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => exportOutcomesCSV(filtered, "outcomes.csv")}
            >
              Export CSV
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="tabular-nums">
            Page {safePage} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="tabular-nums">
            Showing {fromIdx}–{toIdx} of {totalRows}
          </span>

          <span className="tabular-nums">
            Total: ¥{totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="max-h-[520px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow className="bg-background">
              <TableHead className="whitespace-nowrap">Date</TableHead>
              <TableHead className="whitespace-nowrap">Shop</TableHead>
              <TableHead className="whitespace-nowrap">Bank</TableHead>
              <TableHead className="whitespace-nowrap text-right">
                Amount
              </TableHead>
              <TableHead className="whitespace-nowrap">Notice</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {pagedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No data
                </TableCell>
              </TableRow>
            ) : (
              pagedRows.map((r: any, idx: number) => {
                const date = toISODate(r?.date) || toISODate(r?.createdAt);
                const shop = cellText(r?.shop);
                const bank = cellText(r?.bank);
                const amountNum = toNumber(r?.amount);
                const notice = cellText(r?.notice);

                const amountCls =
                  amountNum === null
                    ? "text-muted-foreground"
                    : amountNum > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : amountNum < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground";

                return (
                  <TableRow
                    key={r?._id?.$oid ?? r?._id ?? `${safePage}-${idx}`}
                    className={[
                      "hover:bg-muted/30",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/10",
                    ].join(" ")}
                  >
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                      {date || "—"}
                    </TableCell>

                    <TableCell className="max-w-[220px]">
                      <span className="inline-flex items-center rounded-full border bg-background px-2 py-1 text-xs">
                        {shop}
                      </span>
                    </TableCell>

                    <TableCell className="max-w-[220px]">
                      <span className="inline-flex items-center rounded-full border bg-background px-2 py-1 text-xs">
                        {bank}
                      </span>
                    </TableCell>

                    <TableCell
                      className={[
                        "whitespace-nowrap text-right font-semibold tabular-nums",
                        amountCls,
                      ].join(" ")}
                    >
                      {yen(r?.amount)}
                    </TableCell>

                    <TableCell className="max-w-[360px] text-sm text-muted-foreground">
                      {notice}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// income table
function IncomesTableCard({ title, rows }: { title: string; rows: any[] }) {
  const [companyFilter, setCompanyFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const companies = useMemo(() => {
    return Array.from(
      new Set(
        rows
          .map((r) => String(r?.company ?? r?.compamy ?? "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filtered = useMemo(() => {
    if (companyFilter === "ALL") return rows;
    return rows.filter(
      (r) => String(r?.company ?? r?.compamy ?? "").trim() === companyFilter
    );
  }, [rows, companyFilter]);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  useEffect(() => {
    setPage(1);
  }, [companyFilter, pageSize]);

  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const totalAmount = useMemo(() => {
    return filtered.reduce((sum, r) => sum + (toNumber(r?.amount) ?? 0), 0);
  }, [filtered]);

  const fromIdx = totalRows === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const toIdx = Math.min(safePage * pageSize, totalRows);

  return (
    <div className="mt-3 overflow-hidden rounded-3xl border bg-background shadow-sm">
      <div className="flex flex-col gap-2 border-b bg-muted/30 px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold">Incomes</div>
            <div className="text-xs text-muted-foreground">{title}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Company</span>
              <select
                className="h-8 rounded-md border bg-background px-2 text-sm"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                <option value="ALL">All</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows</span>
              <select
                className="h-8 rounded-md border bg-background px-2 text-sm"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => exportIncomesCSV(filtered, "incomes.csv")}
            >
              Export CSV
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="tabular-nums">
            Page {safePage} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="tabular-nums">
            Showing {fromIdx}–{toIdx} of {totalRows}
          </span>

          <span className="tabular-nums">
            Total: ¥{totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="max-h-[520px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow className="bg-background">
              <TableHead className="whitespace-nowrap">Date</TableHead>
              <TableHead className="whitespace-nowrap">Company</TableHead>
              <TableHead className="whitespace-nowrap">Month</TableHead>
              <TableHead className="whitespace-nowrap text-right">
                Amount
              </TableHead>
              <TableHead className="whitespace-nowrap">Notice</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {pagedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No data
                </TableCell>
              </TableRow>
            ) : (
              pagedRows.map((r: any, idx: number) => {
                const date = toISODate(r?.date) || toISODate(r?.createdAt);
                const company = cellText(r?.company ?? r?.compamy);
                const month = cellText(r?.month);
                const amountNum = toNumber(r?.amount);
                const notice = cellText(r?.notice);

                const amountCls =
                  amountNum === null
                    ? "text-muted-foreground"
                    : amountNum > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : amountNum < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground";

                return (
                  <TableRow
                    key={r?._id?.$oid ?? r?._id ?? `${safePage}-${idx}`}
                    className={[
                      "hover:bg-muted/30",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/10",
                    ].join(" ")}
                  >
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                      {date || "—"}
                    </TableCell>

                    <TableCell className="max-w-[260px]">
                      <span className="inline-flex items-center rounded-full border bg-background px-2 py-1 text-xs">
                        {company}
                      </span>
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {month}
                    </TableCell>

                    <TableCell
                      className={[
                        "whitespace-nowrap text-right font-semibold tabular-nums",
                        amountCls,
                      ].join(" ")}
                    >
                      {yen(r?.amount)}
                    </TableCell>

                    <TableCell className="max-w-[360px] text-sm text-muted-foreground">
                      {notice}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// chart UI
function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-3xl border bg-background shadow-sm">
      <div className="border-b bg-muted/30 px-4 py-3">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Trend / Breakdown ကိုပြထားပါတယ် ✅
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function OutcomeChartsCard({
  series,
}: {
  series: {
    trend?: { x: string; y: number }[];
    byShop?: { name: string; value: number }[];
    byCategory?: { name: string; value: number }[];
    byBank?: { name: string; value: number }[];
  };
}) {
  const trend = Array.isArray(series?.trend) ? series.trend : [];
  const byShop = Array.isArray(series?.byShop) ? series.byShop : [];
  const byCategory = Array.isArray(series?.byCategory) ? series.byCategory : [];
  const byBank = Array.isArray(series?.byBank) ? series.byBank : [];

  const totalTrend = trend.reduce((s, p) => s + (Number(p?.y) || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border bg-background px-2 py-1">
          Points: <span className="tabular-nums">{trend.length}</span>
        </span>
        <span className="rounded-full border bg-background px-2 py-1">
          Total(trend):{" "}
          <span className="tabular-nums">¥{totalTrend.toLocaleString()}</span>
        </span>
      </div>

      <div className="rounded-3xl border bg-background p-3">
        <div className="mb-2 text-xs font-semibold text-muted-foreground">
          Trend (Day/Month)
        </div>

        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" hide />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="y" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-3xl border bg-background p-3">
          <div className="mb-2 text-xs font-semibold text-muted-foreground">
            Top Shops
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byShop}>
                <defs>
                  <linearGradient id="shopGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" hide />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[10, 10, 0, 0]}
                  fill="url(#shopGradient)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border bg-background p-3">
          <div className="mb-2 text-xs font-semibold text-muted-foreground">
            Top Categories
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <defs>
                  <linearGradient
                    id="categoryGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" hide />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[10, 10, 0, 0]}
                  fill="url(#categoryGradient)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border bg-background p-3">
          <div className="mb-2 text-xs font-semibold text-muted-foreground">
            Bank Breakdown
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byBank}>
                <defs>
                  <linearGradient id="bankGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" hide />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[10, 10, 0, 0]}
                  fill="url(#bankGradient)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function IncomeChartsCard({
  series,
}: {
  series: {
    trend?: { x: string; y: number }[];
    byCompany?: { name: string; value: number }[];
  };
}) {
  const trend = Array.isArray(series?.trend) ? series.trend : [];
  const byCompany = Array.isArray(series?.byCompany) ? series.byCompany : [];
  const totalTrend = trend.reduce((s, p) => s + (Number(p?.y) || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border bg-background px-2 py-1">
          Points: <span className="tabular-nums">{trend.length}</span>
        </span>
        <span className="rounded-full border bg-background px-2 py-1">
          Total(trend):{" "}
          <span className="tabular-nums">¥{totalTrend.toLocaleString()}</span>
        </span>
      </div>

      <div className="rounded-3xl border bg-background p-3">
        <div className="mb-2 text-xs font-semibold text-muted-foreground">
          Trend (Day/Month)
        </div>

        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" hide />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="y" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl border bg-background p-3">
        <div className="mb-2 text-xs font-semibold text-muted-foreground">
          Top Companies
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCompany}>
              <defs>
                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                }}
              />
              <Bar
                dataKey="value"
                radius={[10, 10, 0, 0]}
                fill="url(#colorBar)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// report UI
function MiniKVTable({
  title,
  rows,
}: {
  title: string;
  rows: { k: string; v: any }[];
}) {
  return (
    <div className="overflow-hidden rounded-3xl border bg-background">
      <div className="border-b bg-muted/30 px-4 py-2 text-sm font-semibold">
        {title}
      </div>
      <div className="p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.map((r, i) => (
            <div
              key={r.k + i}
              className="flex items-center justify-between rounded-2xl border bg-background px-3 py-2"
            >
              <div className="text-xs text-muted-foreground">{r.k}</div>
              <div className="text-sm font-semibold tabular-nums">
                {String(r.v ?? "—")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report, title }: { report: any; title?: string }) {
  const stats = report?.stats ?? {};
  const steps: string[] = Array.isArray(report?.next_steps)
    ? report.next_steps
    : [];
  const summary = String(report?.summary ?? "Report");

  return (
    <div className="mt-3 overflow-hidden rounded-3xl border bg-background shadow-sm">
      <div className="border-b bg-muted/30 px-4 py-3">
        <div className="text-sm font-semibold">{title ?? "Report"}</div>
        <div className="mt-1 text-xs text-muted-foreground">{summary}</div>
      </div>

      <div className="grid gap-3 p-3 lg:grid-cols-2">
        <MiniKVTable
          title="Stats"
          rows={[
            { k: "Count", v: stats?.count ?? "—" },
            {
              k: "Total",
              v: `¥${Number(stats?.total_amount ?? 0).toLocaleString()}`,
            },
            {
              k: "Avg",
              v: `¥${Number(stats?.avg_amount ?? 0).toLocaleString()}`,
            },
          ]}
        />

        <div className="overflow-hidden rounded-3xl border bg-background">
          <div className="border-b bg-muted/30 px-4 py-2 text-sm font-semibold">
            Next steps
          </div>
          <div className="p-3">
            {steps.length === 0 ? (
              <div className="text-sm text-muted-foreground">No steps</div>
            ) : (
              <ul className="space-y-2">
                {steps.slice(0, 12).map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="mt-[2px] inline-block h-5 w-5 shrink-0 rounded-full border bg-background text-center text-xs leading-5 text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{s}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// image UI
function downloadDataUrl(dataUrl: string, filename = "image.png") {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function ImageCard({
  title,
  src,
  kind,
  poster,
}: {
  title?: string;
  src: string;
  kind?: Mode | "mixed";
  poster?: PosterMeta | null;
}) {
  const safeName = (
    title ||
    poster?.title ||
    (kind === "income" ? "income" : kind === "outcome" ? "outcome" : "image")
  )
    .replace(/[^\w\-]+/g, "_")
    .slice(0, 40);

  const isPoster = !!poster;
  const styleText = poster?.style ?? poster?.theme ?? null;
  const posterBullets = Array.isArray(poster?.bullets) ? poster!.bullets! : [];

  return (
    <div className="mt-3 overflow-hidden rounded-3xl border bg-background shadow-sm">
      <div className="flex flex-col gap-2 border-b bg-muted/30 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-sm font-semibold">
                {title ??
                  poster?.title ??
                  (kind === "income"
                    ? "Income Image"
                    : kind === "outcome"
                    ? "Outcome Image"
                    : "Image")}
              </div>

              {isPoster ? (
                <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Poster
                </span>
              ) : null}

              {styleText ? (
                <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                  {styleText}
                </span>
              ) : null}

              {poster?.size ? (
                <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                  {poster.size}
                </span>
              ) : null}
            </div>

            {poster?.subtitle ? (
              <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {poster.subtitle}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadDataUrl(src, `${safeName}.png`)}
            >
              Download PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(src, "_blank")}
            >
              Open
            </Button>
          </div>
        </div>

        {isPoster && posterBullets.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {posterBullets.slice(0, 4).map((b, i) => (
              <span
                key={`${b}-${i}`}
                className="rounded-full border bg-background px-2 py-1 text-[11px] text-muted-foreground"
              >
                {b}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="p-3">
        <img
          src={src}
          alt={title ?? poster?.title ?? "image"}
          className="w-full rounded-2xl border"
        />
      </div>
    </div>
  );
}

// main page
export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const textTimer = useRef<number | null>(null);
  const lineTimer = useRef<number | null>(null);
  const fullLinesRef = useRef<Record<string, string[]>>({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [draftAI, setDraftAI] = useState<any>(null);
  const [draftKind, setDraftKind] = useState<Mode>("outcome");

  const [confirmBank, setConfirmBank] = useState<string>("");
  const [confirmDate, setConfirmDate] = useState<string>("");
  const [confirmCompany, setConfirmCompany] = useState<string>("");
  const [confirmMonth, setConfirmMonth] = useState<string>("");

  const quickQA = [
    "joke တစ်ခု ပြောပေး",
    "motivation ပေး",
    "python quiz တစ်ခု ပေး",
    "BINHLAIG project idea ပေး",
    "ဒီလ outcome chart ပြ",
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (textTimer.current) window.clearInterval(textTimer.current);
      if (lineTimer.current) window.clearInterval(lineTimer.current);
    };
  }, []);

  async function parseJsonSafe(res: Response) {
    const raw = await res.text().catch(() => "");
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return { raw };
    }
  }

  async function askAI(input: string): Promise<AIResult> {
    const r = await fetch("/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
    });

    const parsed = await parseJsonSafe(r);

    if (!r.ok) {
      const msg =
        parsed?.error ??
        parsed?.message ??
        parsed?.detail ??
        parsed?.raw ??
        "ask failed";
      throw new Error(`AI error (${r.status}): ${String(msg).slice(0, 300)}`);
    }

    return parsed;
  }

  async function smartParseIncome(input: string): Promise<AIResult> {
    const r = await fetch("/api/ai/parse-income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
    });

    const parsed = await parseJsonSafe(r);

    if (!r.ok) {
      const msg =
        parsed?.error ??
        parsed?.message ??
        parsed?.detail ??
        parsed?.raw ??
        "parse-income failed";
      throw new Error(`AI error (${r.status}): ${String(msg).slice(0, 300)}`);
    }

    return parsed;
  }

  async function smartParseAny(
    input: string
  ): Promise<{ ai: any; kind: Mode | "mixed" }> {
    const raw = (input || "").trim();
    const ai = await askAI(raw);

    if (isFunLikeIntent(ai)) {
      return { ai, kind: "mixed" };
    }

    if (isFinanceIntent(ai)) {
      const kind = detectKindByIntent(ai);
      return { ai, kind: kind === "mixed" ? detectKindByText(raw) : kind };
    }

    // optional fallback for income specific endpoint
    const guess = detectKindByText(raw);
    if (guess === "income" && !isFinanceIntent(ai)) {
      try {
        const incomeAI = await smartParseIncome(raw);
        const kind = detectKindByIntent(incomeAI);
        return { ai: incomeAI, kind: kind === "mixed" ? "income" : kind };
      } catch (e) {
        if (!isBadRequestLike(e)) throw e;
      }
    }

    return { ai, kind: "mixed" };
  }

  async function saveOutcome(
    ai: any,
    override?: { bank?: string; dateISO?: string }
  ) {
    const p = getPayload(ai);

    const bank = override?.bank ?? p.bank ?? ai?.bank ?? "—";
    const dateISO =
      override?.dateISO ?? p.date ?? ai?.date ?? new Date().toISOString();

    const r = await fetch("/api/outcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: p.amount ?? ai?.amount ?? "",
        shop: p.shop ?? ai?.shop ?? "",
        bank,
        notice: `${p.notice ?? ai?.notice ?? ""}`.trim(),
        date: dateISO,
      }),
    });

    if (!r.ok) {
      const parsed = await parseJsonSafe(r);
      const msg =
        parsed?.error ??
        parsed?.message ??
        parsed?.detail ??
        parsed?.raw ??
        "Save failed";
      throw new Error(
        `Save failed (${r.status}): ${String(msg).slice(0, 200)}`
      );
    }
  }

  async function saveIncome(
    ai: any,
    override?: { company?: string; month?: string; dateISO?: string }
  ) {
    const p = getPayload(ai);

    const dateISO =
      override?.dateISO ?? p.date ?? ai?.date ?? new Date().toISOString();

    const date = new Date(dateISO);
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const monthAuto = `${y}-${m}`;

    const company =
      override?.company ??
      p.company ??
      p.compamy ??
      ai?.company ??
      ai?.compamy ??
      "—";

    const month = override?.month ?? p.month ?? ai?.month ?? monthAuto;

    const r = await fetch("/api/incomes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: p.amount ?? ai?.amount ?? "",
        month,
        compamy: company,
        notice: p.notice ?? ai?.notice ?? "",
        date: dateISO,
      }),
    });

    if (!r.ok) {
      const parsed = await parseJsonSafe(r);
      const msg =
        parsed?.error ??
        parsed?.message ??
        parsed?.detail ??
        parsed?.raw ??
        "Save failed";
      throw new Error(
        `Save failed (${r.status}): ${String(msg).slice(0, 200)}`
      );
    }
  }

  function streamAIText(fullText: string) {
    const aiId = uid();
    setMessages((p) => [
      ...p,
      { id: aiId, role: "ai", text: "", streaming: true },
    ]);

    let i = 0;
    const speedMs = 12;

    if (textTimer.current) window.clearInterval(textTimer.current);
    if (lineTimer.current) window.clearInterval(lineTimer.current);

    textTimer.current = window.setInterval(() => {
      i += 1;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId
            ? {
                ...m,
                text: fullText.slice(0, i),
                streaming: i < fullText.length,
              }
            : m
        )
      );

      if (i >= fullText.length) {
        if (textTimer.current) window.clearInterval(textTimer.current);
        textTimer.current = null;
      }
    }, speedMs);
  }

  function draftLines(
    fullLines: string[],
    extra?: Partial<Msg>,
    afterDone?: () => void
  ) {
    const aiId = uid();
    fullLinesRef.current[aiId] = fullLines;

    setMessages((p) => [
      ...p,
      {
        id: aiId,
        role: "ai",
        text: "",
        lines: [""],
        streaming: true,
        done: false,
        ...extra,
      },
    ]);

    let lineIdx = 0;
    let charIdx = 0;
    const speedMs = 14;

    if (textTimer.current) window.clearInterval(textTimer.current);
    if (lineTimer.current) window.clearInterval(lineTimer.current);

    lineTimer.current = window.setInterval(() => {
      const all = fullLinesRef.current[aiId] ?? [];
      if (!all.length) return;

      const currentFull = String(all[lineIdx] ?? "");

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== aiId) return m;

          const curLines = Array.isArray(m.lines) ? [...m.lines] : [""];
          while (curLines.length < lineIdx + 1) curLines.push("");

          const nextChar = currentFull.charAt(charIdx);
          curLines[lineIdx] = (curLines[lineIdx] ?? "") + nextChar;

          return { ...m, lines: curLines, streaming: true };
        })
      );

      charIdx += 1;

      if (charIdx >= currentFull.length) {
        lineIdx += 1;
        charIdx = 0;

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== aiId) return m;
            const curLines = Array.isArray(m.lines) ? [...m.lines] : [];
            if (lineIdx < all.length) curLines.push("");
            return { ...m, lines: curLines, streaming: lineIdx < all.length };
          })
        );

        if (lineIdx >= all.length) {
          if (lineTimer.current) window.clearInterval(lineTimer.current);
          lineTimer.current = null;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId ? { ...m, streaming: false, done: true } : m
            )
          );

          delete fullLinesRef.current[aiId];

          window.setTimeout(() => {
            setMessages((prev) =>
              prev.map((m) => (m.id === aiId ? { ...m, done: false } : m))
            );
          }, 1200);

          afterDone?.();
        }
      }
    }, speedMs);
  }

  function addTableOnlyMessage(
    kind: Mode,
    items: any[],
    lines?: string[],
    cards?: AICard[],
    actions?: AIAction[],
    title?: string
  ) {
    setMessages((p) => [
      ...p,
      {
        id: uid(),
        role: "ai",
        text: `${kind === "income" ? "Income" : "Outcome"} ${
          items.length
        } records`,
        lines,
        cards,
        actions,
        table: { title: title ?? `Total ${items.length}`, rows: items, kind },
      },
    ]);
  }

  function addReportMessage(kind: Mode | "mixed", ai: any) {
    const payload = getPayload(ai);
    const report = payload?.report ?? ai?.report ?? null;
    const lines = pickLines(ai);
    const cards = pickCards(ai);
    const actions = pickActions(ai);

    if (lines.length > 0) {
      draftLines(
        lines,
        { cards, actions },
        () => {
          setMessages((p) => [
            ...p,
            { id: uid(), role: "ai", text: "", report, reportKind: kind },
          ]);
        }
      );
      return;
    }

    setMessages((p) => [
      ...p,
      {
        id: uid(),
        role: "ai",
        text: pickAnswerText(ai),
        cards,
        actions,
        report,
        reportKind: kind,
      },
    ]);
  }

  function addChartMessage(kind: Mode, ai: any) {
    const lines = pickLines(ai);
    const cards = pickCards(ai);
    const actions = pickActions(ai);
    const { series, filters } = pickChartSeries(ai);

    setMessages((p) => [
      ...p,
      {
        id: uid(),
        role: "ai",
        text: pickAnswerText(ai),
        lines: lines.length ? lines : undefined,
        cards,
        actions,
        chart: { series, filters, kind },
      },
    ]);
  }

  function addImageMessage(kind: Mode | "mixed", ai: any) {
    const lines = pickLines(ai);
    const cards = pickCards(ai);
    const actions = pickActions(ai);
    const img = pickImage(ai);
    const poster = pickPoster(ai);

    setMessages((p) => [
      ...p,
      {
        id: uid(),
        role: "ai",
        text: pickAnswerText(ai),
        lines: lines.length ? lines : undefined,
        cards,
        actions,
        image: img ? { ...img, kind, poster } : undefined,
      },
    ]);
  }

  function openConfirmForOutcome(ai: any) {
    const p = getPayload(ai);

    const missing: string[] = Array.isArray(p?.missing_fields)
      ? p.missing_fields
      : Array.isArray(ai?.missing_fields)
      ? ai.missing_fields
      : [];

    const suggestions: string[] = Array.isArray(p?.bank_suggestions)
      ? p.bank_suggestions
      : Array.isArray(ai?.bank_suggestions)
      ? ai.bank_suggestions
      : [];

    const suggestedDateISO = String(
      p?.suggested_date ?? ai?.suggested_date ?? new Date().toISOString()
    );

    const currentBank = String(p?.bank ?? ai?.bank ?? "").trim();

    const d = new Date(suggestedDateISO);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const ymd = `${yyyy}-${mm}-${dd}`;

    setDraftAI(ai);
    setDraftKind("outcome");

    if (currentBank) setConfirmBank(currentBank);
    else if (suggestions.length) setConfirmBank(String(suggestions[0]));
    else setConfirmBank("Cash");

    setConfirmDate(ymd);

    const needsConfirm = Boolean(
      p?.needs_confirm ?? ai?.needs_confirm ?? false
    );
    if (needsConfirm || missing.includes("bank") || missing.includes("date")) {
      setConfirmOpen(true);
    } else {
      saveOutcome(ai).catch(console.error);
    }
  }

  function openConfirmForIncome(ai: any) {
    const p = getPayload(ai);

    const missing: string[] = Array.isArray(p?.missing_fields)
      ? p.missing_fields
      : Array.isArray(ai?.missing_fields)
      ? ai.missing_fields
      : [];

    const suggestedDateISO = String(
      p?.suggested_date ?? ai?.suggested_date ?? new Date().toISOString()
    );

    const d = new Date(suggestedDateISO);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const ymd = `${yyyy}-${mm}-${dd}`;
    const ym = `${yyyy}-${mm}`;

    const currentCompany = String(
      p?.company ?? p?.compamy ?? ai?.company ?? ai?.compamy ?? ""
    ).trim();

    const currentMonth = String(p?.month ?? ai?.month ?? "").trim();

    setDraftAI(ai);
    setDraftKind("income");

    setConfirmDate(ymd);
    setConfirmMonth(currentMonth || ym);
    setConfirmCompany(currentCompany || "Salary");

    const needsConfirm = Boolean(
      p?.needs_confirm ?? ai?.needs_confirm ?? false
    );
    if (
      needsConfirm ||
      missing.includes("company") ||
      missing.includes("month") ||
      missing.includes("date")
    ) {
      setConfirmOpen(true);
    } else {
      saveIncome(ai).catch(console.error);
    }
  }

  async function onConfirmSave() {
    if (!draftAI) {
      setConfirmOpen(false);
      return;
    }

    try {
      setConfirmLoading(true);

      const dateISO = confirmDate
        ? new Date(`${confirmDate}T00:00:00.000Z`).toISOString()
        : new Date().toISOString();

      if (draftKind === "outcome") {
        await saveOutcome(draftAI, { bank: confirmBank || "—", dateISO });

        setMessages((p) => [
          ...p,
          {
            id: uid(),
            role: "ai",
            text: "",
            lines: [
              "✅ Saved (Outcome)",
              `Bank: \`${confirmBank || "—"}\``,
              `Date: \`${confirmDate || "—"}\``,
            ],
            streaming: false,
            done: true,
          },
        ]);
      } else {
        await saveIncome(draftAI, {
          company: confirmCompany || "—",
          month: confirmMonth || "",
          dateISO,
        });

        setMessages((p) => [
          ...p,
          {
            id: uid(),
            role: "ai",
            text: "",
            lines: [
              "✅ Saved (Income)",
              `Company: \`${confirmCompany || "—"}\``,
              `Month: \`${confirmMonth || "—"}\``,
              `Date: \`${confirmDate || "—"}\``,
            ],
            streaming: false,
            done: true,
          },
        ]);
      }

      setConfirmOpen(false);
      setDraftAI(null);
    } catch (e: any) {
      console.error(e);
      streamAIText(`❌ ${e?.message ?? "Save failed"}`);
    } finally {
      setConfirmLoading(false);
    }
  }

  const bankSuggestions = useMemo(() => {
    const p = draftAI ? getPayload(draftAI) : null;
    const list: string[] = Array.isArray(p?.bank_suggestions)
      ? p.bank_suggestions
      : Array.isArray(draftAI?.bank_suggestions)
      ? draftAI.bank_suggestions
      : [];
    return list.length
      ? list
      : [
          "Cash",
          "PayPay",
          "LINE Pay",
          "Suica",
          "JCB 7/11",
          "Visa UFL",
          "VISA SMBC",
        ];
  }, [draftAI]);

  async function sendWithValue(raw: string) {
    const t = raw.trim();
    if (!t || loading) return;

    setMessages((p) => [...p, { id: uid(), role: "user", text: t }]);
    setText("");
    setLoading(true);

    try {
      const { ai, kind } = await smartParseAny(t);
      const lines = pickLines(ai);
      const cards = pickCards(ai);
      const actions = pickActions(ai);

      const payload = getPayload(ai);
      const intent = String(ai?.intent ?? payload?.intent ?? "");

      if (isFunLikeIntent(ai)) {
        if (lines.length > 0) {
          draftLines(lines, { cards, actions });
        } else {
          setMessages((p) => [
            ...p,
            {
              id: uid(),
              role: "ai",
              text: pickAnswerText(ai),
              cards,
              actions,
            },
          ]);
        }
        return;
      }

      const detectedByIntent = detectKindByIntent(ai);
      const kindFinal = (detectedByIntent !== "mixed"
        ? detectedByIntent
        : kind === "mixed"
        ? detectKindByText(t) === "income"
          ? "income"
          : "outcome"
        : kind) as Mode;

      if (
        intent === "outcome_image" ||
        intent === "income_image" ||
        intent === "poster_image"
      ) {
        const imgKind = intent === "poster_image" ? "mixed" : kindFinal;
        if (lines.length > 0) {
          draftLines(lines, { cards, actions }, () =>
            addImageMessage(imgKind, ai)
          );
        } else {
          addImageMessage(imgKind, ai);
        }
        return;
      }

      if (intent === "charts_outcomes" || intent === "charts_incomes") {
        addChartMessage(kindFinal, ai);
        return;
      }

      if (
        intent === "list_outcomes" ||
        intent === "list_incomes" ||
        intent === "query_outcome"
      ) {
        let items: any[] = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(ai?.items)
          ? ai.items
          : [];

        if (
          items.length === 0 &&
          typeof ai?.answer === "string" &&
          intent === "list_outcomes"
        ) {
          items = parseItemsFromAnswer(ai.answer);
        }

        addTableOnlyMessage(
          kindFinal,
          items,
          lines.length ? lines : undefined,
          cards,
          actions,
          payload?.meta?.title ?? undefined
        );
        return;
      }

      if (intent === "next_steps_report" || intent === "income_report") {
        addReportMessage(kindFinal, ai);
        return;
      }

      if (intent === "create_outcome") {
        if (lines.length > 0) {
          draftLines(lines, { cards, actions }, () =>
            openConfirmForOutcome(ai)
          );
        } else {
          openConfirmForOutcome(ai);
        }
        return;
      }

      if (intent === "create_income") {
        if (lines.length > 0) {
          draftLines(lines, { cards, actions }, () => openConfirmForIncome(ai));
        } else {
          openConfirmForIncome(ai);
        }
        return;
      }

      if (lines.length > 0) {
        draftLines(lines, { cards, actions });
        return;
      }

      setMessages((p) => [
        ...p,
        {
          id: uid(),
          role: "ai",
          text: pickAnswerText(ai),
          cards,
          actions,
        },
      ]);
    } catch (e: any) {
      console.error(e);
      streamAIText(`❌ ${e?.message ?? "AI error. Please try again."}`);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    await sendWithValue(text);
  }

  async function onActionClick(action: AIAction) {
    const actionType = String(action?.type ?? "");
    const value = String(action?.value ?? "").trim();

    if (actionType === "prompt" && value) {
      await sendWithValue(value);
      return;
    }

    if (actionType === "download_image") {
      const lastImage = [...messages].reverse().find((m) => m.image?.src);
      if (lastImage?.image?.src) {
        const filename = (
          lastImage.image.title ||
          lastImage.image.poster?.title ||
          "image"
        )
          .replace(/[^\w\-]+/g, "_")
          .slice(0, 40);
        downloadDataUrl(lastImage.image.src, `${filename}.png`);
      }
      return;
    }

    if (actionType === "confirm_save_outcome" && draftAI) {
      setConfirmOpen(true);
      return;
    }

    if (value) {
      await sendWithValue(value);
    }
  }

  const lastTableMsg = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "ai" && messages[i].table) return messages[i];
    }
    return null;
  }, [messages]);

  const lastChartMsg = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "ai" && messages[i].chart?.series)
        return messages[i];
    }
    return null;
  }, [messages]);

  const lastImageMsg = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "ai" && messages[i].image?.src)
        return messages[i];
    }
    return null;
  }, [messages]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {draftKind === "income"
                ? "Confirm Income Save"
                : "Confirm Outcome Save"}
            </DialogTitle>
            <DialogDescription>
              {draftKind === "income"
                ? "Company / Month / Date မပါရင် ဒီမှာရွေးပြီး Save လုပ်ပါ ✅"
                : "Bank / Date မပါရင် ဒီမှာရွေးပြီး Save လုပ်ပါ ✅"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-2xl border bg-muted/30 p-3 text-sm">
              <div className="font-semibold">Draft</div>

              {draftKind === "income" ? (
                <div className="mt-2 grid gap-1 text-muted-foreground">
                  <div>
                    Company:{" "}
                    <span className="font-semibold text-foreground">
                      {String(
                        getPayload(draftAI)?.company ??
                          getPayload(draftAI)?.compamy ??
                          draftAI?.company ??
                          draftAI?.compamy ??
                          "—"
                      )}
                    </span>
                  </div>
                  <div>
                    Amount:{" "}
                    <span className="font-semibold text-foreground">
                      {String(
                        getPayload(draftAI)?.amount ?? draftAI?.amount ?? "—"
                      )}
                    </span>
                  </div>
                  <div>
                    Notice:{" "}
                    <span className="font-semibold text-foreground">
                      {String(
                        getPayload(draftAI)?.notice ?? draftAI?.notice ?? "—"
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 grid gap-1 text-muted-foreground">
                  <div>
                    Shop:{" "}
                    <span className="font-semibold text-foreground">
                      {String(
                        getPayload(draftAI)?.shop ?? draftAI?.shop ?? "—"
                      )}
                    </span>
                  </div>
                  <div>
                    Amount:{" "}
                    <span className="font-semibold text-foreground">
                      {String(
                        getPayload(draftAI)?.amount ?? draftAI?.amount ?? "—"
                      )}
                    </span>
                  </div>
                  <div>
                    Notice:{" "}
                    <span className="font-semibold text-foreground">
                      {String(
                        getPayload(draftAI)?.notice ?? draftAI?.notice ?? "—"
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {draftKind === "income" ? (
              <>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Company
                  </div>
                  <Input
                    value={confirmCompany}
                    onChange={(e) => setConfirmCompany(e.target.value)}
                    placeholder="e.g. Salary / ABC Co., Ltd."
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Month (YYYY-MM)
                  </div>
                  <Input
                    value={confirmMonth}
                    onChange={(e) => setConfirmMonth(e.target.value)}
                    placeholder="2026-03"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Date
                  </div>
                  <Input
                    type="date"
                    value={confirmDate}
                    onChange={(e) => setConfirmDate(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Bank
                  </div>
                  <select
                    className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                    value={confirmBank}
                    onChange={(e) => setConfirmBank(e.target.value)}
                  >
                    {bankSuggestions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Date
                  </div>
                  <Input
                    type="date"
                    value={confirmDate}
                    onChange={(e) => setConfirmDate(e.target.value)}
                  />
                  <div className="text-[11px] text-muted-foreground">
                    Calendar က auto ပေါ်လာပြီး ရွေးလို့ရပါတယ် ✅
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setDraftAI(null);
              }}
              disabled={confirmLoading}
            >
              Cancel
            </Button>
            <Button onClick={onConfirmSave} disabled={confirmLoading}>
              {confirmLoading ? "Saving..." : "Save ✅"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="w-full flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {quickQA.map((q) => (
              <Button
                key={q}
                variant="outline"
                size="sm"
                onClick={() => sendWithValue(q)}
                disabled={loading}
              >
                {q}
              </Button>
            ))}
          </div>

          {messages.map((m) => (
            <div key={m.id} className="mb-5 w-full">
              {m.role === "user" ? (
                <div className="ml-auto flex max-w-[92%] items-start justify-end gap-3 sm:max-w-[80%]">
                  <div className="whitespace-pre-wrap rounded-3xl bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground shadow-sm">
                    {m.text}
                  </div>
                  <UserAvatar />
                </div>
              ) : (
                <div className="flex w-full items-start gap-3">
                  <AIAvatar />

                  <div className="min-w-0 max-w-[92%] sm:max-w-[80%]">
                    {m.lines ? (
                      <PrettyLinesBubble
                        lines={m.lines}
                        streaming={m.streaming}
                        done={m.done}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap rounded-3xl border bg-muted/50 px-4 py-3 text-sm leading-6 shadow-sm">
                        {m.text}
                        {m.streaming ? (
                          <span className="ml-1 inline-block w-2 animate-pulse">
                            ▍
                          </span>
                        ) : null}
                      </div>
                    )}

                    {m.cards?.length ? <CardsRow cards={m.cards} /> : null}

                    {m.actions?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {m.actions.map((a, i) => (
                          <Button
                            key={`${a.label}-${i}`}
                            variant="outline"
                            size="sm"
                            onClick={() => onActionClick(a)}
                          >
                            {a.label || "Action"}
                          </Button>
                        ))}
                      </div>
                    ) : null}

                    {m.role === "ai" && m.table && m.id === lastTableMsg?.id ? (
                      m.table.kind === "income" ? (
                        <IncomesTableCard
                          title={m.table.title ?? ""}
                          rows={Array.isArray(m.table.rows) ? m.table.rows : []}
                        />
                      ) : (
                        <OutcomesTableCard
                          title={m.table.title ?? ""}
                          rows={Array.isArray(m.table.rows) ? m.table.rows : []}
                        />
                      )
                    ) : null}

                    {m.role === "ai" &&
                    m.chart?.series &&
                    m.id === lastChartMsg?.id ? (
                      <ChartCard
                        title={
                          m.chart.kind === "income"
                            ? "Income Charts"
                            : "Outcome Charts"
                        }
                      >
                        {m.chart.kind === "income" ? (
                          <IncomeChartsCard
                            series={{
                              trend: m.chart.series.trend ?? [],
                              byCompany:
                                (m.chart.series as any).byCompany ?? [],
                            }}
                          />
                        ) : (
                          <OutcomeChartsCard series={m.chart.series as any} />
                        )}
                      </ChartCard>
                    ) : null}

                    {m.role === "ai" &&
                    m.image?.src &&
                    m.id === lastImageMsg?.id ? (
                      <ImageCard
                        title={m.image.title}
                        src={m.image.src}
                        kind={m.image.kind}
                        poster={m.image.poster}
                      />
                    ) : null}

                    {m.role === "ai" && m.report ? (
                      <ReportCard
                        report={m.report}
                        title={
                          m.reportKind === "income"
                            ? "Income Report"
                            : m.reportKind === "outcome"
                            ? "Outcome Report"
                            : "Report"
                        }
                      />
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="text-xs text-muted-foreground">AI thinking…</div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t bg-background/80 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-5xl gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Try: "Lawson 980 snack" / "ဒီလ outcome chart ပြ" / "poster: Title | Subtitle | bullet1, bullet2" / "joke တစ်ခု ပြောပေး" / "motivation ပေး" / "python quiz တစ်ခု ပေး" / "BINHLAIG project idea ပေး"'
            onKeyDown={(e) => {
              // @ts-ignore
              if (e.nativeEvent?.isComposing) return;
              if (e.key === "Enter") send();
            }}
          />

          <Button onClick={send} disabled={loading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}



                // "use client";

                // import React, { useEffect, useMemo, useRef, useState } from "react";
                // import {
                //   Send,
                //   ChevronLeft,
                //   ChevronRight,
                //   CheckCircle2,
                //   Sparkles,
                // } from "lucide-react";

                // import { Button } from "@/components/ui/button";
                // import { Input } from "@/components/ui/input";

                // // Table
                // import {
                //   Table,
                //   TableBody,
                //   TableCell,
                //   TableHead,
                //   TableHeader,
                //   TableRow,
                // } from "@/components/ui/table";

                // // Dialog
                // import {
                //   Dialog,
                //   DialogContent,
                //   DialogHeader,
                //   DialogTitle,
                //   DialogDescription,
                //   DialogFooter,
                // } from "@/components/ui/dialog";

                // // Charts
                // import {
                //   ResponsiveContainer,
                //   LineChart,
                //   Line,
                //   XAxis,
                //   YAxis,
                //   Tooltip,
                //   CartesianGrid,
                //   BarChart,
                //   Bar,
                // } from "recharts";
                // import OutcomeChartsCard from "@/components/ai/OtcomeChartpage";

                // type Mode = "outcome" | "income";
                // type DetectKind = Mode | "mixed";

                // type PosterMeta = {
                //   size?: string | null;
                //   title?: string | null;
                //   subtitle?: string | null;
                //   bullets?: string[] | null;
                //   footer?: string | null;
                //   theme?: string | null;
                //   style?: string | null;
                // };

                // type AICard = {
                //   label?: string;
                //   value?: any;
                // };

                // type AIAction = {
                //   type?: string;
                //   label?: string;
                //   value?: string;
                //   field?: string;
                // };

                // type Msg = {
                //   id: string;
                //   role: "user" | "ai";
                //   text: string;
                //   lines?: string[];
                //   streaming?: boolean;
                //   done?: boolean;

                //   cards?: AICard[];
                //   actions?: AIAction[];

                //   table?: { title?: string; rows: any[]; kind?: Mode };
                //   report?: any;
                //   reportKind?: Mode | "mixed";
                //   chart?: {
                //     series?: {
                //       trend?: { x: string; y: number }[];
                //       byShop?: { name: string; value: number }[];
                //       byCategory?: { name: string; value: number }[];
                //       byBank?: { name: string; value: number }[];
                //       byCompany?: { name: string; value: number }[];
                //     };
                //     filters?: any;
                //     kind?: Mode;
                //   };
                //   image?: {
                //     src: string;
                //     title?: string;
                //     kind?: Mode | "mixed";
                //     poster?: PosterMeta | null;
                //   };
                // };

                // type AIResult = any;

                // // helpers
                // function uid() {
                //   return typeof crypto !== "undefined" && "randomUUID" in crypto
                //     ? crypto.randomUUID()
                //     : Math.random().toString(16).slice(2);
                // }

                // function getPayload(ai: any) {
                //   return ai?.payload ?? ai;
                // }

                // function getAssistant(ai: any) {
                //   return ai?.assistant ?? null;
                // }

                // function toISODate(v: any): string {
                //   if (!v) return "";
                //   const raw = v?.$date ?? v;
                //   const d = raw instanceof Date ? raw : new Date(raw);
                //   if (Number.isNaN(d.getTime())) return "";
                //   const y = d.getFullYear();
                //   const m = String(d.getMonth() + 1).padStart(2, "0");
                //   const day = String(d.getDate()).padStart(2, "0");
                //   return `${y}-${m}-${day}`;
                // }

                // function toNumber(v: any): number | null {
                //   if (v === null || v === undefined) return null;
                //   const n = Number(String(v).replace(/[^\d.-]/g, ""));
                //   return Number.isFinite(n) ? n : null;
                // }

                // function yen(v: any): string {
                //   const n = toNumber(v);
                //   if (n === null) return v ? `¥${String(v)}` : "—";
                //   return `¥${n.toLocaleString()}`;
                // }

                // function cellText(v: any): string {
                //   if (v === null || v === undefined) return "—";
                //   const s = String(v).trim();
                //   return s ? s : "—";
                // }

                // function csvEscape(s: string) {
                //   const t = s.replace(/"/g, '""');
                //   return `"${t}"`;
                // }

                // function exportOutcomesCSV(rows: any[], filename = "outcomes.csv") {
                //   const headers = ["date", "shop", "bank", "amount", "notice"];
                //   const lines: string[] = [];
                //   lines.push(headers.join(","));

                //   for (const r of rows) {
                //     const date = toISODate(r?.date) || toISODate(r?.createdAt);
                //     const shop = String(r?.shop ?? "");
                //     const bank = String(r?.bank ?? "");
                //     const amount = String(r?.amount ?? "");
                //     const notice = String(r?.notice ?? "");

                //     lines.push(
                //       [
                //         csvEscape(date),
                //         csvEscape(shop),
                //         csvEscape(bank),
                //         csvEscape(amount),
                //         csvEscape(notice),
                //       ].join(",")
                //     );
                //   }

                //   const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
                //   const url = URL.createObjectURL(blob);
                //   const a = document.createElement("a");
                //   a.href = url;
                //   a.download = filename;
                //   document.body.appendChild(a);
                //   a.click();
                //   a.remove();
                //   URL.revokeObjectURL(url);
                // }

                // function exportIncomesCSV(rows: any[], filename = "incomes.csv") {
                //   const headers = ["date", "company", "month", "amount", "notice"];
                //   const lines: string[] = [];
                //   lines.push(headers.join(","));

                //   for (const r of rows) {
                //     const date = toISODate(r?.date) || toISODate(r?.createdAt);
                //     const company = String(r?.company ?? r?.compamy ?? "");
                //     const month = String(r?.month ?? "");
                //     const amount = String(r?.amount ?? "");
                //     const notice = String(r?.notice ?? "");

                //     lines.push(
                //       [
                //         csvEscape(date),
                //         csvEscape(company),
                //         csvEscape(month),
                //         csvEscape(amount),
                //         csvEscape(notice),
                //       ].join(",")
                //     );
                //   }

                //   const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
                //   const url = URL.createObjectURL(blob);
                //   const a = document.createElement("a");
                //   a.href = url;
                //   a.download = filename;
                //   document.body.appendChild(a);
                //   a.click();
                //   a.remove();
                //   URL.revokeObjectURL(url);
                // }

                // function parseItemsFromAnswer(answer: string): any[] {
                //   const lines = (answer ?? "")
                //     .split("\n")
                //     .map((s) => s.trim())
                //     .filter(Boolean);

                //   const rows: any[] = [];
                //   for (const line of lines) {
                //     const m = line.match(
                //       /^\d+\.\s*(.+?)\s+¥\s*([\d,]+)(?:\s+\[(.*?)\])?(?:\s+(.*))?$/i
                //     );
                //     if (!m) continue;

                //     rows.push({
                //       date: "",
                //       shop: (m[1] ?? "").trim(),
                //       amount: (m[2] ?? "").replace(/,/g, ""),
                //       category: (m[3] ?? "").trim() || "-",
                //       notice: (m[4] ?? "").trim() || "",
                //       bank: "",
                //     });
                //   }
                //   return rows;
                // }

                // function pickLines(ai: any): string[] {
                //   const assistant = getAssistant(ai);
                //   const payload = getPayload(ai);

                //   const lines =
                //     (Array.isArray(assistant?.lines) ? assistant.lines : null) ??
                //     (Array.isArray(payload?.answer_lines) ? payload.answer_lines : null) ??
                //     (Array.isArray(ai?.answer_lines) ? ai.answer_lines : null) ??
                //     [];

                //   return Array.isArray(lines) ? lines.map(String).filter(Boolean) : [];
                // }

                // function pickCards(ai: any): AICard[] {
                //   const assistant = getAssistant(ai);
                //   const cards = Array.isArray(assistant?.cards) ? assistant.cards : [];
                //   return cards.map((c: any) => ({
                //     label: typeof c?.label === "string" ? c.label : "",
                //     value: c?.value,
                //   }));
                // }

                // function pickActions(ai: any): AIAction[] {
                //   const assistant = getAssistant(ai);
                //   const actions = Array.isArray(assistant?.actions) ? assistant.actions : [];
                //   return actions.map((a: any) => ({
                //     type: typeof a?.type === "string" ? a.type : "",
                //     label: typeof a?.label === "string" ? a.label : "",
                //     value: typeof a?.value === "string" ? a.value : "",
                //     field: typeof a?.field === "string" ? a.field : "",
                //   }));
                // }

                // function pickAnswerText(ai: any): string {
                //   const assistant = getAssistant(ai);
                //   const payload = getPayload(ai);
                //   return String(
                //     assistant?.message ?? ai?.answer ?? payload?.answer ?? ai?.message ?? "OK"
                //   );
                // }

                // function pickChartSeries(ai: any) {
                //   const payload = getPayload(ai);

                //   const s =
                //     payload?.series ??
                //     payload?.chart?.series ??
                //     ai?.series ??
                //     ai?.chart?.series ??
                //     null;

                //   const series = {
                //     trend: Array.isArray(s?.trend) ? s.trend : [],
                //     byShop: Array.isArray(s?.byShop) ? s.byShop : [],
                //     byCategory: Array.isArray(s?.byCategory) ? s.byCategory : [],
                //     byBank: Array.isArray(s?.byBank) ? s.byBank : [],
                //     byCompany: Array.isArray(s?.byCompany)
                //       ? s.byCompany
                //       : Array.isArray(s?.byShop)
                //       ? s.byShop
                //       : [],
                //   };

                //   const filters =
                //     payload?.filters ??
                //     payload?.chart?.filters ??
                //     ai?.filters ??
                //     ai?.chart?.filters ??
                //     null;

                //   return { series, filters };
                // }

                // function pickImage(ai: any): { src: string; title?: string } | null {
                //   const payload = getPayload(ai);
                //   const img = payload?.image ?? ai?.image ?? null;

                //   const src =
                //     typeof img?.data_url === "string" && img.data_url.startsWith("data:image/")
                //       ? img.data_url
                //       : null;

                //   if (!src) return null;

                //   return {
                //     src,
                //     title: typeof img?.title === "string" ? img.title : undefined,
                //   };
                // }

                // function pickPoster(ai: any): PosterMeta | null {
                //   const payload = getPayload(ai);
                //   const poster = payload?.poster ?? ai?.poster ?? null;

                //   if (!poster || typeof poster !== "object") return null;

                //   return {
                //     size: typeof poster?.size === "string" ? poster.size : null,
                //     title: typeof poster?.title === "string" ? poster.title : null,
                //     subtitle: typeof poster?.subtitle === "string" ? poster.subtitle : null,
                //     bullets: Array.isArray(poster?.bullets)
                //       ? poster.bullets.map((x: any) => String(x))
                //       : null,
                //     footer: typeof poster?.footer === "string" ? poster.footer : null,
                //     theme: typeof poster?.theme === "string" ? poster.theme : null,
                //     style: typeof poster?.style === "string" ? poster.style : null,
                //   };
                // }

                // // unified AI routing
                // function detectKindByText(input: string): DetectKind {
                //   const t = (input || "").toLowerCase().trim();

                //   const incomeHints = [
                //     "income",
                //     "incomes",
                //     "salary",
                //     "pay",
                //     "wage",
                //     "bonus",
                //     "allowance",
                //     "company",
                //     "compamy",
                //     "ဝင်ငွေ",
                //     "လစာ",
                //     "လုပ်ခ",
                //     "အလုပ်လစာ",
                //   ];

                //   const outcomeHints = [
                //     "outcome",
                //     "outcomes",
                //     "spend",
                //     "expense",
                //     "spent",
                //     "buy",
                //     "bought",
                //     "shop",
                //     "lawson",
                //     "familymart",
                //     "7-eleven",
                //     "aeon",
                //     "donki",
                //     "don quijote",
                //     "ကုန်ကျ",
                //     "အသုံးစရိတ်",
                //     "သုံး",
                //     "ဝယ်",
                //   ];

                //   const mixedHints = [
                //     "report",
                //     "analysis",
                //     "insight",
                //     "next steps",
                //     "poster",
                //     "image",
                //     "chart",
                //     "graph",
                //     "ai poster",
                //     "summary",
                //     "အကြံပြု",
                //     "ဘာတွေလုပ်ရမလဲ",
                //     "ပုံ",
                //     "ပိုစတာ",
                //     "ဓာတ်ပုံ",
                //   ];

                //   const hasIncome = incomeHints.some((k) => t.includes(k));
                //   const hasOutcome = outcomeHints.some((k) => t.includes(k));
                //   const hasMixed = mixedHints.some((k) => t.includes(k));

                //   if (hasIncome && !hasOutcome) return "income";
                //   if (hasOutcome && !hasIncome) return "outcome";
                //   if (hasMixed) return "mixed";

                //   return "mixed";
                // }

                // function detectKindByIntent(ai: any): Mode | "mixed" {
                //   const payload = getPayload(ai);
                //   const intent = String(ai?.intent ?? payload?.intent ?? "").toLowerCase();

                //   if (!intent) return "mixed";
                //   if (intent.includes("income")) return "income";
                //   if (intent.includes("outcome")) return "outcome";
                //   if (intent === "poster_image") return "mixed";
                //   if (intent.includes("list_incomes") || intent.includes("charts_incomes"))
                //     return "income";
                //   if (intent.includes("list_outcomes") || intent.includes("charts_outcomes"))
                //     return "outcome";

                //   return "mixed";
                // }

                // function isRecognized(ai: any): boolean {
                //   const payload = getPayload(ai);
                //   const intent = String(ai?.intent ?? payload?.intent ?? "").toLowerCase();

                //   if (!intent) return false;

                //   const okIntents = [
                //     "create_outcome",
                //     "list_outcomes",
                //     "charts_outcomes",
                //     "query_outcome",
                //     "outcome_image",
                //     "next_steps_report",
                //     "create_income",
                //     "list_incomes",
                //     "charts_incomes",
                //     "income_image",
                //     "income_report",
                //     "poster_image",
                //   ];
                //   return okIntents.includes(intent);
                // }

                // function isBadRequestLike(error: any): boolean {
                //   const msg = String(error?.message ?? "").toLowerCase();
                //   return (
                //     msg.includes("400") ||
                //     msg.includes("bad request") ||
                //     msg.includes("text is required") ||
                //     msg.includes("invalid request") ||
                //     msg.includes("unsupported")
                //   );
                // }

                // // avatars
                // function AIAvatar() {
                //   return (
                //     <div className="mt-1 grid h-10 w-10 place-items-center rounded-2xl border bg-gradient-to-br from-primary/25 to-muted shadow-sm">
                //       <Sparkles className="h-5 w-5 text-primary" />
                //     </div>
                //   );
                // }

                // function UserAvatar() {
                //   return (
                //     <div className="mt-1 grid h-10 w-10 place-items-center rounded-2xl border bg-muted/40 shadow-sm">
                //       <span className="text-xs font-semibold text-muted-foreground">You</span>
                //     </div>
                //   );
                // }

                // // pretty lines
                // function InlineCodeText({ text }: { text: string }) {
                //   const parts = String(text).split(/(`[^`]+`)/g);

                //   return (
                //     <>
                //       {parts.map((p, i) => {
                //         const isCode = p.startsWith("`") && p.endsWith("`");
                //         if (!isCode) return <span key={i}>{p}</span>;
                //         const code = p.slice(1, -1);
                //         return (
                //           <code
                //             key={i}
                //             className="mx-1 rounded-md border bg-background px-2 py-0.5 font-mono text-xs text-foreground"
                //           >
                //             {code}
                //           </code>
                //         );
                //       })}
                //     </>
                //   );
                // }

                // function DraftingBadge({ done }: { done?: boolean }) {
                //   return (
                //     <div
                //       className={[
                //         "inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[11px]",
                //         done
                //           ? "text-emerald-600 dark:text-emerald-400"
                //           : "text-muted-foreground",
                //       ].join(" ")}
                //     >
                //       {done ? (
                //         <>
                //           <CheckCircle2 className="h-3.5 w-3.5" />
                //           <span>Saved</span>
                //         </>
                //       ) : (
                //         <>
                //           <Sparkles className="h-3.5 w-3.5" />
                //           <span>Drafting…</span>
                //         </>
                //       )}
                //     </div>
                //   );
                // }

                // function DonePop() {
                //   return (
                //     <div className="pointer-events-none absolute right-3 top-3 animate-[pop_650ms_ease-out_1]">
                //       <div className="flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400 shadow-sm">
                //         <CheckCircle2 className="h-4 w-4" />
                //         Done
                //       </div>
                //     </div>
                //   );
                // }

                // function PrettyLinesBubble({
                //   lines,
                //   streaming,
                //   done,
                // }: {
                //   lines: string[];
                //   streaming?: boolean;
                //   done?: boolean;
                // }) {
                //   const safeLines = Array.isArray(lines) ? lines : [];

                //   if (!safeLines?.length) {
                //     return (
                //       <div className="relative rounded-3xl border bg-muted/50 px-4 py-3 text-sm leading-6 shadow-sm">
                //         <div className="flex items-center justify-between">
                //           <div className="text-base font-semibold">AI</div>
                //           <DraftingBadge done={false} />
                //         </div>
                //         <div className="mt-2 text-muted-foreground">
                //           Writing…
                //           <span className="ml-1 inline-block w-2 animate-pulse">▍</span>
                //         </div>
                //       </div>
                //     );
                //   }

                //   const head = safeLines[0] ?? "";
                //   const rest = safeLines.slice(1);
                //   const isBullet = (s: string) => /^\s*[•\-*]\s+/.test(s);

                //   return (
                //     <div className="relative rounded-3xl border bg-muted/50 px-4 py-3 text-sm leading-6 shadow-sm">
                //       <div className="flex items-center justify-between gap-3">
                //         <div className="text-base font-semibold">
                //           <InlineCodeText text={head} />
                //         </div>

                //         <div className="flex items-center gap-2">
                //           <DraftingBadge done={done} />
                //           {streaming ? (
                //             <span className="inline-block w-2 animate-pulse text-muted-foreground">
                //               ▍
                //             </span>
                //           ) : null}
                //         </div>
                //       </div>

                //       {!streaming && done ? <DonePop /> : null}

                //       {rest.length > 0 ? (
                //         <div className="mt-2 space-y-2">
                //           {rest.map((line, idx) => {
                //             const bullet = isBullet(line);
                //             const clean = bullet ? line.replace(/^\s*[•\-*]\s+/, "") : line;

                //             return (
                //               <div key={idx} className={bullet ? "flex gap-2" : ""}>
                //                 {bullet ? <span className="mt-[2px]">•</span> : null}
                //                 <div className="text-muted-foreground">
                //                   <InlineCodeText text={clean} />
                //                 </div>
                //               </div>
                //             );
                //           })}
                //         </div>
                //       ) : null}
                //     </div>
                //   );
                // }

                // function CardsRow({ cards }: { cards: AICard[] }) {
                //   if (!cards?.length) return null;

                //   return (
                //     <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                //       {cards.map((c, i) => (
                //         <div
                //           key={`${c.label}-${i}`}
                //           className="rounded-2xl border bg-background px-3 py-3 shadow-sm"
                //         >
                //           <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                //             {c.label || "Info"}
                //           </div>
                //           <div className="mt-1 text-sm font-semibold break-words">
                //             {String(c.value ?? "—")}
                //           </div>
                //         </div>
                //       ))}
                //     </div>
                //   );
                // }

                // // outcome table
                // function OutcomesTableCard({ title, rows }: { title: string; rows: any[] }) {
                //   const [bankFilter, setBankFilter] = useState<string>("ALL");
                //   const [page, setPage] = useState(1);
                //   const [pageSize, setPageSize] = useState(10);

                //   const banks = useMemo(() => {
                //     return Array.from(
                //       new Set(rows.map((r) => String(r?.bank ?? "").trim()).filter(Boolean))
                //     ).sort((a, b) => a.localeCompare(b));
                //   }, [rows]);

                //   const filtered = useMemo(() => {
                //     if (bankFilter === "ALL") return rows;
                //     return rows.filter((r) => String(r?.bank ?? "").trim() === bankFilter);
                //   }, [rows, bankFilter]);

                //   const totalRows = filtered.length;
                //   const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
                //   const safePage = Math.min(Math.max(1, page), totalPages);

                //   useEffect(() => {
                //     if (page !== safePage) setPage(safePage);
                //   }, [page, safePage]);

                //   useEffect(() => {
                //     setPage(1);
                //   }, [bankFilter, pageSize]);

                //   const pagedRows = useMemo(() => {
                //     const start = (safePage - 1) * pageSize;
                //     return filtered.slice(start, start + pageSize);
                //   }, [filtered, safePage, pageSize]);

                //   const totalAmount = useMemo(() => {
                //     return filtered.reduce((sum, r) => sum + (toNumber(r?.amount) ?? 0), 0);
                //   }, [filtered]);

                //   const fromIdx = totalRows === 0 ? 0 : (safePage - 1) * pageSize + 1;
                //   const toIdx = Math.min(safePage * pageSize, totalRows);

                //   return (
                //     <div className="mt-3 overflow-hidden rounded-3xl border bg-background shadow-sm">
                //       <div className="flex flex-col gap-2 border-b bg-muted/30 px-4 py-3">
                //         <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                //           <div className="flex items-center gap-3">
                //             <div className="text-sm font-semibold">Outcomes</div>
                //             <div className="text-xs text-muted-foreground">{title}</div>
                //           </div>

                //           <div className="flex flex-wrap items-center gap-2">
                //             <div className="flex items-center gap-2">
                //               <span className="text-xs text-muted-foreground">Bank</span>
                //               <select
                //                 className="h-8 rounded-md border bg-background px-2 text-sm"
                //                 value={bankFilter}
                //                 onChange={(e) => setBankFilter(e.target.value)}
                //               >
                //                 <option value="ALL">All</option>
                //                 {banks.map((b) => (
                //                   <option key={b} value={b}>
                //                     {b}
                //                   </option>
                //                 ))}
                //               </select>
                //             </div>

                //             <div className="flex items-center gap-2">
                //               <span className="text-xs text-muted-foreground">Rows</span>
                //               <select
                //                 className="h-8 rounded-md border bg-background px-2 text-sm"
                //                 value={pageSize}
                //                 onChange={(e) => setPageSize(Number(e.target.value))}
                //               >
                //                 <option value={10}>10</option>
                //                 <option value={25}>25</option>
                //                 <option value={50}>50</option>
                //               </select>
                //             </div>

                //             <Button
                //               variant="outline"
                //               size="sm"
                //               onClick={() => exportOutcomesCSV(filtered, "outcomes.csv")}
                //             >
                //               Export CSV
                //             </Button>
                //           </div>
                //         </div>

                //         <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                //           <Button
                //             variant="outline"
                //             size="sm"
                //             onClick={() => setPage((p) => Math.max(1, p - 1))}
                //             disabled={safePage <= 1}
                //           >
                //             <ChevronLeft className="h-4 w-4" />
                //           </Button>

                //           <span className="tabular-nums">
                //             Page {safePage} / {totalPages}
                //           </span>

                //           <Button
                //             variant="outline"
                //             size="sm"
                //             onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                //             disabled={safePage >= totalPages}
                //           >
                //             <ChevronRight className="h-4 w-4" />
                //           </Button>

                //           <span className="tabular-nums">
                //             Showing {fromIdx}–{toIdx} of {totalRows}
                //           </span>

                //           <span className="tabular-nums">
                //             Total: ¥{totalAmount.toLocaleString()}
                //           </span>
                //         </div>
                //       </div>

                //       <div className="max-h-[520px] overflow-auto">
                //         <Table>
                //           <TableHeader className="sticky top-0 z-10 bg-background">
                //             <TableRow className="bg-background">
                //               <TableHead className="whitespace-nowrap">Date</TableHead>
                //               <TableHead className="whitespace-nowrap">Shop</TableHead>
                //               <TableHead className="whitespace-nowrap">Bank</TableHead>
                //               <TableHead className="whitespace-nowrap text-right">
                //                 Amount
                //               </TableHead>
                //               <TableHead className="whitespace-nowrap">Notice</TableHead>
                //             </TableRow>
                //           </TableHeader>

                //           <TableBody>
                //             {pagedRows.length === 0 ? (
                //               <TableRow>
                //                 <TableCell
                //                   colSpan={5}
                //                   className="py-10 text-center text-sm text-muted-foreground"
                //                 >
                //                   No data
                //                 </TableCell>
                //               </TableRow>
                //             ) : (
                //               pagedRows.map((r: any, idx: number) => {
                //                 const date = toISODate(r?.date) || toISODate(r?.createdAt);
                //                 const shop = cellText(r?.shop);
                //                 const bank = cellText(r?.bank);
                //                 const amountNum = toNumber(r?.amount);
                //                 const notice = cellText(r?.notice);

                //                 const amountCls =
                //                   amountNum === null
                //                     ? "text-muted-foreground"
                //                     : amountNum > 0
                //                     ? "text-emerald-600 dark:text-emerald-400"
                //                     : amountNum < 0
                //                     ? "text-red-600 dark:text-red-400"
                //                     : "text-muted-foreground";

                //                 return (
                //                   <TableRow
                //                     key={r?._id?.$oid ?? r?._id ?? `${safePage}-${idx}`}
                //                     className={[
                //                       "hover:bg-muted/30",
                //                       idx % 2 === 0 ? "bg-background" : "bg-muted/10",
                //                     ].join(" ")}
                //                   >
                //                     <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                //                       {date || "—"}
                //                     </TableCell>

                //                     <TableCell className="max-w-[220px]">
                //                       <span className="inline-flex items-center rounded-full border bg-background px-2 py-1 text-xs">
                //                         {shop}
                //                       </span>
                //                     </TableCell>

                //                     <TableCell className="max-w-[220px]">
                //                       <span className="inline-flex items-center rounded-full border bg-background px-2 py-1 text-xs">
                //                         {bank}
                //                       </span>
                //                     </TableCell>

                //                     <TableCell
                //                       className={[
                //                         "whitespace-nowrap text-right font-semibold tabular-nums",
                //                         amountCls,
                //                       ].join(" ")}
                //                     >
                //                       {yen(r?.amount)}
                //                     </TableCell>

                //                     <TableCell className="max-w-[360px] text-sm text-muted-foreground">
                //                       {notice}
                //                     </TableCell>
                //                   </TableRow>
                //                 );
                //               })
                //             )}
                //           </TableBody>
                //         </Table>
                //       </div>
                //     </div>
                //   );
                // }

                // // income table
                // function IncomesTableCard({ title, rows }: { title: string; rows: any[] }) {
                //   const [companyFilter, setCompanyFilter] = useState<string>("ALL");
                //   const [page, setPage] = useState(1);
                //   const [pageSize, setPageSize] = useState(10);

                //   const companies = useMemo(() => {
                //     return Array.from(
                //       new Set(
                //         rows
                //           .map((r) => String(r?.company ?? r?.compamy ?? "").trim())
                //           .filter(Boolean)
                //       )
                //     ).sort((a, b) => a.localeCompare(b));
                //   }, [rows]);

                //   const filtered = useMemo(() => {
                //     if (companyFilter === "ALL") return rows;
                //     return rows.filter(
                //       (r) => String(r?.company ?? r?.compamy ?? "").trim() === companyFilter
                //     );
                //   }, [rows, companyFilter]);

                //   const totalRows = filtered.length;
                //   const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
                //   const safePage = Math.min(Math.max(1, page), totalPages);

                //   useEffect(() => {
                //     if (page !== safePage) setPage(safePage);
                //   }, [page, safePage]);

                //   useEffect(() => {
                //     setPage(1);
                //   }, [companyFilter, pageSize]);

                //   const pagedRows = useMemo(() => {
                //     const start = (safePage - 1) * pageSize;
                //     return filtered.slice(start, start + pageSize);
                //   }, [filtered, safePage, pageSize]);

                //   const totalAmount = useMemo(() => {
                //     return filtered.reduce((sum, r) => sum + (toNumber(r?.amount) ?? 0), 0);
                //   }, [filtered]);

                //   const fromIdx = totalRows === 0 ? 0 : (safePage - 1) * pageSize + 1;
                //   const toIdx = Math.min(safePage * pageSize, totalRows);

                //   return (
                //     <div className="mt-3 overflow-hidden rounded-3xl border bg-background shadow-sm">
                //       <div className="flex flex-col gap-2 border-b bg-muted/30 px-4 py-3">
                //         <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                //           <div className="flex items-center gap-3">
                //             <div className="text-sm font-semibold">Incomes</div>
                //             <div className="text-xs text-muted-foreground">{title}</div>
                //           </div>

                //           <div className="flex flex-wrap items-center gap-2">
                //             <div className="flex items-center gap-2">
                //               <span className="text-xs text-muted-foreground">Company</span>
                //               <select
                //                 className="h-8 rounded-md border bg-background px-2 text-sm"
                //                 value={companyFilter}
                //                 onChange={(e) => setCompanyFilter(e.target.value)}
                //               >
                //                 <option value="ALL">All</option>
                //                 {companies.map((c) => (
                //                   <option key={c} value={c}>
                //                     {c}
                //                   </option>
                //                 ))}
                //               </select>
                //             </div>

                //             <div className="flex items-center gap-2">
                //               <span className="text-xs text-muted-foreground">Rows</span>
                //               <select
                //                 className="h-8 rounded-md border bg-background px-2 text-sm"
                //                 value={pageSize}
                //                 onChange={(e) => setPageSize(Number(e.target.value))}
                //               >
                //                 <option value={10}>10</option>
                //                 <option value={25}>25</option>
                //                 <option value={50}>50</option>
                //               </select>
                //             </div>

                //             <Button
                //               variant="outline"
                //               size="sm"
                //               onClick={() => exportIncomesCSV(filtered, "incomes.csv")}
                //             >
                //               Export CSV
                //             </Button>
                //           </div>
                //         </div>

                //         <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                //           <Button
                //             variant="outline"
                //             size="sm"
                //             onClick={() => setPage((p) => Math.max(1, p - 1))}
                //             disabled={safePage <= 1}
                //           >
                //             <ChevronLeft className="h-4 w-4" />
                //           </Button>

                //           <span className="tabular-nums">
                //             Page {safePage} / {totalPages}
                //           </span>

                //           <Button
                //             variant="outline"
                //             size="sm"
                //             onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                //             disabled={safePage >= totalPages}
                //           >
                //             <ChevronRight className="h-4 w-4" />
                //           </Button>

                //           <span className="tabular-nums">
                //             Showing {fromIdx}–{toIdx} of {totalRows}
                //           </span>

                //           <span className="tabular-nums">
                //             Total: ¥{totalAmount.toLocaleString()}
                //           </span>
                //         </div>
                //       </div>

                //       <div className="max-h-[520px] overflow-auto">
                //         <Table>
                //           <TableHeader className="sticky top-0 z-10 bg-background">
                //             <TableRow className="bg-background">
                //               <TableHead className="whitespace-nowrap">Date</TableHead>
                //               <TableHead className="whitespace-nowrap">Company</TableHead>
                //               <TableHead className="whitespace-nowrap">Month</TableHead>
                //               <TableHead className="whitespace-nowrap text-right">
                //                 Amount
                //               </TableHead>
                //               <TableHead className="whitespace-nowrap">Notice</TableHead>
                //             </TableRow>
                //           </TableHeader>

                //           <TableBody>
                //             {pagedRows.length === 0 ? (
                //               <TableRow>
                //                 <TableCell
                //                   colSpan={5}
                //                   className="py-10 text-center text-sm text-muted-foreground"
                //                 >
                //                   No data
                //                 </TableCell>
                //               </TableRow>
                //             ) : (
                //               pagedRows.map((r: any, idx: number) => {
                //                 const date = toISODate(r?.date) || toISODate(r?.createdAt);
                //                 const company = cellText(r?.company ?? r?.compamy);
                //                 const month = cellText(r?.month);
                //                 const amountNum = toNumber(r?.amount);
                //                 const notice = cellText(r?.notice);

                //                 const amountCls =
                //                   amountNum === null
                //                     ? "text-muted-foreground"
                //                     : amountNum > 0
                //                     ? "text-emerald-600 dark:text-emerald-400"
                //                     : amountNum < 0
                //                     ? "text-red-600 dark:text-red-400"
                //                     : "text-muted-foreground";

                //                 return (
                //                   <TableRow
                //                     key={r?._id?.$oid ?? r?._id ?? `${safePage}-${idx}`}
                //                     className={[
                //                       "hover:bg-muted/30",
                //                       idx % 2 === 0 ? "bg-background" : "bg-muted/10",
                //                     ].join(" ")}
                //                   >
                //                     <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                //                       {date || "—"}
                //                     </TableCell>

                //                     <TableCell className="max-w-[260px]">
                //                       <span className="inline-flex items-center rounded-full border bg-background px-2 py-1 text-xs">
                //                         {company}
                //                       </span>
                //                     </TableCell>

                //                     <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                //                       {month}
                //                     </TableCell>

                //                     <TableCell
                //                       className={[
                //                         "whitespace-nowrap text-right font-semibold tabular-nums",
                //                         amountCls,
                //                       ].join(" ")}
                //                     >
                //                       {yen(r?.amount)}
                //                     </TableCell>

                //                     <TableCell className="max-w-[360px] text-sm text-muted-foreground">
                //                       {notice}
                //                     </TableCell>
                //                   </TableRow>
                //                 );
                //               })
                //             )}
                //           </TableBody>
                //         </Table>
                //       </div>
                //     </div>
                //   );
                // }

                // // chart UI
                // function ChartCard({
                //   title,
                //   children,
                // }: {
                //   title: string;
                //   children: React.ReactNode;
                // }) {
                //   return (
                //     <div className="mt-3 overflow-hidden rounded-3xl border bg-background shadow-sm">
                //       <div className="border-b bg-muted/30 px-4 py-3">
                //         <div className="text-sm font-semibold">{title}</div>
                //         <div className="mt-1 text-xs text-muted-foreground">
                //           Trend / Breakdown ကိုပြထားပါတယ် ✅
                //         </div>
                //       </div>
                //       <div className="p-4">{children}</div>
                //     </div>
                //   );
                // }

                // // function OutcomeChartsCard({
                // //   series,
                // // }: {
                // //   series: {
                // //     trend?: { x: string; y: number }[];
                // //     byShop?: { name: string; value: number }[];
                // //     byCategory?: { name: string; value: number }[];
                // //     byBank?: { name: string; value: number }[];
                // //   };
                // // }) {
                // //   const trend = Array.isArray(series?.trend) ? series.trend : [];
                // //   const byShop = Array.isArray(series?.byShop) ? series.byShop : [];
                // //   const byCategory = Array.isArray(series?.byCategory) ? series.byCategory : [];
                // //   const byBank = Array.isArray(series?.byBank) ? series.byBank : [];

                // //   const totalTrend = trend.reduce((s, p) => s + (Number(p?.y) || 0), 0);

                // //   return (
                // //     <div className="space-y-3">
                // //       <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                // //         <span className="rounded-full border bg-background px-2 py-1">
                // //           Points: <span className="tabular-nums">{trend.length}</span>
                // //         </span>
                // //         <span className="rounded-full border bg-background px-2 py-1">
                // //           Total(trend):{" "}
                // //           <span className="tabular-nums">¥{totalTrend.toLocaleString()}</span>
                // //         </span>
                // //       </div>

                // //       <div className="rounded-3xl border bg-background p-3">
                // //         <div className="mb-2 text-xs font-semibold text-muted-foreground">
                // //           Trend (Day/Month)
                // //         </div>

                // //         <div className="h-[420px]">
                // //           <ResponsiveContainer width="100%" height="100%">
                // //             <LineChart data={trend}>
                // //               <CartesianGrid strokeDasharray="3 3" />
                // //               <XAxis dataKey="x" hide />
                // //               <YAxis />
                // //               <Tooltip />
                // //               <Line type="monotone" dataKey="y" dot={false} />
                // //             </LineChart>
                // //           </ResponsiveContainer>
                // //         </div>
                // //       </div>

                // //       <div className="grid gap-3 lg:grid-cols-3">
                // //         <div className="rounded-3xl border bg-background p-3">
                // //           <div className="mb-2 text-xs font-semibold text-muted-foreground">
                // //             Top Shops
                // //           </div>
                // //           <div className="h-[320px]">
                // //             <ResponsiveContainer width="100%" height="100%">
                // //               <BarChart data={byShop}>
                // //                 <defs>
                // //                   <linearGradient id="shopGradient" x1="0" y1="0" x2="0" y2="1">
                // //                     <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9} />
                // //                     <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.9} />
                // //                   </linearGradient>
                // //                 </defs>
                // //                 <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                // //                 <XAxis dataKey="name" hide />
                // //                 <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                // //                 <Tooltip
                // //                   cursor={{ fill: "rgba(0,0,0,0.05)" }}
                // //                   contentStyle={{
                // //                     borderRadius: "12px",
                // //                     border: "1px solid #e5e7eb",
                // //                     background: "#fff",
                // //                   }}
                // //                 />
                // //                 <Bar
                // //                   dataKey="value"
                // //                   radius={[10, 10, 0, 0]}
                // //                   fill="url(#shopGradient)"
                // //                 />
                // //               </BarChart>
                // //             </ResponsiveContainer>
                // //           </div>
                // //         </div>

                // //         <div className="rounded-3xl border bg-background p-3">
                // //           <div className="mb-2 text-xs font-semibold text-muted-foreground">
                // //             Top Categories
                // //           </div>
                // //           <div className="h-[320px]">
                // //             <ResponsiveContainer width="100%" height="100%">
                // //               <BarChart data={byCategory}>
                // //                 <defs>
                // //                   <linearGradient
                // //                     id="categoryGradient"
                // //                     x1="0"
                // //                     y1="0"
                // //                     x2="0"
                // //                     y2="1"
                // //                   >
                // //                     <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                // //                     <stop offset="95%" stopColor="#ef4444" stopOpacity={0.9} />
                // //                   </linearGradient>
                // //                 </defs>
                // //                 <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                // //                 <XAxis dataKey="name" hide />
                // //                 <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                // //                 <Tooltip
                // //                   cursor={{ fill: "rgba(0,0,0,0.05)" }}
                // //                   contentStyle={{
                // //                     borderRadius: "12px",
                // //                     border: "1px solid #e5e7eb",
                // //                     background: "#fff",
                // //                   }}
                // //                 />
                // //                 <Bar
                // //                   dataKey="value"
                // //                   radius={[10, 10, 0, 0]}
                // //                   fill="url(#categoryGradient)"
                // //                 />
                // //               </BarChart>
                // //             </ResponsiveContainer>
                // //           </div>
                // //         </div>

                // //         <div className="rounded-3xl border bg-background p-3">
                // //           <div className="mb-2 text-xs font-semibold text-muted-foreground">
                // //             Bank Breakdown
                // //           </div>
                // //           <div className="h-[320px]">
                // //             <ResponsiveContainer width="100%" height="100%">
                // //               <BarChart data={byBank}>
                // //                 <defs>
                // //                   <linearGradient id="bankGradient" x1="0" y1="0" x2="0" y2="1">
                // //                     <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9} />
                // //                     <stop offset="95%" stopColor="#6366f1" stopOpacity={0.9} />
                // //                   </linearGradient>
                // //                 </defs>
                // //                 <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                // //                 <XAxis dataKey="name" hide />
                // //                 <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                // //                 <Tooltip
                // //                   cursor={{ fill: "rgba(0,0,0,0.05)" }}
                // //                   contentStyle={{
                // //                     borderRadius: "12px",
                // //                     border: "1px solid #e5e7eb",
                // //                     background: "#fff",
                // //                   }}
                // //                 />
                // //                 <Bar
                // //                   dataKey="value"
                // //                   radius={[10, 10, 0, 0]}
                // //                   fill="url(#bankGradient)"
                // //                 />
                // //               </BarChart>
                // //             </ResponsiveContainer>
                // //           </div>
                // //         </div>
                // //       </div>
                // //     </div>
                // //   );
                // // }

                // function IncomeChartsCard({
                //   series,
                // }: {
                //   series: {
                //     trend?: { x: string; y: number }[];
                //     byCompany?: { name: string; value: number }[];
                //   };
                // }) {
                //   const trend = Array.isArray(series?.trend) ? series.trend : [];
                //   const byCompany = Array.isArray(series?.byCompany) ? series.byCompany : [];
                //   const totalTrend = trend.reduce((s, p) => s + (Number(p?.y) || 0), 0);

                //   return (
                //     <div className="space-y-3">
                //       <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                //         <span className="rounded-full border bg-background px-2 py-1">
                //           Points: <span className="tabular-nums">{trend.length}</span>
                //         </span>
                //         <span className="rounded-full border bg-background px-2 py-1">
                //           Total(trend):{" "}
                //           <span className="tabular-nums">¥{totalTrend.toLocaleString()}</span>
                //         </span>
                //       </div>

                //       <div className="rounded-3xl border bg-background p-3">
                //         <div className="mb-2 text-xs font-semibold text-muted-foreground">
                //           Trend (Day/Month)
                //         </div>

                //         <div className="h-[420px]">
                //           <ResponsiveContainer width="100%" height="100%">
                //             <LineChart data={trend}>
                //               <CartesianGrid strokeDasharray="3 3" />
                //               <XAxis dataKey="x" hide />
                //               <YAxis />
                //               <Tooltip />
                //               <Line type="monotone" dataKey="y" dot={false} />
                //             </LineChart>
                //           </ResponsiveContainer>
                //         </div>
                //       </div>

                //       <div className="rounded-3xl border bg-background p-3">
                //         <div className="mb-2 text-xs font-semibold text-muted-foreground">
                //           Top Companies
                //         </div>
                //         <div className="h-[320px]">
                //           <ResponsiveContainer width="100%" height="100%">
                //             <BarChart data={byCompany}>
                //               <defs>
                //                 <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                //                   <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9} />
                //                   <stop offset="95%" stopColor="#22c55e" stopOpacity={0.9} />
                //                 </linearGradient>
                //               </defs>
                //               <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                //               <XAxis dataKey="name" hide />
                //               <YAxis />
                //               <Tooltip
                //                 cursor={{ fill: "rgba(0,0,0,0.05)" }}
                //                 contentStyle={{
                //                   borderRadius: "12px",
                //                   border: "1px solid #e5e7eb",
                //                   background: "#fff",
                //                 }}
                //               />
                //               <Bar
                //                 dataKey="value"
                //                 radius={[10, 10, 0, 0]}
                //                 fill="url(#colorBar)"
                //               />
                //             </BarChart>
                //           </ResponsiveContainer>
                //         </div>
                //       </div>
                //     </div>
                //   );
                // }

                // // report UI
                // function MiniKVTable({
                //   title,
                //   rows,
                // }: {
                //   title: string;
                //   rows: { k: string; v: any }[];
                // }) {
                //   return (
                //     <div className="overflow-hidden rounded-3xl border bg-background">
                //       <div className="border-b bg-muted/30 px-4 py-2 text-sm font-semibold">
                //         {title}
                //       </div>
                //       <div className="p-3">
                //         <div className="grid gap-2 sm:grid-cols-2">
                //           {rows.map((r, i) => (
                //             <div
                //               key={r.k + i}
                //               className="flex items-center justify-between rounded-2xl border bg-background px-3 py-2"
                //             >
                //               <div className="text-xs text-muted-foreground">{r.k}</div>
                //               <div className="text-sm font-semibold tabular-nums">
                //                 {String(r.v ?? "—")}
                //               </div>
                //             </div>
                //           ))}
                //         </div>
                //       </div>
                //     </div>
                //   );
                // }

                // function ReportCard({ report, title }: { report: any; title?: string }) {
                //   const stats = report?.stats ?? {};
                //   const steps: string[] = Array.isArray(report?.next_steps)
                //     ? report.next_steps
                //     : [];
                //   const summary = String(report?.summary ?? "Report");

                //   return (
                //     <div className="mt-3 overflow-hidden rounded-3xl border bg-background shadow-sm">
                //       <div className="border-b bg-muted/30 px-4 py-3">
                //         <div className="text-sm font-semibold">{title ?? "Report"}</div>
                //         <div className="mt-1 text-xs text-muted-foreground">{summary}</div>
                //       </div>

                //       <div className="grid gap-3 p-3 lg:grid-cols-2">
                //         <MiniKVTable
                //           title="Stats"
                //           rows={[
                //             { k: "Count", v: stats?.count ?? "—" },
                //             {
                //               k: "Total",
                //               v: `¥${Number(stats?.total_amount ?? 0).toLocaleString()}`,
                //             },
                //             {
                //               k: "Avg",
                //               v: `¥${Number(stats?.avg_amount ?? 0).toLocaleString()}`,
                //             },
                //           ]}
                //         />

                //         <div className="overflow-hidden rounded-3xl border bg-background">
                //           <div className="border-b bg-muted/30 px-4 py-2 text-sm font-semibold">
                //             Next steps
                //           </div>
                //           <div className="p-3">
                //             {steps.length === 0 ? (
                //               <div className="text-sm text-muted-foreground">No steps</div>
                //             ) : (
                //               <ul className="space-y-2">
                //                 {steps.slice(0, 12).map((s, i) => (
                //                   <li key={i} className="flex gap-2 text-sm">
                //                     <span className="mt-[2px] inline-block h-5 w-5 shrink-0 rounded-full border bg-background text-center text-xs leading-5 text-muted-foreground">
                //                       {i + 1}
                //                     </span>
                //                     <span className="text-muted-foreground">{s}</span>
                //                   </li>
                //                 ))}
                //               </ul>
                //             )}
                //           </div>
                //         </div>
                //       </div>
                //     </div>
                //   );
                // }

                // // image UI
                // function downloadDataUrl(dataUrl: string, filename = "image.png") {
                //   const a = document.createElement("a");
                //   a.href = dataUrl;
                //   a.download = filename;
                //   document.body.appendChild(a);
                //   a.click();
                //   a.remove();
                // }

                // function ImageCard({
                //   title,
                //   src,
                //   kind,
                //   poster,
                // }: {
                //   title?: string;
                //   src: string;
                //   kind?: Mode | "mixed";
                //   poster?: PosterMeta | null;
                // }) {
                //   const safeName = (
                //     title ||
                //     poster?.title ||
                //     (kind === "income" ? "income" : kind === "outcome" ? "outcome" : "image")
                //   )
                //     .replace(/[^\w\-]+/g, "_")
                //     .slice(0, 40);

                //   const isPoster = !!poster;
                //   const styleText = poster?.style ?? poster?.theme ?? null;
                //   const posterBullets = Array.isArray(poster?.bullets) ? poster!.bullets! : [];

                //   return (
                //     <div className="mt-3 overflow-hidden rounded-3xl border bg-background shadow-sm">
                //       <div className="flex flex-col gap-2 border-b bg-muted/30 px-4 py-3">
                //         <div className="flex flex-wrap items-center justify-between gap-2">
                //           <div className="min-w-0">
                //             <div className="flex flex-wrap items-center gap-2">
                //               <div className="truncate text-sm font-semibold">
                //                 {title ??
                //                   poster?.title ??
                //                   (kind === "income"
                //                     ? "Income Image"
                //                     : kind === "outcome"
                //                     ? "Outcome Image"
                //                     : "Image")}
                //               </div>

                //               {isPoster ? (
                //                 <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                //                   Poster
                //                 </span>
                //               ) : null}

                //               {styleText ? (
                //                 <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                //                   {styleText}
                //                 </span>
                //               ) : null}

                //               {poster?.size ? (
                //                 <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                //                   {poster.size}
                //                 </span>
                //               ) : null}
                //             </div>

                //             {poster?.subtitle ? (
                //               <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                //                 {poster.subtitle}
                //               </div>
                //             ) : null}
                //           </div>

                //           <div className="flex items-center gap-2">
                //             <Button
                //               variant="outline"
                //               size="sm"
                //               onClick={() => downloadDataUrl(src, `${safeName}.png`)}
                //             >
                //               Download PNG
                //             </Button>
                //             <Button
                //               variant="outline"
                //               size="sm"
                //               onClick={() => window.open(src, "_blank")}
                //             >
                //               Open
                //             </Button>
                //           </div>
                //         </div>

                //         {isPoster && posterBullets.length > 0 ? (
                //           <div className="flex flex-wrap gap-2">
                //             {posterBullets.slice(0, 4).map((b, i) => (
                //               <span
                //                 key={`${b}-${i}`}
                //                 className="rounded-full border bg-background px-2 py-1 text-[11px] text-muted-foreground"
                //               >
                //                 {b}
                //               </span>
                //             ))}
                //           </div>
                //         ) : null}
                //       </div>

                //       <div className="p-3">
                //         <img
                //           src={src}
                //           alt={title ?? poster?.title ?? "image"}
                //           className="w-full rounded-2xl border"
                //         />
                //       </div>
                //     </div>
                //   );
                // }

                // // main page
                // export default function ChatPage() {
                //   const [messages, setMessages] = useState<Msg[]>([]);
                //   const [text, setText] = useState("");
                //   const [loading, setLoading] = useState(false);

                //   const bottomRef = useRef<HTMLDivElement | null>(null);

                //   const textTimer = useRef<number | null>(null);
                //   const lineTimer = useRef<number | null>(null);
                //   const fullLinesRef = useRef<Record<string, string[]>>({});

                //   const [confirmOpen, setConfirmOpen] = useState(false);
                //   const [confirmLoading, setConfirmLoading] = useState(false);
                //   const [draftAI, setDraftAI] = useState<any>(null);
                //   const [draftKind, setDraftKind] = useState<Mode>("outcome");

                //   const [confirmBank, setConfirmBank] = useState<string>("");
                //   const [confirmDate, setConfirmDate] = useState<string>("");
                //   const [confirmCompany, setConfirmCompany] = useState<string>("");
                //   const [confirmMonth, setConfirmMonth] = useState<string>("");

                //   useEffect(() => {
                //     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                //   }, [messages, loading]);

                //   useEffect(() => {
                //     return () => {
                //       if (textTimer.current) window.clearInterval(textTimer.current);
                //       if (lineTimer.current) window.clearInterval(lineTimer.current);
                //     };
                //   }, []);

                //   async function parseJsonSafe(res: Response) {
                //     const raw = await res.text().catch(() => "");
                //     try {
                //       return raw ? JSON.parse(raw) : {};
                //     } catch {
                //       return { raw };
                //     }
                //   }

                //   async function smartParseOutcome(input: string): Promise<AIResult> {
                //     const r = await fetch("/api/ai/parse-outcome", {
                //       method: "POST",
                //       headers: { "Content-Type": "application/json" },
                //       body: JSON.stringify({ text: input }),
                //     });

                //     const parsed = await parseJsonSafe(r);

                //     if (!r.ok) {
                //       const msg =
                //         parsed?.error ??
                //         parsed?.message ??
                //         parsed?.detail ??
                //         parsed?.raw ??
                //         "parse-outcome failed";
                //       throw new Error(`AI error (${r.status}): ${String(msg).slice(0, 300)}`);
                //     }

                //     return parsed;
                //   }

                //   async function smartParseIncome(input: string): Promise<AIResult> {
                //     const r = await fetch("/api/ai/parse-income", {
                //       method: "POST",
                //       headers: { "Content-Type": "application/json" },
                //       body: JSON.stringify({ text: input }),
                //     });

                //     const parsed = await parseJsonSafe(r);

                //     if (!r.ok) {
                //       const msg =
                //         parsed?.error ??
                //         parsed?.message ??
                //         parsed?.detail ??
                //         parsed?.raw ??
                //         "parse-income failed";
                //       throw new Error(`AI error (${r.status}): ${String(msg).slice(0, 300)}`);
                //     }

                //     return parsed;
                //   }

                //   async function getNextSteps(): Promise<AIResult> {
                //     const r = await fetch("/api/ai/next-steps", { method: "GET" });
                //     const parsed = await parseJsonSafe(r);

                //     if (!r.ok) {
                //       const msg =
                //         parsed?.error ??
                //         parsed?.message ??
                //         parsed?.detail ??
                //         parsed?.raw ??
                //         "next-steps failed";
                //       throw new Error(`AI error (${r.status}): ${String(msg).slice(0, 300)}`);
                //     }

                //     return parsed;
                //   }

                //   async function smartParseAny(
                //     input: string
                //   ): Promise<{ ai: any; kind: Mode | "mixed" }> {
                //     const raw = (input || "").trim();

                //     const isNextStepsCmd =
                //       /(^|\s)(next steps|insight|report|analysis|summary|အကြံပြု|ဘာတွေလုပ်ရမလဲ)(\s|$)/i.test(
                //         raw
                //       );

                //     if (isNextStepsCmd) {
                //       const ai = await getNextSteps();
                //       return { ai, kind: "outcome" };
                //     }

                //     const guess = detectKindByText(raw);

                //     if (guess === "income") {
                //       try {
                //         const ai = await smartParseIncome(raw);
                //         const kind = detectKindByIntent(ai);
                //         return { ai, kind: kind === "mixed" ? "income" : kind };
                //       } catch (e) {
                //         if (!isBadRequestLike(e)) throw e;
                //         const ai = await smartParseOutcome(raw);
                //         const kind = detectKindByIntent(ai);
                //         return { ai, kind: kind === "mixed" ? "outcome" : kind };
                //       }
                //     }

                //     if (guess === "outcome") {
                //       try {
                //         const ai = await smartParseOutcome(raw);
                //         const kind = detectKindByIntent(ai);
                //         return { ai, kind: kind === "mixed" ? "outcome" : kind };
                //       } catch (e) {
                //         if (!isBadRequestLike(e)) throw e;
                //         const ai = await smartParseIncome(raw);
                //         const kind = detectKindByIntent(ai);
                //         return { ai, kind: kind === "mixed" ? "income" : kind };
                //       }
                //     }

                //     try {
                //       const ai1 = await smartParseOutcome(raw);
                //       const kind1 = detectKindByIntent(ai1);

                //       if (isRecognized(ai1)) {
                //         return { ai: ai1, kind: kind1 === "mixed" ? "outcome" : kind1 };
                //       }

                //       const ai2 = await smartParseIncome(raw);
                //       const kind2 = detectKindByIntent(ai2);

                //       if (isRecognized(ai2)) {
                //         return { ai: ai2, kind: kind2 === "mixed" ? "income" : kind2 };
                //       }

                //       return { ai: ai1, kind: "mixed" };
                //     } catch (e1) {
                //       try {
                //         const ai2 = await smartParseIncome(raw);
                //         const kind2 = detectKindByIntent(ai2);
                //         return { ai: ai2, kind: kind2 === "mixed" ? "income" : kind2 };
                //       } catch (e2) {
                //         throw e2;
                //       }
                //     }
                //   }

                //   async function saveOutcome(
                //     ai: any,
                //     override?: { bank?: string; dateISO?: string }
                //   ) {
                //     const p = getPayload(ai);

                //     const bank = override?.bank ?? p.bank ?? ai?.bank ?? "—";
                //     const dateISO =
                //       override?.dateISO ?? p.date ?? ai?.date ?? new Date().toISOString();

                //     const r = await fetch("/api/outcome", {
                //       method: "POST",
                //       headers: { "Content-Type": "application/json" },
                //       body: JSON.stringify({
                //         amount: p.amount ?? ai?.amount ?? "",
                //         shop: p.shop ?? ai?.shop ?? "",
                //         bank,
                //         notice: `${p.notice ?? ai?.notice ?? ""}`.trim(),
                //         date: dateISO,
                //       }),
                //     });

                //     if (!r.ok) {
                //       const parsed = await parseJsonSafe(r);
                //       const msg =
                //         parsed?.error ??
                //         parsed?.message ??
                //         parsed?.detail ??
                //         parsed?.raw ??
                //         "Save failed";
                //       throw new Error(
                //         `Save failed (${r.status}): ${String(msg).slice(0, 200)}`
                //       );
                //     }
                //   }

                //   async function saveIncome(
                //     ai: any,
                //     override?: { company?: string; month?: string; dateISO?: string }
                //   ) {
                //     const p = getPayload(ai);

                //     const dateISO =
                //       override?.dateISO ?? p.date ?? ai?.date ?? new Date().toISOString();

                //     const date = new Date(dateISO);
                //     const y = date.getUTCFullYear();
                //     const m = String(date.getUTCMonth() + 1).padStart(2, "0");
                //     const monthAuto = `${y}-${m}`;

                //     const company =
                //       override?.company ??
                //       p.company ??
                //       p.compamy ??
                //       ai?.company ??
                //       ai?.compamy ??
                //       "—";

                //     const month = override?.month ?? p.month ?? ai?.month ?? monthAuto;

                //     const r = await fetch("/api/incomes", {
                //       method: "POST",
                //       headers: { "Content-Type": "application/json" },
                //       body: JSON.stringify({
                //         amount: p.amount ?? ai?.amount ?? "",
                //         month,
                //         compamy: company,
                //         notice: p.notice ?? ai?.notice ?? "",
                //         date: dateISO,
                //       }),
                //     });

                //     if (!r.ok) {
                //       const parsed = await parseJsonSafe(r);
                //       const msg =
                //         parsed?.error ??
                //         parsed?.message ??
                //         parsed?.detail ??
                //         parsed?.raw ??
                //         "Save failed";
                //       throw new Error(
                //         `Save failed (${r.status}): ${String(msg).slice(0, 200)}`
                //       );
                //     }
                //   }

                //   function streamAIText(fullText: string) {
                //     const aiId = uid();
                //     setMessages((p) => [
                //       ...p,
                //       { id: aiId, role: "ai", text: "", streaming: true },
                //     ]);

                //     let i = 0;
                //     const speedMs = 12;

                //     if (textTimer.current) window.clearInterval(textTimer.current);
                //     if (lineTimer.current) window.clearInterval(lineTimer.current);

                //     textTimer.current = window.setInterval(() => {
                //       i += 1;
                //       setMessages((prev) =>
                //         prev.map((m) =>
                //           m.id === aiId
                //             ? {
                //                 ...m,
                //                 text: fullText.slice(0, i),
                //                 streaming: i < fullText.length,
                //               }
                //             : m
                //         )
                //       );

                //       if (i >= fullText.length) {
                //         if (textTimer.current) window.clearInterval(textTimer.current);
                //         textTimer.current = null;
                //       }
                //     }, speedMs);
                //   }

                //   function draftLines(
                //     fullLines: string[],
                //     extra?: Partial<Msg>,
                //     afterDone?: () => void
                //   ) {
                //     const aiId = uid();
                //     fullLinesRef.current[aiId] = fullLines;

                //     setMessages((p) => [
                //       ...p,
                //       {
                //         id: aiId,
                //         role: "ai",
                //         text: "",
                //         lines: [""],
                //         streaming: true,
                //         done: false,
                //         ...extra,
                //       },
                //     ]);

                //     let lineIdx = 0;
                //     let charIdx = 0;
                //     const speedMs = 14;

                //     if (textTimer.current) window.clearInterval(textTimer.current);
                //     if (lineTimer.current) window.clearInterval(lineTimer.current);

                //     lineTimer.current = window.setInterval(() => {
                //       const all = fullLinesRef.current[aiId] ?? [];
                //       if (!all.length) return;

                //       const currentFull = String(all[lineIdx] ?? "");

                //       setMessages((prev) =>
                //         prev.map((m) => {
                //           if (m.id !== aiId) return m;

                //           const curLines = Array.isArray(m.lines) ? [...m.lines] : [""];
                //           while (curLines.length < lineIdx + 1) curLines.push("");

                //           const nextChar = currentFull.charAt(charIdx);
                //           curLines[lineIdx] = (curLines[lineIdx] ?? "") + nextChar;

                //           return { ...m, lines: curLines, streaming: true };
                //         })
                //       );

                //       charIdx += 1;

                //       if (charIdx >= currentFull.length) {
                //         lineIdx += 1;
                //         charIdx = 0;

                //         setMessages((prev) =>
                //           prev.map((m) => {
                //             if (m.id !== aiId) return m;
                //             const curLines = Array.isArray(m.lines) ? [...m.lines] : [];
                //             if (lineIdx < all.length) curLines.push("");
                //             return { ...m, lines: curLines, streaming: lineIdx < all.length };
                //           })
                //         );

                //         if (lineIdx >= all.length) {
                //           if (lineTimer.current) window.clearInterval(lineTimer.current);
                //           lineTimer.current = null;

                //           setMessages((prev) =>
                //             prev.map((m) =>
                //               m.id === aiId ? { ...m, streaming: false, done: true } : m
                //             )
                //           );

                //           delete fullLinesRef.current[aiId];

                //           window.setTimeout(() => {
                //             setMessages((prev) =>
                //               prev.map((m) => (m.id === aiId ? { ...m, done: false } : m))
                //             );
                //           }, 1200);

                //           afterDone?.();
                //         }
                //       }
                //     }, speedMs);
                //   }

                //   function addTableOnlyMessage(
                //     kind: Mode,
                //     items: any[],
                //     lines?: string[],
                //     cards?: AICard[],
                //     actions?: AIAction[],
                //     title?: string
                //   ) {
                //     setMessages((p) => [
                //       ...p,
                //       {
                //         id: uid(),
                //         role: "ai",
                //         text: `${kind === "income" ? "Income" : "Outcome"} ${
                //           items.length
                //         } records`,
                //         lines,
                //         cards,
                //         actions,
                //         table: { title: title ?? `Total ${items.length}`, rows: items, kind },
                //       },
                //     ]);
                //   }

                //   function addReportMessage(kind: Mode | "mixed", ai: any) {
                //     const payload = getPayload(ai);
                //     const report = payload?.report ?? ai?.report ?? null;
                //     const lines = pickLines(ai);
                //     const cards = pickCards(ai);
                //     const actions = pickActions(ai);

                //     if (lines.length > 0) {
                //       draftLines(
                //         lines,
                //         { cards, actions },
                //         () => {
                //           setMessages((p) => [
                //             ...p,
                //             { id: uid(), role: "ai", text: "", report, reportKind: kind },
                //           ]);
                //         }
                //       );
                //       return;
                //     }

                //     setMessages((p) => [
                //       ...p,
                //       {
                //         id: uid(),
                //         role: "ai",
                //         text: pickAnswerText(ai),
                //         cards,
                //         actions,
                //         report,
                //         reportKind: kind,
                //       },
                //     ]);
                //   }

                //   function addChartMessage(kind: Mode, ai: any) {
                //     const lines = pickLines(ai);
                //     const cards = pickCards(ai);
                //     const actions = pickActions(ai);
                //     const { series, filters } = pickChartSeries(ai);

                //     setMessages((p) => [
                //       ...p,
                //       {
                //         id: uid(),
                //         role: "ai",
                //         text: pickAnswerText(ai),
                //         lines: lines.length ? lines : undefined,
                //         cards,
                //         actions,
                //         chart: { series, filters, kind },
                //       },
                //     ]);
                //   }

                //   function addImageMessage(kind: Mode | "mixed", ai: any) {
                //     const lines = pickLines(ai);
                //     const cards = pickCards(ai);
                //     const actions = pickActions(ai);
                //     const img = pickImage(ai);
                //     const poster = pickPoster(ai);

                //     setMessages((p) => [
                //       ...p,
                //       {
                //         id: uid(),
                //         role: "ai",
                //         text: pickAnswerText(ai),
                //         lines: lines.length ? lines : undefined,
                //         cards,
                //         actions,
                //         image: img ? { ...img, kind, poster } : undefined,
                //       },
                //     ]);
                //   }

                //   function openConfirmForOutcome(ai: any) {
                //     const p = getPayload(ai);

                //     const missing: string[] = Array.isArray(p?.missing_fields)
                //       ? p.missing_fields
                //       : Array.isArray(ai?.missing_fields)
                //       ? ai.missing_fields
                //       : [];

                //     const suggestions: string[] = Array.isArray(p?.bank_suggestions)
                //       ? p.bank_suggestions
                //       : Array.isArray(ai?.bank_suggestions)
                //       ? ai.bank_suggestions
                //       : [];

                //     const suggestedDateISO = String(
                //       p?.suggested_date ?? ai?.suggested_date ?? new Date().toISOString()
                //     );

                //     const currentBank = String(p?.bank ?? ai?.bank ?? "").trim();

                //     const d = new Date(suggestedDateISO);
                //     const yyyy = d.getFullYear();
                //     const mm = String(d.getMonth() + 1).padStart(2, "0");
                //     const dd = String(d.getDate()).padStart(2, "0");
                //     const ymd = `${yyyy}-${mm}-${dd}`;

                //     setDraftAI(ai);
                //     setDraftKind("outcome");

                //     if (currentBank) setConfirmBank(currentBank);
                //     else if (suggestions.length) setConfirmBank(String(suggestions[0]));
                //     else setConfirmBank("Cash");

                //     setConfirmDate(ymd);

                //     const needsConfirm = Boolean(
                //       p?.needs_confirm ?? ai?.needs_confirm ?? false
                //     );
                //     if (needsConfirm || missing.includes("bank") || missing.includes("date")) {
                //       setConfirmOpen(true);
                //     } else {
                //       saveOutcome(ai).catch(console.error);
                //     }
                //   }

                //   function openConfirmForIncome(ai: any) {
                //     const p = getPayload(ai);

                //     const missing: string[] = Array.isArray(p?.missing_fields)
                //       ? p.missing_fields
                //       : Array.isArray(ai?.missing_fields)
                //       ? ai.missing_fields
                //       : [];

                //     const suggestedDateISO = String(
                //       p?.suggested_date ?? ai?.suggested_date ?? new Date().toISOString()
                //     );

                //     const d = new Date(suggestedDateISO);
                //     const yyyy = d.getFullYear();
                //     const mm = String(d.getMonth() + 1).padStart(2, "0");
                //     const dd = String(d.getDate()).padStart(2, "0");
                //     const ymd = `${yyyy}-${mm}-${dd}`;
                //     const ym = `${yyyy}-${mm}`;

                //     const currentCompany = String(
                //       p?.company ?? p?.compamy ?? ai?.company ?? ai?.compamy ?? ""
                //     ).trim();

                //     const currentMonth = String(p?.month ?? ai?.month ?? "").trim();

                //     setDraftAI(ai);
                //     setDraftKind("income");

                //     setConfirmDate(ymd);
                //     setConfirmMonth(currentMonth || ym);
                //     setConfirmCompany(currentCompany || "Salary");

                //     const needsConfirm = Boolean(
                //       p?.needs_confirm ?? ai?.needs_confirm ?? false
                //     );
                //     if (
                //       needsConfirm ||
                //       missing.includes("company") ||
                //       missing.includes("month") ||
                //       missing.includes("date")
                //     ) {
                //       setConfirmOpen(true);
                //     } else {
                //       saveIncome(ai).catch(console.error);
                //     }
                //   }

                //   async function onConfirmSave() {
                //     if (!draftAI) {
                //       setConfirmOpen(false);
                //       return;
                //     }

                //     try {
                //       setConfirmLoading(true);

                //       const dateISO = confirmDate
                //         ? new Date(`${confirmDate}T00:00:00.000Z`).toISOString()
                //         : new Date().toISOString();

                //       if (draftKind === "outcome") {
                //         await saveOutcome(draftAI, { bank: confirmBank || "—", dateISO });

                //         setMessages((p) => [
                //           ...p,
                //           {
                //             id: uid(),
                //             role: "ai",
                //             text: "",
                //             lines: [
                //               "✅ Saved (Outcome)",
                //               `Bank: \`${confirmBank || "—"}\``,
                //               `Date: \`${confirmDate || "—"}\``,
                //             ],
                //             streaming: false,
                //             done: true,
                //           },
                //         ]);
                //       } else {
                //         await saveIncome(draftAI, {
                //           company: confirmCompany || "—",
                //           month: confirmMonth || "",
                //           dateISO,
                //         });

                //         setMessages((p) => [
                //           ...p,
                //           {
                //             id: uid(),
                //             role: "ai",
                //             text: "",
                //             lines: [
                //               "✅ Saved (Income)",
                //               `Company: \`${confirmCompany || "—"}\``,
                //               `Month: \`${confirmMonth || "—"}\``,
                //               `Date: \`${confirmDate || "—"}\``,
                //             ],
                //             streaming: false,
                //             done: true,
                //           },
                //         ]);
                //       }

                //       setConfirmOpen(false);
                //       setDraftAI(null);
                //     } catch (e: any) {
                //       console.error(e);
                //       streamAIText(`❌ ${e?.message ?? "Save failed"}`);
                //     } finally {
                //       setConfirmLoading(false);
                //     }
                //   }

                //   const bankSuggestions = useMemo(() => {
                //     const p = draftAI ? getPayload(draftAI) : null;
                //     const list: string[] = Array.isArray(p?.bank_suggestions)
                //       ? p.bank_suggestions
                //       : Array.isArray(draftAI?.bank_suggestions)
                //       ? draftAI.bank_suggestions
                //       : [];
                //     return list.length
                //       ? list
                //       : [
                //           "Cash",
                //           "PayPay",
                //           "LINE Pay",
                //           "Suica",
                //           "JCB 7/11",
                //           "Visa UFL",
                //           "VISA SMBC",
                //         ];
                //   }, [draftAI]);

                //   async function sendWithValue(raw: string) {
                //     const t = raw.trim();
                //     if (!t || loading) return;

                //     setMessages((p) => [...p, { id: uid(), role: "user", text: t }]);
                //     setText("");
                //     setLoading(true);

                //     try {
                //       const { ai, kind } = await smartParseAny(t);
                //       const lines = pickLines(ai);
                //       const cards = pickCards(ai);
                //       const actions = pickActions(ai);

                //       const payload = getPayload(ai);
                //       const intent = String(ai?.intent ?? payload?.intent ?? "");

                //       const detectedByIntent = detectKindByIntent(ai);
                //       const kindFinal = (detectedByIntent !== "mixed"
                //         ? detectedByIntent
                //         : kind === "mixed"
                //         ? detectKindByText(t) === "income"
                //           ? "income"
                //           : "outcome"
                //         : kind) as Mode;

                //       if (
                //         intent === "outcome_image" ||
                //         intent === "income_image" ||
                //         intent === "poster_image"
                //       ) {
                //         const imgKind = intent === "poster_image" ? "mixed" : kindFinal;
                //         if (lines.length > 0) {
                //           draftLines(lines, { cards, actions }, () => addImageMessage(imgKind, ai));
                //         } else {
                //           addImageMessage(imgKind, ai);
                //         }
                //         return;
                //       }

                //       if (intent === "charts_outcomes" || intent === "charts_incomes") {
                //         addChartMessage(kindFinal, ai);
                //         return;
                //       }

                //       if (
                //         intent === "list_outcomes" ||
                //         intent === "list_incomes" ||
                //         intent === "query_outcome"
                //       ) {
                //         let items: any[] = Array.isArray(payload?.items)
                //           ? payload.items
                //           : Array.isArray(ai?.items)
                //           ? ai.items
                //           : [];

                //         if (
                //           items.length === 0 &&
                //           typeof ai?.answer === "string" &&
                //           intent === "list_outcomes"
                //         ) {
                //           items = parseItemsFromAnswer(ai.answer);
                //         }

                //         addTableOnlyMessage(
                //           kindFinal,
                //           items,
                //           lines.length ? lines : undefined,
                //           cards,
                //           actions,
                //           payload?.meta?.title ?? undefined
                //         );
                //         return;
                //       }

                //       if (intent === "next_steps_report" || intent === "income_report") {
                //         addReportMessage(kindFinal, ai);
                //         return;
                //       }

                //       if (intent === "create_outcome") {
                //         if (lines.length > 0) {
                //           draftLines(lines, { cards, actions }, () => openConfirmForOutcome(ai));
                //         } else {
                //           openConfirmForOutcome(ai);
                //         }
                //         return;
                //       }

                //       if (intent === "create_income") {
                //         if (lines.length > 0) {
                //           draftLines(lines, { cards, actions }, () => openConfirmForIncome(ai));
                //         } else {
                //           openConfirmForIncome(ai);
                //         }
                //         return;
                //       }

                //       if (lines.length > 0) {
                //         draftLines(lines, { cards, actions });
                //         return;
                //       }

                //       setMessages((p) => [
                //         ...p,
                //         {
                //           id: uid(),
                //           role: "ai",
                //           text: pickAnswerText(ai),
                //           cards,
                //           actions,
                //         },
                //       ]);
                //     } catch (e: any) {
                //       console.error(e);
                //       streamAIText(`❌ ${e?.message ?? "AI error. Please try again."}`);
                //     } finally {
                //       setLoading(false);
                //     }
                //   }

                //   async function send() {
                //     await sendWithValue(text);
                //   }

                //   async function onActionClick(action: AIAction) {
                //     const actionType = String(action?.type ?? "");
                //     const value = String(action?.value ?? "").trim();

                //     if (actionType === "prompt" && value) {
                //       await sendWithValue(value);
                //       return;
                //     }

                //     if (actionType === "download_image") {
                //       const lastImage = [...messages].reverse().find((m) => m.image?.src);
                //       if (lastImage?.image?.src) {
                //         const filename = (
                //           lastImage.image.title ||
                //           lastImage.image.poster?.title ||
                //           "image"
                //         )
                //           .replace(/[^\w\-]+/g, "_")
                //           .slice(0, 40);
                //         downloadDataUrl(lastImage.image.src, `${filename}.png`);
                //       }
                //       return;
                //     }

                //     if (actionType === "confirm_save_outcome" && draftAI) {
                //       setConfirmOpen(true);
                //       return;
                //     }

                //     if (value) {
                //       await sendWithValue(value);
                //     }
                //   }

                //   const lastTableMsg = useMemo(() => {
                //     for (let i = messages.length - 1; i >= 0; i--) {
                //       if (messages[i].role === "ai" && messages[i].table) return messages[i];
                //     }
                //     return null;
                //   }, [messages]);

                //   const lastChartMsg = useMemo(() => {
                //     for (let i = messages.length - 1; i >= 0; i--) {
                //       if (messages[i].role === "ai" && messages[i].chart?.series)
                //         return messages[i];
                //     }
                //     return null;
                //   }, [messages]);

                //   const lastImageMsg = useMemo(() => {
                //     for (let i = messages.length - 1; i >= 0; i--) {
                //       if (messages[i].role === "ai" && messages[i].image?.src)
                //         return messages[i];
                //     }
                //     return null;
                //   }, [messages]);

                //   return (
                //     <div className="flex h-screen flex-col bg-background">
                //       <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                //         <DialogContent className="sm:max-w-[560px]">
                //           <DialogHeader>
                //             <DialogTitle>
                //               {draftKind === "income"
                //                 ? "Confirm Income Save"
                //                 : "Confirm Outcome Save"}
                //             </DialogTitle>
                //             <DialogDescription>
                //               {draftKind === "income"
                //                 ? "Company / Month / Date မပါရင် ဒီမှာရွေးပြီး Save လုပ်ပါ ✅"
                //                 : "Bank / Date မပါရင် ဒီမှာရွေးပြီး Save လုပ်ပါ ✅"}
                //             </DialogDescription>
                //           </DialogHeader>

                //           <div className="space-y-3">
                //             <div className="rounded-2xl border bg-muted/30 p-3 text-sm">
                //               <div className="font-semibold">Draft</div>

                //               {draftKind === "income" ? (
                //                 <div className="mt-2 grid gap-1 text-muted-foreground">
                //                   <div>
                //                     Company:{" "}
                //                     <span className="font-semibold text-foreground">
                //                       {String(
                //                         getPayload(draftAI)?.company ??
                //                           getPayload(draftAI)?.compamy ??
                //                           draftAI?.company ??
                //                           draftAI?.compamy ??
                //                           "—"
                //                       )}
                //                     </span>
                //                   </div>
                //                   <div>
                //                     Amount:{" "}
                //                     <span className="font-semibold text-foreground">
                //                       {String(
                //                         getPayload(draftAI)?.amount ?? draftAI?.amount ?? "—"
                //                       )}
                //                     </span>
                //                   </div>
                //                   <div>
                //                     Notice:{" "}
                //                     <span className="font-semibold text-foreground">
                //                       {String(
                //                         getPayload(draftAI)?.notice ?? draftAI?.notice ?? "—"
                //                       )}
                //                     </span>
                //                   </div>
                //                 </div>
                //               ) : (
                //                 <div className="mt-2 grid gap-1 text-muted-foreground">
                //                   <div>
                //                     Shop:{" "}
                //                     <span className="font-semibold text-foreground">
                //                       {String(
                //                         getPayload(draftAI)?.shop ?? draftAI?.shop ?? "—"
                //                       )}
                //                     </span>
                //                   </div>
                //                   <div>
                //                     Amount:{" "}
                //                     <span className="font-semibold text-foreground">
                //                       {String(
                //                         getPayload(draftAI)?.amount ?? draftAI?.amount ?? "—"
                //                       )}
                //                     </span>
                //                   </div>
                //                   <div>
                //                     Notice:{" "}
                //                     <span className="font-semibold text-foreground">
                //                       {String(
                //                         getPayload(draftAI)?.notice ?? draftAI?.notice ?? "—"
                //                       )}
                //                     </span>
                //                   </div>
                //                 </div>
                //               )}
                //             </div>

                //             {draftKind === "income" ? (
                //               <>
                //                 <div className="space-y-1">
                //                   <div className="text-xs font-semibold text-muted-foreground">
                //                     Company
                //                   </div>
                //                   <Input
                //                     value={confirmCompany}
                //                     onChange={(e) => setConfirmCompany(e.target.value)}
                //                     placeholder="e.g. Salary / ABC Co., Ltd."
                //                   />
                //                 </div>

                //                 <div className="space-y-1">
                //                   <div className="text-xs font-semibold text-muted-foreground">
                //                     Month (YYYY-MM)
                //                   </div>
                //                   <Input
                //                     value={confirmMonth}
                //                     onChange={(e) => setConfirmMonth(e.target.value)}
                //                     placeholder="2026-03"
                //                   />
                //                 </div>

                //                 <div className="space-y-1">
                //                   <div className="text-xs font-semibold text-muted-foreground">
                //                     Date
                //                   </div>
                //                   <Input
                //                     type="date"
                //                     value={confirmDate}
                //                     onChange={(e) => setConfirmDate(e.target.value)}
                //                   />
                //                 </div>
                //               </>
                //             ) : (
                //               <>
                //                 <div className="space-y-1">
                //                   <div className="text-xs font-semibold text-muted-foreground">
                //                     Bank
                //                   </div>
                //                   <select
                //                     className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                //                     value={confirmBank}
                //                     onChange={(e) => setConfirmBank(e.target.value)}
                //                   >
                //                     {bankSuggestions.map((b) => (
                //                       <option key={b} value={b}>
                //                         {b}
                //                       </option>
                //                     ))}
                //                   </select>
                //                 </div>

                //                 <div className="space-y-1">
                //                   <div className="text-xs font-semibold text-muted-foreground">
                //                     Date
                //                   </div>
                //                   <Input
                //                     type="date"
                //                     value={confirmDate}
                //                     onChange={(e) => setConfirmDate(e.target.value)}
                //                   />
                //                   <div className="text-[11px] text-muted-foreground">
                //                     Calendar က auto ပေါ်လာပြီး ရွေးလို့ရပါတယ် ✅
                //                   </div>
                //                 </div>
                //               </>
                //             )}
                //           </div>

                //           <DialogFooter className="gap-2 sm:gap-0">
                //             <Button
                //               variant="outline"
                //               onClick={() => {
                //                 setConfirmOpen(false);
                //                 setDraftAI(null);
                //               }}
                //               disabled={confirmLoading}
                //             >
                //               Cancel
                //             </Button>
                //             <Button onClick={onConfirmSave} disabled={confirmLoading}>
                //               {confirmLoading ? "Saving..." : "Save ✅"}
                //             </Button>
                //           </DialogFooter>
                //         </DialogContent>
                //       </Dialog>

                //       <div className="w-full flex-1 overflow-y-auto">
                //         <div className="mx-auto w-full max-w-5xl px-4 py-6">
                //           {messages.map((m) => (
                //             <div key={m.id} className="mb-5 w-full">
                //               {m.role === "user" ? (
                //                 <div className="ml-auto flex max-w-[92%] items-start justify-end gap-3 sm:max-w-[80%]">
                //                   <div className="whitespace-pre-wrap rounded-3xl bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground shadow-sm">
                //                     {m.text}
                //                   </div>
                //                   <UserAvatar />
                //                 </div>
                //               ) : (
                //                 <div className="flex w-full items-start gap-3">
                //                   <AIAvatar />

                //                   <div className="min-w-0 max-w-[92%] sm:max-w-[80%]">
                //                     {m.lines ? (
                //                       <PrettyLinesBubble
                //                         lines={m.lines}
                //                         streaming={m.streaming}
                //                         done={m.done}
                //                       />
                //                     ) : (
                //                       <div className="whitespace-pre-wrap rounded-3xl border bg-muted/50 px-4 py-3 text-sm leading-6 shadow-sm">
                //                         {m.text}
                //                         {m.streaming ? (
                //                           <span className="ml-1 inline-block w-2 animate-pulse">
                //                             ▍
                //                           </span>
                //                         ) : null}
                //                       </div>
                //                     )}

                //                     {m.cards?.length ? <CardsRow cards={m.cards} /> : null}

                //                     {m.actions?.length ? (
                //                       <div className="mt-3 flex flex-wrap gap-2">
                //                         {m.actions.map((a, i) => (
                //                           <Button
                //                             key={`${a.label}-${i}`}
                //                             variant="outline"
                //                             size="sm"
                //                             onClick={() => onActionClick(a)}
                //                           >
                //                             {a.label || "Action"}
                //                           </Button>
                //                         ))}
                //                       </div>
                //                     ) : null}

                //                     {m.role === "ai" && m.table && m.id === lastTableMsg?.id ? (
                //                       m.table.kind === "income" ? (
                //                         <IncomesTableCard
                //                           title={m.table.title ?? ""}
                //                           rows={Array.isArray(m.table.rows) ? m.table.rows : []}
                //                         />
                //                       ) : (
                //                         <OutcomesTableCard
                //                           title={m.table.title ?? ""}
                //                           rows={Array.isArray(m.table.rows) ? m.table.rows : []}
                //                         />
                //                       )
                //                     ) : null}

                //                     {m.role === "ai" &&
                //                     m.chart?.series &&
                //                     m.id === lastChartMsg?.id ? (
                //                       <ChartCard
                //                         title={
                //                           m.chart.kind === "income"
                //                             ? "Income Charts"
                //                             : "Outcome Charts"
                //                         }
                //                       >
                //                         {m.chart.kind === "income" ? (
                //                           <IncomeChartsCard
                //                             series={{
                //                               trend: m.chart.series.trend ?? [],
                //                               byCompany:
                //                                 (m.chart.series as any).byCompany ?? [],
                //                             }}
                //                           />
                //                         ) : (
                //                           <OutcomeChartsCard series={m.chart.series as any} />
                //                         )}
                //                       </ChartCard>
                //                     ) : null}

                //                     {m.role === "ai" &&
                //                     m.image?.src &&
                //                     m.id === lastImageMsg?.id ? (
                //                       <ImageCard
                //                         title={m.image.title}
                //                         src={m.image.src}
                //                         kind={m.image.kind}
                //                         poster={m.image.poster}
                //                       />
                //                     ) : null}

                //                     {m.role === "ai" && m.report ? (
                //                       <ReportCard
                //                         report={m.report}
                //                         title={
                //                           m.reportKind === "income"
                //                             ? "Income Report"
                //                             : m.reportKind === "outcome"
                //                             ? "Outcome Report"
                //                             : "Report"
                //                         }
                //                       />
                //                     ) : null}
                //                   </div>
                //                 </div>
                //               )}
                //             </div>
                //           ))}

                //           {loading && (
                //             <div className="text-xs text-muted-foreground">AI thinking…</div>
                //           )}
                //           <div ref={bottomRef} />
                //         </div>
                //       </div>

                //       <div className="border-t bg-background/80 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                //         <div className="mx-auto flex max-w-5xl gap-2">
                //           <Input
                //             value={text}
                //             onChange={(e) => setText(e.target.value)}
                //             placeholder='Try: "Lawson 980 snack" / "salary 300000" / "ဒီလ outcome chart ပြ" / "ဒီလ outcome data ကို image အဖြစ်ထုတ်ပေးပါ" / "poster: Title | Subtitle | bullet1, bullet2" / "insight report ထုတ်ပေး"'
                //             onKeyDown={(e) => {
                //               // @ts-ignore
                //               if (e.nativeEvent?.isComposing) return;
                //               if (e.key === "Enter") send();
                //             }}
                //           />

                //           <Button onClick={send} disabled={loading}>
                //             <Send className="h-4 w-4" />
                //           </Button>
                //         </div>
                //       </div>
                //     </div>
                //   );
                // }