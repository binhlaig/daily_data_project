

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Send, ChevronLeft, ChevronRight, CheckCircle2,
  Moon, Sun, TrendingUp, Bot, Zap,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";
import OutcomeChartsCard from "@/components/ai/OtcomeChartpage";

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = "outcome" | "income";
type DetectKind = Mode | "mixed";
type RemittanceStatus = "pending" | "paid" | "cancelled";
type DesignKind = Mode;

type PosterMeta = {
  size?: string | null; title?: string | null; subtitle?: string | null;
  bullets?: string[] | null; footer?: string | null; theme?: string | null; style?: string | null;
};
type AICard   = { label?: string; value?: any };
type AIAction = { type?: string; label?: string; value?: string; field?: string };
type DesignSelection = { required?: boolean; selected?: string | null; default?: string; options?: string[] };
type RemittanceDraft = {
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
  mmkAmount: number;
};

type Msg = {
  id: string; role: "user" | "ai"; text: string; lines?: string[];
  streaming?: boolean; done?: boolean; cards?: AICard[]; actions?: AIAction[];
  table?: { title?: string; rows: any[]; kind?: Mode };
  remittance?: {
    summary: {
      records: number;
      totalJpy: number;
      totalMmk: number;
      totalFee: number;
      pending: number;
      paid: number;
      cancelled: number;
    };
    rows: Array<{
      date: string;
      customerName: string;
      receiverName: string;
      payoutMethod: string;
      status: RemittanceStatus;
      yenAmount: number;
      mmkAmount: number;
    }>;
  };
  report?: any; reportKind?: Mode | "mixed";
  chart?: {
    series?: { trend?: any[]; byShop?: any[]; byCategory?: any[]; byBank?: any[]; byCompany?: any[] };
    filters?: any; kind?: Mode;
  };
  image?: { src: string; title?: string; kind?: Mode | "mixed"; poster?: PosterMeta | null };
};
type AIResult = any;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID() : Math.random().toString(16).slice(2);
}
const getPayload   = (ai: any) => ai?.payload ?? ai;
const getAssistant = (ai: any) => ai?.assistant ?? null;

function toISODate(v: any): string {
  if (!v) return "";
  const raw = v?.$date ?? v;
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function yen(v: any): string {
  const n = toNumber(v);
  return n === null ? (v ? `¥${String(v)}` : "—") : `¥${n.toLocaleString()}`;
}
function mmk(v: any): string {
  const n = toNumber(v);
  return n === null ? (v ? `${String(v)} MMK` : "—") : `${n.toLocaleString()} MMK`;
}
function cellText(v: any): string {
  if (v === null || v === undefined) return "—";
  const s = String(v).trim(); return s || "—";
}
function csvE(s: string) { return `"${s.replace(/"/g, '""')}"`; }
function dlUrl(url: string, fn: string) {
  const a = Object.assign(document.createElement("a"), { href: url, download: fn });
  document.body.appendChild(a); a.click(); a.remove();
}
function exportCSV(rows: any[], kind: "outcome" | "income", fn: string) {
  const h = kind === "outcome"
    ? ["date","shop","bank","amount","notice"]
    : ["date","company","month","amount","notice"];
  const lines = [h.join(","), ...rows.map(r => {
    const date = csvE(toISODate(r?.date) || toISODate(r?.createdAt));
    return kind === "outcome"
      ? [date, csvE(String(r?.shop??"")), csvE(String(r?.bank??"")), csvE(String(r?.amount??"")), csvE(String(r?.notice??""))].join(",")
      : [date, csvE(String(r?.company??r?.compamy??"")), csvE(String(r?.month??"")), csvE(String(r?.amount??"")), csvE(String(r?.notice??""))].join(",");
  })];
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })),
    download: fn,
  });
  document.body.appendChild(a); a.click(); a.remove();
}
function parseItemsFromAnswer(answer: string): any[] {
  return (answer ?? "").split("\n").map(s => s.trim()).filter(Boolean).flatMap(line => {
    const m = line.match(/^\d+\.\s*(.+?)\s+¥\s*([\d,]+)(?:\s+\[(.*?)\])?(?:\s+(.*))?$/i);
    return m ? [{ date: "", shop: (m[1]??"").trim(), amount: (m[2]??"").replace(/,/g,""), notice: (m[4]??"").trim()||"", bank: "" }] : [];
  });
}

function pickLines(ai: any): string[] {
  const a = getAssistant(ai), p = getPayload(ai);
  const l = (Array.isArray(a?.lines) ? a.lines : null)
    ?? (Array.isArray(p?.answer_lines) ? p.answer_lines : null)
    ?? (Array.isArray(ai?.answer_lines) ? ai.answer_lines : null) ?? [];
  return Array.isArray(l) ? l.map(String).filter(Boolean) : [];
}
function pickCards(ai: any): AICard[] {
  const a = getAssistant(ai);
  return Array.isArray(a?.cards)
    ? a.cards.map((c: any) => ({ label: typeof c?.label==="string" ? c.label : "", value: c?.value }))
    : [];
}
function pickActions(ai: any): AIAction[] {
  const a = getAssistant(ai);
  return Array.isArray(a?.actions)
    ? a.actions.map((x: any) => ({
        type:  typeof x?.type==="string"  ? x.type  : "",
        label: typeof x?.label==="string" ? x.label : "",
        value: typeof x?.value==="string" ? x.value : "",
        field: typeof x?.field==="string" ? x.field : "",
      }))
    : [];
}
function pickAnswerText(ai: any): string {
  const a = getAssistant(ai), p = getPayload(ai);
  return String(a?.message ?? ai?.answer ?? p?.answer ?? ai?.message ?? "OK");
}
function pickChartSeries(ai: any) {
  const p = getPayload(ai);
  const s = p?.series ?? p?.chart?.series ?? ai?.series ?? ai?.chart?.series ?? null;
  return {
    series: {
      trend:      Array.isArray(s?.trend)      ? s.trend      : [],
      byShop:     Array.isArray(s?.byShop)     ? s.byShop     : [],
      byCategory: Array.isArray(s?.byCategory) ? s.byCategory : [],
      byBank:     Array.isArray(s?.byBank)     ? s.byBank     : [],
      byCompany:  Array.isArray(s?.byCompany)  ? s.byCompany  : (Array.isArray(s?.byShop) ? s.byShop : []),
    },
    filters: p?.filters ?? p?.chart?.filters ?? ai?.filters ?? ai?.chart?.filters ?? null,
  };
}
function pickImage(ai: any) {
  const p = getPayload(ai);
  const img = p?.image ?? ai?.image ?? null;
  const src = typeof img?.data_url==="string" && img.data_url.startsWith("data:image/") ? img.data_url : null;
  return src ? { src, title: typeof img?.title==="string" ? img.title : undefined } : null;
}
function pickPoster(ai: any): PosterMeta | null {
  const p = getPayload(ai);
  const poster = p?.poster ?? ai?.poster ?? null;
  if (!poster || typeof poster !== "object") return null;
  return {
    size:     typeof poster?.size==="string"     ? poster.size     : null,
    title:    typeof poster?.title==="string"    ? poster.title    : null,
    subtitle: typeof poster?.subtitle==="string" ? poster.subtitle : null,
    bullets:  Array.isArray(poster?.bullets) ? poster.bullets.map((x: any) => String(x)) : null,
    footer:   typeof poster?.footer==="string"   ? poster.footer   : null,
    theme:    typeof poster?.theme==="string"    ? poster.theme    : null,
    style:    typeof poster?.style==="string"    ? poster.style    : null,
  };
}
function pickDesignSelection(ai: any): DesignSelection | null {
  const p = getPayload(ai);
  const s = p?.design_selection ?? ai?.design_selection ?? null;
  if (!s || typeof s !== "object") return null;
  return {
    required: Boolean(s?.required),
    selected: typeof s?.selected==="string" ? s.selected : null,
    default:  typeof s?.default==="string"  ? s.default  : undefined,
    options:  Array.isArray(s?.options) ? s.options.map((x: any) => String(x)) : [],
  };
}
function detectKindByText(input: string): DetectKind {
  const t = (input || "").toLowerCase().trim();
  const iH = ["income","incomes","salary","pay","wage","bonus","company","compamy","ဝင်ငွေ","လစာ","လုပ်ခ"];
  const oH = ["outcome","outcomes","spend","expense","spent","buy","bought","shop","lawson","familymart","ကုန်ကျ","အသုံးစရိတ်","သုံး","ဝယ်"];
  const mH = ["report","analysis","insight","next steps","poster","image","chart","graph","summary","အကြံပြု","ဘာတွေ","ပုံ"];
  const hI = iH.some(k => t.includes(k));
  const hO = oH.some(k => t.includes(k));
  const hM = mH.some(k => t.includes(k));
  if (hI && !hO) return "income";
  if (hO && !hI) return "outcome";
  if (hM) return "mixed";
  return "mixed";
}
function detectKindByIntent(ai: any): Mode | "mixed" {
  const p = getPayload(ai);
  const i = String(ai?.intent ?? p?.intent ?? "").toLowerCase();
  if (!i) return "mixed";
  if (i.includes("income"))  return "income";
  if (i.includes("outcome")) return "outcome";
  if (i === "poster_image")  return "mixed";
  return "mixed";
}
function isRecognized(ai: any): boolean {
  const p = getPayload(ai);
  const i = String(ai?.intent ?? p?.intent ?? "").toLowerCase();
  return ["create_outcome","list_outcomes","charts_outcomes","query_outcome","outcome_image",
    "next_steps_report","create_income","list_incomes","charts_incomes","income_image",
    "income_report","poster_image"].includes(i);
}
function isBadRequestLike(e: any): boolean {
  const m = String(e?.message ?? "").toLowerCase();
  return m.includes("400") || m.includes("bad request") || m.includes("text is required");
}
function isRemittanceText(input: string): boolean {
  const t = (input || "").toLowerCase();
  return [
    "remittance", "money transfer", "myanmar", "japan", "jpy", "mmk",
    "kbz", "wave", "aya", "ငွေလွှဲ", "မြန်မာ", "ဂျပန်", "လက်ခံ"
  ].some(k => t.includes(k));
}
function isRemittanceCreateText(input: string): boolean {
  const t = (input || "").toLowerCase();
  return isRemittanceText(input) &&
    (/\b(jpy|yen|¥)\b/i.test(t) || /\brate\b/i.test(t) || /နှုန်း/.test(t)) &&
    (/\b(receiver|customer|sender|to)\b/i.test(t) || /လက်ခံသူ|ဂျပန်ဘက်|မြန်မာဘက်/.test(t));
}

// ─── Inline Code regex (no backtick in regex literal) ─────────────────────────
const INLINE_CODE_RE = new RegExp("(\u0060[^\u0060]+\u0060)", "g");

// ─── UI Atoms ─────────────────────────────────────────────────────────────────
function AIAvatar() {
  return (
    <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30 animate-pulse-slow">
      <Bot size={17} className="text-white" />
    </div>
  );
}
function UserAvatar() {
  return (
    <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
      <span className="text-[9px] font-black tracking-widest text-slate-400 dark:text-slate-500">YOU</span>
    </div>
  );
}

function IC({ text }: { text: string }) {
  const parts = String(text).split(INLINE_CODE_RE);
  return (
    <>
      {parts.map((p, i) => {
        const isCode = p.charAt(0) === "`" && p.charAt(p.length - 1) === "`" && p.length > 1;
        return isCode
          ? <code key={i} className="mx-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-violet-600 dark:text-cyan-400">{p.slice(1,-1)}</code>
          : <span key={i}>{p}</span>;
      })}
    </>
  );
}

function DraftBadge({ done }: { done?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
      done
        ? "border-emerald-400/40 text-emerald-500 bg-emerald-500/10"
        : "border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50"
    }`}>
      {done ? <><CheckCircle2 size={10} />Saved</> : <><Zap size={10} />Drafting…</>}
    </span>
  );
}

function LinesBubble({ lines, streaming, done }: { lines: string[]; streaming?: boolean; done?: boolean }) {
  const safe = Array.isArray(lines) ? lines : [];
  if (!safe.length) {
    return (
      <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">AI</span>
          <DraftBadge done={false} />
        </div>
        <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Writing<span className="inline-block w-0.5 h-3.5 ml-0.5 align-middle bg-violet-500 rounded-sm animate-pulse" />
        </div>
      </div>
    );
  }
  const head = safe[0] ?? "";
  const rest = safe.slice(1);
  const isBullet = (s: string) => /^\s*[•\-*]\s+/.test(s);
  return (
    <div className="relative rounded-2xl rounded-tl-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm overflow-hidden">
      {/* top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-violet-500 via-cyan-400 to-transparent opacity-60" />
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 text-left text-sm font-semibold text-slate-800 dark:text-slate-100 leading-6 whitespace-pre-wrap break-words">
          <IC text={head} />
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
          <DraftBadge done={done} />
          {streaming && <span className="inline-block w-0.5 h-3.5 bg-violet-500 rounded-sm animate-pulse" />}
        </div>
      </div>
      {rest.length > 0 && (
        <div className="mt-2 space-y-1.5 text-sm text-slate-500 dark:text-slate-400 leading-6 whitespace-pre-wrap break-words">
          {rest.map((line, idx) => {
            const bullet = isBullet(line);
            const clean = bullet ? line.replace(/^\s*[•\-*]\s+/, "") : line;
            return bullet
              ? <div key={idx} className="flex items-start gap-2"><span className="text-violet-500 mt-1 text-xs flex-shrink-0">◆</span><span className="min-w-0 flex-1"><IC text={clean} /></span></div>
              : <div key={idx}><IC text={line} /></div>;
          })}
        </div>
      )}
    </div>
  );
}

function CardsRow({ cards }: { cards: AICard[] }) {
  if (!cards?.length) return null;
  return (
    <div className="mt-3 grid gap-2 grid-cols-2 sm:grid-cols-3">
      {cards.map((c, i) => (
        <div key={`${c.label}-${i}`} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-sm hover:border-violet-400/50 transition-colors">
          <div className="text-[9px] font-black uppercase tracking-widest text-violet-500 dark:text-violet-400 mb-1">{c.label || "Info"}</div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 break-all">{String(c.value ?? "—")}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
function TableCard({ title, rows, kind }: { title: string; rows: any[]; kind: Mode }) {
  const isIn = kind === "income";
  const [filter, setFilter]   = useState("ALL");
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const keys = useMemo(() =>
    Array.from(new Set(
      rows.map(r => String(isIn ? (r?.company ?? r?.compamy ?? "") : (r?.bank ?? "")).trim()).filter(Boolean)
    )).sort(), [rows, isIn]);

  const filtered = useMemo(() =>
    filter === "ALL" ? rows : rows.filter(r =>
      String(isIn ? (r?.company ?? r?.compamy ?? "") : (r?.bank ?? "")).trim() === filter
    ), [rows, filter, isIn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(Math.max(1, page), totalPages);
  useEffect(() => { setPage(1); }, [filter, pageSize]);

  const paged    = useMemo(() => filtered.slice((safePage-1)*pageSize, safePage*pageSize), [filtered, safePage, pageSize]);
  const totalAmt = useMemo(() => filtered.reduce((s, r) => s + (toNumber(r?.amount) ?? 0), 0), [filtered]);
  const from     = filtered.length === 0 ? 0 : (safePage-1)*pageSize+1;
  const to       = Math.min(safePage*pageSize, filtered.length);

  const selectCls = "h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs px-2 outline-none focus:ring-1 focus:ring-violet-500";

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* header */}
      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 py-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-violet-500">{isIn ? "Incomes" : "Outcomes"}</span>
            <span className="text-xs text-slate-400">{title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">{isIn ? "Company" : "Bank"}</span>
            <select className={selectCls} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="ALL">All</option>
              {keys.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <span className="text-xs text-slate-400">Rows</span>
            <select className={selectCls} value={pageSize} onChange={e => setPageSize(Number(e.target.value))} style={{ width: 60 }}>
              {[10,25,50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button
              onClick={() => exportCSV(filtered, kind, `${kind}s.csv`)}
              className="h-8 px-3 rounded-lg text-xs font-semibold border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
            >CSV ↓</button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <button
            onClick={() => setPage(p => Math.max(1, p-1))} disabled={safePage <= 1}
            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-violet-400 disabled:opacity-30 transition-colors"
          ><ChevronLeft size={13} /></button>
          <span className="font-mono">{safePage}/{totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={safePage >= totalPages}
            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-violet-400 disabled:opacity-30 transition-colors"
          ><ChevronRight size={13} /></button>
          <span className="font-mono">{from}–{to} of {filtered.length}</span>
          <span className="ml-auto font-mono font-semibold text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 px-2 py-0.5 rounded-full">
            ¥{totalAmt.toLocaleString()}
          </span>
        </div>
      </div>
      {/* table */}
      <div className="overflow-auto max-h-[420px]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="sticky top-0 bg-white dark:bg-slate-900 z-10">
              {["Date", isIn ? "Company" : "Shop", isIn ? "Month" : "Bank", "Amount", "Notice"].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-violet-500 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0
              ? <tr><td colSpan={5} className="text-center py-10 text-sm text-slate-400">No data</td></tr>
              : paged.map((r: any, idx: number) => {
                  const date = toISODate(r?.date) || toISODate(r?.createdAt);
                  const n    = toNumber(r?.amount);
                  const amtCls = n === null
                    ? "text-slate-400 font-mono"
                    : n > 0
                      ? "text-emerald-500 font-bold font-mono"
                      : "text-rose-500 font-bold font-mono";
                  return (
                    <tr key={r?._id?.$oid ?? r?._id ?? `${safePage}-${idx}`}
                        className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors">
                      <td className="px-3 py-2 text-xs font-mono text-slate-400 whitespace-nowrap">{date || "—"}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {cellText(isIn ? (r?.company ?? r?.compamy) : r?.shop)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {isIn
                          ? <span className="text-xs font-mono text-slate-400">{cellText(r?.month)}</span>
                          : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{cellText(r?.bank)}</span>}
                      </td>
                      <td className={`px-3 py-2 text-right whitespace-nowrap text-sm ${amtCls}`}>{yen(r?.amount)}</td>
                      <td className="px-3 py-2 text-xs text-slate-400 max-w-[280px]">{cellText(r?.notice)}</td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RemittanceCard({ data }: { data: NonNullable<Msg["remittance"]> }) {
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 py-3">
        <div className="text-[10px] font-black uppercase tracking-widest text-cyan-500">
          Remittance Output
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl bg-white dark:bg-slate-950/60 p-2 border border-slate-100 dark:border-slate-800">
            <div className="text-slate-400">Records</div>
            <div className="font-black text-slate-800 dark:text-slate-100">
              {data.summary.records}
            </div>
          </div>
          <div className="rounded-xl bg-white dark:bg-slate-950/60 p-2 border border-slate-100 dark:border-slate-800">
            <div className="text-slate-400">JPY</div>
            <div className="font-black text-slate-800 dark:text-slate-100">
              {yen(data.summary.totalJpy)}
            </div>
          </div>
          <div className="rounded-xl bg-white dark:bg-slate-950/60 p-2 border border-slate-100 dark:border-slate-800">
            <div className="text-slate-400">MMK</div>
            <div className="font-black text-slate-800 dark:text-slate-100">
              {mmk(data.summary.totalMmk)}
            </div>
          </div>
        </div>
      </div>

      {data.rows.length > 0 && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.rows.map((r, i) => (
            <div key={`${r.date}-${r.customerName}-${i}`} className="px-4 py-3 text-xs">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {r.date} · {r.customerName} → {r.receiverName}
                </span>
                <span className="text-slate-400">
                  {r.payoutMethod} · {r.status} · {yen(r.yenAmount)} · {mmk(r.mmkAmount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────
function IncomeChartsCard({ series }: { series: { trend?: any[]; byCompany?: any[] } }) {
  const trend    = Array.isArray(series?.trend)      ? series.trend      : [];
  const byCompany = Array.isArray(series?.byCompany) ? series.byCompany : [];
  const total    = trend.reduce((s, p) => s + (Number(p?.y) || 0), 0);
  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs font-mono font-semibold text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 px-2 py-0.5 rounded-full">Points: {trend.length}</span>
        <span className="text-xs font-mono font-semibold text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 px-2 py-0.5 rounded-full">¥{total.toLocaleString()}</span>
      </div>
      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3">
        <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-2">Income Trend</div>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="x" hide />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="transparent" />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #7c3aed", borderRadius: 10, color: "#e2e8f0", fontSize: 12 }} cursor={{ stroke: "#7c3aed", strokeWidth: 1 }} />
              <Line type="monotone" dataKey="y" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3">
        <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-2">By Company</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCompany}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="name" hide />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="transparent" />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #7c3aed", borderRadius: 10, color: "#e2e8f0", fontSize: 12 }} cursor={{ fill: "rgba(124,58,237,0.08)" }} />
              <Bar dataKey="value" radius={[6,6,0,0]} fill="url(#barGrad)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Report ───────────────────────────────────────────────────────────────────
function ReportCard({ report, title }: { report: any; title?: string }) {
  const stats  = report?.stats ?? {};
  const steps: string[] = Array.isArray(report?.next_steps) ? report.next_steps : [];
  const summary = String(report?.summary ?? "Report");
  return (
    <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 py-3">
        <div className="text-[10px] font-black uppercase tracking-widest text-violet-500">{title ?? "Report"}</div>
        <div className="text-xs text-slate-400 mt-0.5">{summary}</div>
      </div>
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-violet-500">Stats</div>
          {[["Count", stats?.count ?? "—"], ["Total", `¥${Number(stats?.total_amount??0).toLocaleString()}`], ["Avg", `¥${Number(stats?.avg_amount??0).toLocaleString()}`]].map(([k,v]) => (
            <div key={k} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-2">
              <span className="text-xs text-slate-400">{k}</span>
              <span className="text-sm font-bold font-mono text-slate-700 dark:text-slate-200">{v}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-violet-500">Next Steps</div>
          {steps.length === 0
            ? <div className="text-sm text-slate-400">No steps</div>
            : steps.slice(0,12).map((s, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white mt-0.5">{i+1}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s}</span>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

// ─── Image Card ───────────────────────────────────────────────────────────────
function ImageCard({ title, src, kind, poster }: { title?: string; src: string; kind?: Mode|"mixed"; poster?: PosterMeta|null }) {
  const sn = (title || poster?.title || (kind==="income" ? "income" : kind==="outcome" ? "outcome" : "image"))
    .replace(/[^\w\-]+/g, "_").slice(0, 40);
  return (
    <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 py-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-violet-500">{title ?? poster?.title ?? "Image"}</div>
          {poster?.subtitle && <div className="text-xs text-slate-400 mt-0.5">{poster.subtitle}</div>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => dlUrl(src, `${sn}.png`)} className="h-7 px-3 rounded-lg text-xs font-semibold border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors">↓ PNG</button>
          <button onClick={() => window.open(src, "_blank")} className="h-7 px-3 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-violet-400 transition-colors">Open ↗</button>
        </div>
      </div>
      <div className="p-3">
        <img src={src} alt={title ?? poster?.title ?? "image"} className="w-full rounded-xl border border-slate-100 dark:border-slate-800" />
      </div>
    </div>
  );
}

// ─── Dialog helpers ───────────────────────────────────────────────────────────
const dlgInputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition";
const dlgSelectCls = "w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-violet-500 transition";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [isDark, setIsDark] = useState(false);

  const [messages,    setMessages]    = useState<Msg[]>([]);
  const [text,        setText]        = useState("");
  const [loading,     setLoading]     = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const tTimer    = useRef<number | null>(null);
  const lTimer    = useRef<number | null>(null);
  const flRef     = useRef<Record<string, string[]>>({});

  const [confirmOpen,    setConfirmOpen]    = useState(false);
  const [dlgOpen,        setDlgOpen]        = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [draftAI,        setDraftAI]        = useState<any>(null);
  const [draftKind,      setDraftKind]      = useState<Mode>("outcome");
  const [remitOpen,      setRemitOpen]      = useState(false);
  const [remitDraft,     setRemitDraft]     = useState<RemittanceDraft | null>(null);
  const [pendPrompt,     setPendPrompt]     = useState("");
  const [pendKind,       setPendKind]       = useState<DesignKind>("outcome");
  const [dlgOpts,        setDlgOpts]        = useState<string[]>([]);
  const [selDesign,      setSelDesign]      = useState("");
  const [dlgGen,         setDlgGen]         = useState(false);
  const [cBank,     setCBank]     = useState("");
  const [cDate,     setCDate]     = useState("");
  const [cCompany,  setCCompany]  = useState("");
  const [cMonth,    setCMonth]    = useState("");
  const [rDate, setRDate] = useState("");
  const [rCustomer, setRCustomer] = useState("");
  const [rReceiver, setRReceiver] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rMethod, setRMethod] = useState("KBZ Pay");
  const [rYen, setRYen] = useState("");
  const [rRate, setRRate] = useState("");
  const [rFee, setRFee] = useState("0");
  const [rStatus, setRStatus] = useState<RemittanceStatus>("pending");
  const [rNote, setRNote] = useState("");

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => () => {
    if (tTimer.current) clearInterval(tTimer.current);
    if (lTimer.current) clearInterval(lTimer.current);
  }, []);

  // Apply dark class to html element
  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDark]);

  async function pjs(res: Response) {
    const raw = await res.text().catch(() => "");
    try { return raw ? JSON.parse(raw) : {}; } catch { return { raw }; }
  }
  function throwAI(r: Response, p: any, tag: string): never {
    throw new Error(`AI error (${r.status}): ${String(p?.error ?? p?.message ?? p?.raw ?? tag + " failed").slice(0, 300)}`);
  }
  async function spOut(input: string, extra?: any): Promise<AIResult> {
    const r = await fetch("/api/ai/parse-outcome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: input, ...(extra ?? {}) }) });
    const p = await pjs(r); if (!r.ok) throwAI(r, p, "parse-outcome"); return p;
  }
  async function spIn(input: string, extra?: any): Promise<AIResult> {
    const r = await fetch("/api/ai/parse-income", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: input, ...(extra ?? {}) }) });
    const p = await pjs(r); if (!r.ok) throwAI(r, p, "parse-income"); return p;
  }
  async function gNS(): Promise<AIResult> {
    const r = await fetch("/api/ai/next-steps", { method: "GET" });
    const p = await pjs(r); if (!r.ok) throwAI(r, p, "next-steps"); return p;
  }
  async function askRemittance(input: string) {
    const r = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
    });
    const p = await pjs(r);
    if (!r.ok || !p?.ok) throwAI(r, p, "remittance-ask");
    return {
      answer: p?.assistant?.message ?? p?.payload?.answer ?? "Remittance output ready.",
      ...(p?.payload?.remittance ?? {}),
    };
  }
  async function parseRemittance(input: string) {
    const r = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
    });
    const p = await pjs(r);
    if (!r.ok || !p?.ok) throwAI(r, p, "remittance-parse");
    return {
      answer: p?.assistant?.message ?? "Remittance output ready.",
      lines: Array.isArray(p?.assistant?.lines) ? p.assistant.lines : [],
      cards: Array.isArray(p?.assistant?.cards) ? p.assistant.cards : [],
      ...(p?.payload?.remittanceDraft ?? {}),
    };
  }

  async function spAny(input: string): Promise<{ ai: any; kind: Mode|"mixed" }> {
    const raw = (input || "").trim();
    if (/(^|\s)(next steps|insight|report|analysis|summary|အကြံပြု|ဘာတွေလုပ်ရမလဲ)(\s|$)/i.test(raw)) {
      const ai = await gNS(); return { ai, kind: "outcome" };
    }
    const guess = detectKindByText(raw);
    if (guess === "income") {
      try { const ai = await spIn(raw); const k = detectKindByIntent(ai); return { ai, kind: k === "mixed" ? "income" : k }; }
      catch (e) { if (!isBadRequestLike(e)) throw e; const ai = await spOut(raw); const k = detectKindByIntent(ai); return { ai, kind: k === "mixed" ? "outcome" : k }; }
    }
    if (guess === "outcome") {
      try { const ai = await spOut(raw); const k = detectKindByIntent(ai); return { ai, kind: k === "mixed" ? "outcome" : k }; }
      catch (e) { if (!isBadRequestLike(e)) throw e; const ai = await spIn(raw); const k = detectKindByIntent(ai); return { ai, kind: k === "mixed" ? "income" : k }; }
    }
    try {
      const ai1 = await spOut(raw); const k1 = detectKindByIntent(ai1);
      if (isRecognized(ai1)) return { ai: ai1, kind: k1 === "mixed" ? "outcome" : k1 };
      const ai2 = await spIn(raw); const k2 = detectKindByIntent(ai2);
      if (isRecognized(ai2)) return { ai: ai2, kind: k2 === "mixed" ? "income" : k2 };
      return { ai: ai1, kind: "mixed" };
    } catch {
      const ai2 = await spIn(raw); const k2 = detectKindByIntent(ai2);
      return { ai: ai2, kind: k2 === "mixed" ? "income" : k2 };
    }
  }

  async function saveOutcome(ai: any, ov?: { bank?: string; dateISO?: string }) {
    const p = getPayload(ai);
    const r = await fetch("/api/outcome", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: p.amount ?? ai?.amount ?? "",
        shop:   p.shop   ?? ai?.shop   ?? "",
        bank:   ov?.bank ?? p.bank ?? ai?.bank ?? "—",
        notice: String(p.notice ?? ai?.notice ?? "").trim(),
        date:   ov?.dateISO ?? p.date ?? ai?.date ?? new Date().toISOString(),
      }),
    });
    if (!r.ok) { const pd = await pjs(r); throw new Error(`Save failed (${r.status}): ${String(pd?.error ?? pd?.message ?? "Save failed").slice(0, 200)}`); }
  }
  async function saveIncome(ai: any, ov?: { company?: string; month?: string; dateISO?: string }) {
    const p = getPayload(ai);
    const dISO = ov?.dateISO ?? p.date ?? ai?.date ?? new Date().toISOString();
    const d = new Date(dISO);
    const y = d.getUTCFullYear(), m = String(d.getUTCMonth()+1).padStart(2,"0");
    const r = await fetch("/api/incomes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount:  p.amount ?? ai?.amount ?? "",
        month:   ov?.month   ?? p.month   ?? ai?.month   ?? `${y}-${m}`,
        compamy: ov?.company ?? p.company ?? p.compamy ?? ai?.company ?? ai?.compamy ?? "—",
        notice:  String(p.notice ?? ai?.notice ?? "").trim(),
        date:    dISO,
      }),
    });
    if (!r.ok) { const pd = await pjs(r); throw new Error(`Save failed (${r.status}): ${String(pd?.error ?? pd?.message ?? "Save failed").slice(0, 200)}`); }
  }

  function openRemitConfirm(draft: RemittanceDraft) {
    setRemitDraft(draft);
    setRDate(draft.date || new Date().toISOString().slice(0, 10));
    setRCustomer(draft.customerName || "");
    setRReceiver(draft.receiverName || "");
    setRPhone(draft.receiverPhone || "");
    setRMethod(draft.payoutMethod || "KBZ Pay");
    setRYen(String(draft.yenAmount || ""));
    setRRate(String(draft.exchangeRate || ""));
    setRFee(String(draft.serviceFee || 0));
    setRStatus(draft.status || "pending");
    setRNote(draft.note || "");
    setRemitOpen(true);
  }

  async function onSaveRemittance() {
    try {
      setConfirmLoading(true);

      const r = await fetch("/api/remittances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: rDate,
          customerName: rCustomer,
          receiverName: rReceiver,
          receiverPhone: rPhone,
          payoutMethod: rMethod,
          yenAmount: Number(rYen),
          exchangeRate: Number(rRate),
          serviceFee: Number(rFee || 0),
          status: rStatus,
          note: rNote,
        }),
      });

      if (!r.ok) {
        const pd = await pjs(r);
        throw new Error(`Save failed (${r.status}): ${String(pd?.error ?? pd?.message ?? "Save failed").slice(0, 200)}`);
      }

      setMessages(prev => [...prev, {
        id: uid(),
        role: "ai",
        text: "",
        lines: [
          "✅ Saved (Remittance)",
          `Customer: \`${rCustomer || "—"}\``,
          `Receiver: \`${rReceiver || "—"}\``,
          `JPY: \`${yen(rYen)}\``,
          `MMK: \`${mmk(Number(rYen) * Number(rRate))}\``,
        ],
        streaming: false,
        done: true,
      }]);

      setRemitOpen(false);
      setRemitDraft(null);
    } catch (e) {
      console.error(e);
      streamText(`❌ ${(e as any)?.message ?? "Save failed"}`);
    } finally {
      setConfirmLoading(false);
    }
  }

  function streamText(ft: string) {
    const id = uid();
    setMessages(prev => [...prev, { id, role: "ai", text: "", streaming: true }]);
    let i = 0;
    if (tTimer.current) clearInterval(tTimer.current);
    tTimer.current = window.setInterval(() => {
      i++;
      setMessages(prev => prev.map(m => m.id === id ? { ...m, text: ft.slice(0, i), streaming: i < ft.length } : m));
      if (i >= ft.length) { clearInterval(tTimer.current!); tTimer.current = null; }
    }, 12);
  }

  function draftLines(fl: string[], extra?: Partial<Msg>, onDone?: () => void) {
    const id = uid();
    flRef.current[id] = fl;
    setMessages(prev => [...prev, { id, role: "ai", text: "", lines: [""], streaming: true, done: false, ...extra }]);
    let li = 0, ci = 0;
    if (tTimer.current) clearInterval(tTimer.current);
    if (lTimer.current) clearInterval(lTimer.current);
    lTimer.current = window.setInterval(() => {
      const all = flRef.current[id] ?? [];
      if (!all.length) return;
      const cur = String(all[li] ?? "");
      setMessages(prev => prev.map(m => {
        if (m.id !== id) return m;
        const cl = Array.isArray(m.lines) ? [...m.lines] : [""];
        while (cl.length < li+1) cl.push("");
        cl[li] = (cl[li] ?? "") + cur.charAt(ci);
        return { ...m, lines: cl, streaming: true };
      }));
      ci++;
      if (ci >= cur.length) {
        li++; ci = 0;
        setMessages(prev => prev.map(m => {
          if (m.id !== id) return m;
          const cl = Array.isArray(m.lines) ? [...m.lines] : [];
          if (li < all.length) cl.push("");
          return { ...m, lines: cl, streaming: li < all.length };
        }));
        if (li >= all.length) {
          clearInterval(lTimer.current!); lTimer.current = null;
          setMessages(prev => prev.map(m => m.id === id ? { ...m, streaming: false, done: true } : m));
          delete flRef.current[id];
          setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === id ? { ...m, done: false } : m));
            onDone?.();
          }, 900);
        }
      }
    }, 14);
  }

  function addTable(kind: Mode, items: any[], lines?: string[], cards?: AICard[], actions?: AIAction[], title?: string) {
    const label = (kind === "income" ? "Income" : "Outcome") + " " + items.length + " records";
    const tableData = { title: title ?? ("Total " + items.length), rows: items, kind };
    setMessages(prev => [...prev, {
      id: uid(), role: "ai", text: "", lines: undefined, cards, actions,
      table: tableData,
    }]);
  }
  function addReport(kind: Mode|"mixed", ai: any) {
    const p = getPayload(ai), report = p?.report ?? ai?.report ?? null;
    const lines = pickLines(ai), cards = pickCards(ai), actions = pickActions(ai);
    const answerLines = lines.length > 0 ? lines : [pickAnswerText(ai)];
    draftLines(answerLines, { cards, actions }, () =>
      setMessages(prev => [...prev, { id: uid(), role: "ai", text: "", report, reportKind: kind }])
    );
  }
  function addChart(kind: Mode, ai: any) {
    const lines = pickLines(ai), cards = pickCards(ai), actions = pickActions(ai);
    const { series, filters } = pickChartSeries(ai);
    const answerLines = lines.length > 0 ? lines : [pickAnswerText(ai)];
    draftLines(answerLines, { cards, actions }, () =>
      setMessages(prev => [...prev, { id: uid(), role: "ai", text: "", chart: { series, filters, kind } }])
    );
  }
  function addImage(kind: Mode|"mixed", ai: any) {
    const lines = pickLines(ai), cards = pickCards(ai), actions = pickActions(ai);
    const img = pickImage(ai), poster = pickPoster(ai);
    const answerLines = lines.length > 0 ? lines : [pickAnswerText(ai)];
    draftLines(answerLines, { cards, actions }, () =>
      setMessages(prev => [...prev, { id: uid(), role: "ai", text: "", image: img ? { ...img, kind, poster } : undefined }])
    );
  }

  function openDlg(ai: any, input: string, kind: DesignKind) {
    const sel = pickDesignSelection(ai), opts = Array.isArray(sel?.options) ? sel!.options! : [];
    setPendPrompt(input); setPendKind(kind); setDlgOpts(opts);
    setSelDesign(sel?.selected ?? sel?.default ?? opts[0] ?? "");
    setDlgOpen(true);
  }
  async function genDesign() {
    if (!pendPrompt.trim() || !selDesign.trim()) return;
    try {
      setDlgGen(true);
      const ai = pendKind === "income"
        ? await spIn(pendPrompt, { design: selDesign, generate_now: true })
        : await spOut(pendPrompt, { design: selDesign, generate_now: true });
      const lines = pickLines(ai), cards = pickCards(ai), actions = pickActions(ai);
      const p = getPayload(ai), intent = String(ai?.intent ?? p?.intent ?? "");
      setDlgOpen(false);
      if (intent === "outcome_image" || intent === "income_image") {
        addImage(pendKind, ai);
        return;
      }
      if (lines.length > 0) { draftLines(lines, { cards, actions }); return; }
      streamText(pickAnswerText(ai));
    } catch (e: any) { console.error(e); streamText(`❌ ${e?.message ?? "Image generate failed"}`); }
    finally { setDlgGen(false); }
  }

  function openConfOut(ai: any) {
    const p = getPayload(ai);
    const miss: string[] = Array.isArray(p?.missing_fields) ? p.missing_fields : Array.isArray(ai?.missing_fields) ? ai.missing_fields : [];
    const sugg: string[] = Array.isArray(p?.bank_suggestions) ? p.bank_suggestions : Array.isArray(ai?.bank_suggestions) ? ai.bank_suggestions : [];
    const dISO = String(p?.suggested_date ?? ai?.suggested_date ?? new Date().toISOString());
    const d = new Date(dISO);
    const ymd = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const curBank = String(p?.bank ?? ai?.bank ?? "").trim();
    setDraftAI(ai); setDraftKind("outcome");
    if (curBank) setCBank(curBank); else if (sugg.length) setCBank(String(sugg[0])); else setCBank("Cash");
    setCDate(ymd);
    if (Boolean(p?.needs_confirm ?? ai?.needs_confirm ?? false) || miss.includes("bank") || miss.includes("date"))
      setConfirmOpen(true);
    else saveOutcome(ai).catch(console.error);
  }
  function openConfIn(ai: any) {
    const p = getPayload(ai);
    const miss: string[] = Array.isArray(p?.missing_fields) ? p.missing_fields : Array.isArray(ai?.missing_fields) ? ai.missing_fields : [];
    const dISO = String(p?.suggested_date ?? ai?.suggested_date ?? new Date().toISOString());
    const d = new Date(dISO);
    const y = d.getFullYear(), mm = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0");
    setDraftAI(ai); setDraftKind("income");
    setCDate(`${y}-${mm}-${dd}`);
    setCMonth(String(p?.month ?? ai?.month ?? "").trim() || `${y}-${mm}`);
    setCCompany(String(p?.company ?? p?.compamy ?? ai?.company ?? ai?.compamy ?? "").trim() || "Salary");
    if (Boolean(p?.needs_confirm ?? ai?.needs_confirm ?? false) || miss.includes("company") || miss.includes("month") || miss.includes("date"))
      setConfirmOpen(true);
    else saveIncome(ai).catch(console.error);
  }

  async function onSave() {
    if (!draftAI) { setConfirmOpen(false); return; }
    try {
      setConfirmLoading(true);
      const dISO = cDate ? new Date(`${cDate}T00:00:00.000Z`).toISOString() : new Date().toISOString();
      if (draftKind === "outcome") {
        await saveOutcome(draftAI, { bank: cBank || "—", dateISO: dISO });
        setMessages(prev => [...prev, { id: uid(), role: "ai", text: "", lines: ["✅ Saved (Outcome)", "Bank: `" + (cBank || "—") + "`", "Date: `" + (cDate || "—") + "`"], streaming: false, done: true }]);
      } else {
        await saveIncome(draftAI, { company: cCompany || "—", month: cMonth || "", dateISO: dISO });
        setMessages(prev => [...prev, { id: uid(), role: "ai", text: "", lines: ["✅ Saved (Income)", "Company: `" + (cCompany || "—") + "`", "Month: `" + (cMonth || "—") + "`", "Date: `" + (cDate || "—") + "`"], streaming: false, done: true }]);
      }
      setConfirmOpen(false); setDraftAI(null);
    } catch (e) { console.error(e); streamText(`❌ ${(e as any)?.message ?? "Save failed"}`); }
    finally { setConfirmLoading(false); }
  }

  const bankSugg = useMemo(() => {
    const p = draftAI ? getPayload(draftAI) : null;
    const l: string[] = Array.isArray(p?.bank_suggestions) ? p.bank_suggestions : Array.isArray(draftAI?.bank_suggestions) ? draftAI.bank_suggestions : [];
    return l.length ? l : ["Cash","PayPay","LINE Pay","Suica","JCB 7/11","Visa UFL","VISA SMBC"];
  }, [draftAI]);

  async function sendVal(raw: string) {
    const t = raw.trim(); if (!t || loading) return;
    setMessages(prev => [...prev, { id: uid(), role: "user", text: t }]);
    setText(""); setLoading(true);
    try {
      if (isRemittanceCreateText(t)) {
        const data = await parseRemittance(t);
        const lines = data.lines.length ? data.lines : [String(data.answer)];
        draftLines(lines, {
          cards: data.cards,
          actions: [{
            type: "save_remittance",
            label: "Save Remittance",
            value: JSON.stringify(data),
          }],
        });
        if (data?.customerName || data?.receiverName || data?.yenAmount) {
          setRemitDraft(data as RemittanceDraft);
        }
        return;
      }

      if (isRemittanceText(t)) {
        const data = await askRemittance(t);
        const lines = [
          String(data?.answer ?? "Remittance output ready."),
          `Records: \`${data?.summary?.records ?? 0}\``,
          `JPY: \`${yen(data?.summary?.totalJpy ?? 0)}\``,
          `MMK: \`${mmk(data?.summary?.totalMmk ?? 0)}\``,
        ];
        draftLines(lines, {
          remittance: {
            summary: data.summary,
            rows: Array.isArray(data.rows) ? data.rows : [],
          },
        });
        return;
      }

      const { ai, kind } = await spAny(t);
      const lines = pickLines(ai), cards = pickCards(ai), actions = pickActions(ai);
      const payload = getPayload(ai), intent = String(ai?.intent ?? payload?.intent ?? "");
      const dk  = detectKindByIntent(ai);
      const kF  = (dk !== "mixed" ? dk : kind === "mixed" ? (detectKindByText(t) === "income" ? "income" : "outcome") : kind) as Mode;

      if (intent === "select_outcome_image_design") { if (lines.length > 0) draftLines(lines, { cards, actions }); openDlg(ai, t, "outcome"); return; }
      if (intent === "select_income_image_design")  { if (lines.length > 0) draftLines(lines, { cards, actions }); openDlg(ai, t, "income");  return; }

      if (intent === "outcome_image" || intent === "income_image" || intent === "poster_image") {
        addImage(intent === "poster_image" ? "mixed" : kF, ai);
        return;
      }
      if (intent === "charts_outcomes" || intent === "charts_incomes") { addChart(kF, ai); return; }
      if (intent === "list_outcomes" || intent === "list_incomes" || intent === "query_outcome") {
        let items: any[] = Array.isArray(payload?.items) ? payload.items : Array.isArray(ai?.items) ? ai.items : [];
        if (items.length === 0 && typeof ai?.answer === "string" && intent === "list_outcomes") items = parseItemsFromAnswer(ai.answer);
        const answerLines = lines.length > 0 ? lines : [pickAnswerText(ai)];
        draftLines(answerLines, { cards, actions }, () =>
          addTable(kF, items, undefined, undefined, undefined, payload?.meta?.title ?? undefined)
        );
        return;
      }
      if (intent === "next_steps_report" || intent === "income_report") { addReport(kF, ai); return; }
      if (intent === "create_outcome") {
        const ansLines = lines.length > 0 ? lines : [pickAnswerText(ai)];
        draftLines(ansLines, { cards, actions }, () => openConfOut(ai));
        return;
      }
      if (intent === "create_income") {
        const ansLines = lines.length > 0 ? lines : [pickAnswerText(ai)];
        draftLines(ansLines, { cards, actions }, () => openConfIn(ai));
        return;
      }
      if (lines.length > 0) { draftLines(lines, { cards, actions }); return; }
      streamText(pickAnswerText(ai));
    } catch (e) { console.error(e); streamText("❌ " + ((e as any)?.message ?? "AI error. Please try again.")); }
    finally { setLoading(false); }
  }

  async function onAct(action: AIAction) {
    const at = String(action?.type ?? ""), val = String(action?.value ?? "").trim();
    if (at === "prompt" && val) { await sendVal(val); return; }
    if (at === "download_image") {
      const last = [...messages].reverse().find(m => m.image?.src);
      if (last?.image?.src) dlUrl(last.image.src, `${(last.image.title || last.image.poster?.title || "image").replace(/[^\w\-]+/g,"_").slice(0,40)}.png`);
      return;
    }
    if (at === "confirm_save_outcome" && draftAI) { setConfirmOpen(true); return; }
    if (at === "save_remittance") {
      try {
        const parsed = val ? JSON.parse(val) : remitDraft;
        if (parsed) openRemitConfirm(parsed as RemittanceDraft);
      } catch {
        if (remitDraft) openRemitConfirm(remitDraft);
      }
      return;
    }
    if (val) await sendVal(val);
  }

  const lastT = useMemo(() => { for (let i=messages.length-1;i>=0;i--) { if (messages[i].role==="ai"&&messages[i].table) return messages[i]; } return null; }, [messages]);
  const lastC = useMemo(() => { for (let i=messages.length-1;i>=0;i--) { if (messages[i].role==="ai"&&messages[i].chart?.series) return messages[i]; } return null; }, [messages]);
  const lastI = useMemo(() => { for (let i=messages.length-1;i>=0;i--) { if (messages[i].role==="ai"&&messages[i].image?.src) return messages[i]; } return null; }, [messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const native = e.nativeEvent as any;
    if (native?.isComposing) return;
    if (e.key === "Enter") sendVal(text);
  }

  const colorScheme = isDark ? "dark" : "light";

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* ── Design Dialog ── */}
      <Dialog open={dlgOpen} onOpenChange={open => { if (dlgGen) return; setDlgOpen(open); }}>
        <DialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100 font-bold">
              Select {pendKind === "income" ? "Income" : "Outcome"} Design
            </DialogTitle>
            <DialogDescription className="text-slate-400">Design ရွေးပြီးမှ generate ✅</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1">Prompt</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{pendPrompt || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1.5">Design Style</div>
              <select className={dlgSelectCls} value={selDesign} onChange={e => setSelDesign(e.target.value)}>
                {dlgOpts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setDlgOpen(false)} disabled={dlgGen} className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={genDesign} disabled={dlgGen || !selDesign} className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:opacity-90 disabled:opacity-40 transition-opacity shadow-lg shadow-violet-500/30">
              {dlgGen ? "Generating…" : "Generate ✨"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Remittance Confirm Dialog ── */}
      <Dialog open={remitOpen} onOpenChange={setRemitOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100 font-bold">
              Confirm Remittance
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Japan → Myanmar ငွေလွှဲစာရင်းကို စစ်ပြီး Save လုပ်ပါ။
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1.5">Date</div>
                <input className={dlgInputCls} type="date" value={rDate} onChange={e => setRDate(e.target.value)} style={{ colorScheme }} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1.5">Status</div>
                <select className={dlgSelectCls} value={rStatus} onChange={e => setRStatus(e.target.value as RemittanceStatus)}>
                  <option value="pending">pending</option>
                  <option value="paid">paid</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1.5">Japan Customer</div>
              <input className={dlgInputCls} value={rCustomer} onChange={e => setRCustomer(e.target.value)} placeholder="Mg Mg" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1.5">Myanmar Receiver</div>
                <input className={dlgInputCls} value={rReceiver} onChange={e => setRReceiver(e.target.value)} placeholder="Aye Aye" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1.5">Phone</div>
                <input className={dlgInputCls} value={rPhone} onChange={e => setRPhone(e.target.value)} placeholder="09..." />
              </div>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1.5">Payout Method</div>
              <select className={dlgSelectCls} value={rMethod} onChange={e => setRMethod(e.target.value)}>
                {["KBZ Pay", "Wave Pay", "AYA Pay", "CB Bank", "KBZ Bank", "Cash Pickup"].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1.5">JPY</div>
                <input className={dlgInputCls} value={rYen} onChange={e => setRYen(e.target.value)} placeholder="100000" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1.5">Rate</div>
                <input className={dlgInputCls} value={rRate} onChange={e => setRRate(e.target.value)} placeholder="22" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1.5">Fee</div>
                <input className={dlgInputCls} value={rFee} onChange={e => setRFee(e.target.value)} placeholder="500" />
              </div>
            </div>

            <div className="rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900 px-3 py-2 text-sm">
              <span className="text-slate-400">Myanmar payout: </span>
              <span className="font-black text-cyan-700 dark:text-cyan-300">{mmk(Number(rYen) * Number(rRate))}</span>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1.5">Note</div>
              <input className={dlgInputCls} value={rNote} onChange={e => setRNote(e.target.value)} placeholder="transaction note" />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button onClick={() => { setRemitOpen(false); setRemitDraft(null); }} disabled={confirmLoading} className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={onSaveRemittance} disabled={confirmLoading} className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:opacity-90 disabled:opacity-40 transition-opacity shadow-lg shadow-violet-500/30">
              {confirmLoading ? "Saving…" : "Save Remittance"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Dialog ── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-100 font-bold">
              {draftKind === "income" ? "Confirm Income" : "Confirm Outcome"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {draftKind === "income" ? "Company / Month / Date စစ်ဆေး ✅" : "Bank / Date စစ်ဆေး ✅"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-2">Draft</div>
              {draftKind === "income" ? (
                <>
                  <div className="text-xs text-slate-400">Company: <span className="font-semibold text-slate-700 dark:text-slate-200">{String(getPayload(draftAI)?.company ?? getPayload(draftAI)?.compamy ?? draftAI?.company ?? draftAI?.compamy ?? "—")}</span></div>
                  <div className="text-xs text-slate-400">Amount: <span className="font-bold font-mono text-emerald-500">{String(getPayload(draftAI)?.amount ?? draftAI?.amount ?? "—")}</span></div>
                  <div className="text-xs text-slate-400">Notice: <span className="font-semibold text-slate-700 dark:text-slate-200">{String(getPayload(draftAI)?.notice ?? draftAI?.notice ?? "—")}</span></div>
                </>
              ) : (
                <>
                  <div className="text-xs text-slate-400">Shop: <span className="font-semibold text-slate-700 dark:text-slate-200">{String(getPayload(draftAI)?.shop ?? draftAI?.shop ?? "—")}</span></div>
                  <div className="text-xs text-slate-400">Amount: <span className="font-bold font-mono text-rose-500">{String(getPayload(draftAI)?.amount ?? draftAI?.amount ?? "—")}</span></div>
                  <div className="text-xs text-slate-400">Notice: <span className="font-semibold text-slate-700 dark:text-slate-200">{String(getPayload(draftAI)?.notice ?? draftAI?.notice ?? "—")}</span></div>
                </>
              )}
            </div>

            {draftKind === "income" ? (
              <>
                <div><div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1.5">Company</div><input className={dlgInputCls} value={cCompany} onChange={e => setCCompany(e.target.value)} placeholder="Salary / ABC Co., Ltd." /></div>
                <div><div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1.5">Month (YYYY-MM)</div><input className={dlgInputCls} value={cMonth} onChange={e => setCMonth(e.target.value)} placeholder="2026-03" /></div>
                <div><div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1.5">Date</div><input className={dlgInputCls} type="date" value={cDate} onChange={e => setCDate(e.target.value)} style={{ colorScheme }} /></div>
              </>
            ) : (
              <>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1.5">Bank</div>
                  <select className={dlgSelectCls} value={cBank} onChange={e => setCBank(e.target.value)}>
                    {bankSugg.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div><div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1.5">Date</div><input className={dlgInputCls} type="date" value={cDate} onChange={e => setCDate(e.target.value)} style={{ colorScheme }} /></div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => { setConfirmOpen(false); setDraftAI(null); }} disabled={confirmLoading} className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={onSave} disabled={confirmLoading} className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:opacity-90 disabled:opacity-40 transition-opacity shadow-lg shadow-violet-500/30">
              {confirmLoading ? "Saving…" : "Save ✅"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Bot size={16} className="text-white" />
          </div>
          <span className="font-black text-sm tracking-tight text-slate-800 dark:text-slate-100">Finance AI</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-cyan-500 bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <button
          onClick={() => setIsDark(d => !d)}
          className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-violet-600 hover:border-violet-400 transition-colors"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {/* Welcome */}
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto shadow-xl shadow-violet-500/25">
                <Bot size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
                  Finance{" "}
                  <span className="bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">AI</span>
                </h1>
                <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  Outcome / Income / ငွေလွှဲစာရင်း output — chat ထဲမှာ တစ်ခါတည်း
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {["Lawson 980 snack", "salary 300000", "KBZ Pay MMK total", "pending ငွေလွှဲ ဘယ်နှစ်ခု"].map(h => (
                  <button key={h} onClick={() => sendVal(h)} className="px-4 py-2 rounded-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map(m => (
            <div key={m.id} className="w-full">
              {m.role === "user" ? (
                <div className="flex items-end justify-end gap-2">
                  <div className="max-w-[76%] px-4 py-3 rounded-2xl rounded-br-sm bg-gradient-to-br from-violet-600 to-violet-700 text-white text-sm leading-relaxed font-medium shadow-lg shadow-violet-500/20 whitespace-pre-wrap break-words">
                    {m.text}
                  </div>
                  <UserAvatar />
                </div>
              ) : (
                <div className="flex items-start gap-2 w-full">
                  <AIAvatar />
                  <div className="min-w-0 flex-1 max-w-[87%] space-y-2">
                    {m.lines
                      ? <LinesBubble lines={m.lines} streaming={m.streaming} done={m.done} />
                      : (
                        <div className="relative rounded-2xl rounded-tl-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm text-sm text-slate-600 dark:text-slate-300 leading-relaxed overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-violet-500 via-cyan-400 to-transparent opacity-50" />
                          {m.text}
                          {m.streaming && <span className="inline-block w-0.5 h-3.5 ml-0.5 align-middle bg-violet-500 rounded-sm animate-pulse" />}
                        </div>
                      )}

                    {m.cards?.length ? <CardsRow cards={m.cards} /> : null}

                    {m.actions?.length ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {m.actions.map((a, i) => (
                          <button key={`${a.label}-${i}`} onClick={() => onAct(a)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors">
                            {a.label || "Action"}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {m.role==="ai" && m.table && m.id===lastT?.id && (
                      <TableCard title={m.table.title ?? ""} rows={Array.isArray(m.table.rows) ? m.table.rows : []} kind={m.table.kind ?? "outcome"} />
                    )}

                    {m.role==="ai" && m.remittance && (
                      <RemittanceCard data={m.remittance} />
                    )}

                    {m.role==="ai" && m.chart?.series && m.id===lastC?.id && (
                      <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 py-3 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-md shadow-violet-500/20">
                            <TrendingUp size={13} className="text-white" />
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-violet-500">{m.chart.kind === "income" ? "Income Charts" : "Outcome Charts"}</div>
                            <div className="text-xs text-slate-400 mt-0.5">Trend / Breakdown ✅</div>
                          </div>
                        </div>
                        <div className="p-4">
                          {m.chart.kind === "income"
                            ? <IncomeChartsCard series={{ trend: m.chart.series.trend ?? [], byCompany: (m.chart.series as any).byCompany ?? [] }} />
                            : <OutcomeChartsCard series={m.chart.series as any} />}
                        </div>
                      </div>
                    )}

                    {m.role==="ai" && m.image?.src && m.id===lastI?.id && (
                      <ImageCard title={m.image.title} src={m.image.src} kind={m.image.kind} poster={m.image.poster} />
                    )}

                    {m.role==="ai" && m.report && (
                      <ReportCard report={m.report} title={m.reportKind==="income" ? "Income Report" : m.reportKind==="outcome" ? "Outcome Report" : "Report"} />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Thinking */}
          {loading && (
            <div className="flex items-center gap-2 pl-11">
              <div className="flex gap-1 items-center">
                {[0,1,2].map(i => (
                  <span key={i} className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: (i*0.15) + "s" }} />
                ))}
              </div>
              <span className="text-xs text-slate-400">AI thinking…</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input Bar ── */}
      <div className="relative z-10 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Try: "Lawson 980"  ·  "salary 300000"  ·  "KBZ Pay MMK total"  ·  "pending ငွေလွှဲ ဘယ်နှစ်ခု"'
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
          />
          <button
            onClick={() => sendVal(text)}
            disabled={loading}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 hover:scale-105 hover:shadow-violet-500/50 active:scale-95 disabled:opacity-40 transition-all duration-150"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
