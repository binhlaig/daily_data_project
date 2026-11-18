"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileOutput,
  Landmark,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Sun,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type RemittanceStatus = "pending" | "paid" | "cancelled";
type ThemeMode = "light" | "dark";

type RemittanceRecord = {
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

type RemittanceListResponse =
  | { ok: true; remittances: RemittanceRecord[] }
  | { ok: false; error: string };

type RemittanceCreateResponse =
  | { ok: true; remittance: RemittanceRecord }
  | { ok: false; error: string };

type PromptParseData = Omit<RemittanceRecord, "id"> & {
  mmkAmount: number;
};

type PromptParseResponse =
  | { ok: true; payload?: { remittanceDraft?: PromptParseData } }
  | { ok: false; error: string };

const payoutMethods = [
  "KBZ Pay",
  "Wave Pay",
  "AYA Pay",
  "CB Bank",
  "KBZ Bank",
  "Cash Pickup",
];

const statusLabels: Record<RemittanceStatus, string> = {
  pending: "စောင့်ဆိုင်း",
  paid: "ပြီးဆုံး",
  cancelled: "ပယ်ဖျက်",
};

const yen = (value: number) =>
  `¥ ${new Intl.NumberFormat("ja-JP").format(Math.round(value || 0))}`;

const mmk = (value: number) =>
  `${new Intl.NumberFormat("en-US").format(Math.round(value || 0))} MMK`;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function statusTone(status: RemittanceStatus) {
  if (status === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (status === "cancelled") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300";
}

function StatCard({
  title,
  value,
  icon,
  helper,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  helper?: string;
}) {
  return (
    <Card className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900/70">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-950 via-blue-800 to-indigo-950 dark:from-blue-500 dark:via-blue-700 dark:to-indigo-500" />

      <CardHeader className="space-y-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <CardDescription className="line-clamp-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
            {title}
          </CardDescription>

          <div className="shrink-0 rounded-lg bg-blue-50 p-1.5 text-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
            {icon}
          </div>
        </div>

        <CardTitle className="break-words text-sm font-black tracking-tight text-slate-900 dark:text-white sm:text-base lg:text-lg">
          {value}
        </CardTitle>

        {helper && (
          <p className="line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400">
            {helper}
          </p>
        )}
      </CardHeader>
    </Card>
  );
}

export default function RemittanceLedgerClient() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [records, setRecords] = useState<RemittanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState("");
  const [promptOutput, setPromptOutput] = useState<PromptParseData | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RemittanceStatus>(
    "all"
  );

  const [form, setForm] = useState({
    date: todayKey(),
    customerName: "",
    receiverName: "",
    receiverPhone: "",
    payoutMethod: "KBZ Pay",
    yenAmount: "",
    exchangeRate: "",
    serviceFee: "0",
    status: "pending" as RemittanceStatus,
    note: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("remittance-theme") as ThemeMode | null;
    const nextTheme = saved === "dark" || saved === "light" ? saved : "light";

    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    localStorage.setItem("remittance-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  useEffect(() => {
    let alive = true;

    async function loadRecords() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/remittances", { cache: "no-store" });
        const data = (await response.json()) as RemittanceListResponse;

        if (!response.ok || !data.ok) {
          throw new Error(data.ok ? "Failed to load records" : data.error);
        }

        if (alive) setRecords(data.remittances);
      } catch (loadError) {
        if (alive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load records"
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadRecords();

    return () => {
      alive = false;
    };
  }, []);

  function updateForm(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function parsePrompt() {
    if (!prompt.trim()) return;

    setParsing(true);
    setError("");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: prompt }),
      });
      const data = (await response.json()) as PromptParseResponse;

      if (!response.ok) {
        throw new Error(data.ok ? "Failed to parse prompt" : data.error);
      }

      if (!data.ok) {
        throw new Error(data.error);
      }

      const draft = data.payload?.remittanceDraft;

      if (!draft) {
        throw new Error("Remittance draft output မရရှိပါ");
      }

      setPromptOutput(draft);
      setForm((current) => ({
        ...current,
        date: draft.date || current.date,
        customerName: draft.customerName || current.customerName,
        receiverName: draft.receiverName || current.receiverName,
        receiverPhone: draft.receiverPhone || current.receiverPhone,
        payoutMethod: draft.payoutMethod || current.payoutMethod,
        yenAmount: draft.yenAmount
          ? String(draft.yenAmount)
          : current.yenAmount,
        exchangeRate: draft.exchangeRate
          ? String(draft.exchangeRate)
          : current.exchangeRate,
        serviceFee: String(draft.serviceFee || 0),
        status: draft.status || current.status,
        note: draft.note || current.note,
      }));
    } catch (parseError) {
      setError(
        parseError instanceof Error
          ? parseError.message
          : "Failed to parse prompt"
      );
    } finally {
      setParsing(false);
    }
  }

  async function addRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const yenAmount = Number(form.yenAmount);
    const exchangeRate = Number(form.exchangeRate);
    const serviceFee = Number(form.serviceFee || 0);

    if (!form.customerName.trim() || !form.receiverName.trim()) return;
    if (!Number.isFinite(yenAmount) || yenAmount <= 0) return;
    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/remittances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date || todayKey(),
          customerName: form.customerName.trim(),
          receiverName: form.receiverName.trim(),
          receiverPhone: form.receiverPhone.trim(),
          payoutMethod: form.payoutMethod,
          yenAmount,
          exchangeRate,
          serviceFee: Number.isFinite(serviceFee) ? serviceFee : 0,
          status: form.status,
          note: form.note.trim(),
        }),
      });

      const data = (await response.json()) as RemittanceCreateResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.ok ? "Failed to save record" : data.error);
      }

      setRecords((current) => [data.remittance, ...current]);

      setForm({
        date: todayKey(),
        customerName: "",
        receiverName: "",
        receiverPhone: "",
        payoutMethod: "KBZ Pay",
        yenAmount: "",
        exchangeRate: form.exchangeRate,
        serviceFee: "0",
        status: "pending",
        note: "",
      });

      setCreateOpen(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save record"
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id: string, status: RemittanceStatus) {
    const before = records;

    setRecords((current) =>
      current.map((row) => (row.id === id ? { ...row, status } : row))
    );

    setError("");

    try {
      const response = await fetch(`/api/remittances/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to update status");
      }
    } catch (updateError) {
      setRecords(before);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update status"
      );
    }
  }

  async function removeRecord(id: string) {
    const before = records;

    setRecords((current) => current.filter((row) => row.id !== id));
    setError("");

    try {
      const response = await fetch(`/api/remittances/${id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to delete record");
      }
    } catch (deleteError) {
      setRecords(before);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete record"
      );
    }
  }

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();

    return records.filter((row) => {
      const matchesStatus =
        statusFilter === "all" || row.status === statusFilter;

      const matchesQuery =
        !q ||
        row.customerName.toLowerCase().includes(q) ||
        row.receiverName.toLowerCase().includes(q) ||
        row.receiverPhone.toLowerCase().includes(q) ||
        row.payoutMethod.toLowerCase().includes(q);

      return matchesStatus && matchesQuery;
    });
  }, [records, query, statusFilter]);

  const totals = useMemo(() => {
    return records.reduce(
      (sum, row) => {
        if (row.status === "cancelled") return sum;

        sum.yen += row.yenAmount;
        sum.mmk += row.yenAmount * row.exchangeRate;
        sum.fee += row.serviceFee;

        if (row.status === "pending") sum.pending += 1;
        if (row.status === "paid") sum.paid += 1;

        return sum;
      },
      { yen: 0, mmk: 0, fee: 0, pending: 0, paid: 0 }
    );
  }, [records]);

  const previewYen = Number(form.yenAmount || 0);
  const previewRate = Number(form.exchangeRate || 0);
  const previewMmk = previewYen * previewRate;

  const inputClass =
    "h-10 rounded-xl border-slate-200 bg-white/85 text-sm shadow-sm focus-visible:ring-blue-900 dark:border-white/10 dark:bg-slate-950/70 dark:text-white";

  const createRecordForm = (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
      <form className="relative space-y-3" onSubmit={addRecord}>
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/70 p-3 dark:border-blue-900/60 dark:bg-blue-950/25">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Label htmlFor="remittancePrompt" className="flex items-center gap-2">
              <FileOutput className="h-4 w-4 text-blue-900 dark:text-blue-300" />
              Python prompt output
            </Label>
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-xl bg-blue-900 px-3 text-xs font-bold text-white hover:bg-blue-950 dark:bg-blue-700 dark:hover:bg-blue-600"
              onClick={parsePrompt}
              disabled={parsing || !prompt.trim()}
            >
              {parsing ? "Parsing..." : "Output"}
            </Button>
          </div>

          <Textarea
            id="remittancePrompt"
            className="min-h-20 rounded-xl border-blue-200 bg-white/85 text-sm shadow-sm focus-visible:ring-blue-900 dark:border-blue-900/70 dark:bg-slate-950/70"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="ဥပမာ: customer Mg Mg, receiver Aye Aye 09123456789, JPY 100000, rate 22, fee 500, KBZ Pay"
          />

          {promptOutput && (
            <pre className="mt-3 max-h-44 overflow-auto rounded-xl border border-blue-200/80 bg-white/80 p-3 text-xs text-slate-700 dark:border-blue-900/60 dark:bg-slate-950/70 dark:text-slate-200">
              {JSON.stringify(promptOutput, null, 2)}
            </pre>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(event) => updateForm("date", event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value: RemittanceStatus) =>
                updateForm("status", value)
              }
            >
              <SelectTrigger id="status" className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">စောင့်ဆိုင်း</SelectItem>
                <SelectItem value="paid">ပြီးဆုံး</SelectItem>
                <SelectItem value="cancelled">ပယ်ဖျက်</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="customerName">Japan ဘက် Customer</Label>
          <Input
            id="customerName"
            className={inputClass}
            value={form.customerName}
            onChange={(event) => updateForm("customerName", event.target.value)}
            placeholder="ဥပမာ Mg Mg"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="receiverName">Myanmar Receiver</Label>
            <Input
              id="receiverName"
              className={inputClass}
              value={form.receiverName}
              onChange={(event) =>
                updateForm("receiverName", event.target.value)
              }
              placeholder="လက်ခံမည့်သူ"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="receiverPhone">Receiver Phone</Label>
            <Input
              id="receiverPhone"
              className={inputClass}
              value={form.receiverPhone}
              onChange={(event) =>
                updateForm("receiverPhone", event.target.value)
              }
              placeholder="09..."
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payoutMethod">Myanmar payout method</Label>
          <Select
            value={form.payoutMethod}
            onValueChange={(value) => updateForm("payoutMethod", value)}
          >
            <SelectTrigger id="payoutMethod" className={inputClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {payoutMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="yenAmount">JPY</Label>
            <Input
              id="yenAmount"
              inputMode="decimal"
              className={inputClass}
              value={form.yenAmount}
              onChange={(event) => updateForm("yenAmount", event.target.value)}
              placeholder="100000"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exchangeRate">Rate</Label>
            <Input
              id="exchangeRate"
              inputMode="decimal"
              className={inputClass}
              value={form.exchangeRate}
              onChange={(event) =>
                updateForm("exchangeRate", event.target.value)
              }
              placeholder="22"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="serviceFee">Fee JPY</Label>
            <Input
              id="serviceFee"
              inputMode="decimal"
              className={inputClass}
              value={form.serviceFee}
              onChange={(event) => updateForm("serviceFee", event.target.value)}
              placeholder="500"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/70 p-3 dark:border-blue-900/60 dark:bg-blue-950/25">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              Myanmar payout
            </span>
            <span className="font-black text-blue-950 dark:text-blue-300">
              {mmk(previewMmk)}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="note">မှတ်ချက်</Label>
          <Input
            id="note"
            className={inputClass}
            value={form.note}
            onChange={(event) => updateForm("note", event.target.value)}
            placeholder="ဘဏ်အကောင့်၊ transaction note..."
          />
        </div>

        <Button
          className="h-10 w-full rounded-xl bg-blue-900 font-bold text-white shadow-sm hover:bg-blue-950 dark:bg-blue-700 dark:hover:bg-blue-600"
          type="submit"
          disabled={saving}
        >
          <Plus className="mr-2 h-4 w-4" />
          {saving ? "သိမ်းနေသည်..." : "စာရင်းထည့်မယ်"}
        </Button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/70 p-3 text-slate-950 transition-colors dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-white lg:p-5">
      <div className="pointer-events-none fixed -right-40 -top-40 h-96 w-96 rounded-full bg-blue-900/10 blur-3xl dark:bg-blue-700/10" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-900/10 blur-3xl dark:bg-indigo-700/10" />

      <div className="relative mx-auto max-w-[1450px] space-y-3">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1">
            <Badge
              variant="outline"
              className="shrink-0 rounded-full border-slate-200 bg-white px-3 py-1 text-xs dark:border-white/10 dark:bg-white/5"
            >
              Records:
              <span className="ml-1 font-bold">
                {loading ? "Loading" : records.length}
              </span>
            </Badge>

            <Badge className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-950 hover:bg-blue-50 dark:bg-blue-950/50 dark:text-blue-200">
              JPY: <span className="ml-1 font-bold">{yen(totals.yen)}</span>
            </Badge>

            <Badge className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-950 hover:bg-blue-50 dark:bg-blue-950/50 dark:text-blue-200">
              MMK: <span className="ml-1 font-bold">{mmk(totals.mmk)}</span>
            </Badge>

            <Badge className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300">
              Pending:
              <span className="ml-1 font-bold">{totals.pending}</span>
            </Badge>

            <Badge className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300">
              Paid: <span className="ml-1 font-bold">{totals.paid}</span>
            </Badge>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 overflow-x-auto pb-1">
            <Button
              type="button"
              variant="outline"
              className="h-9 shrink-0 rounded-xl border-slate-200 bg-white px-3 text-xs shadow-sm dark:border-white/10 dark:bg-white/5"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <Sun className="mr-1.5 h-3.5 w-3.5 text-amber-300" />
              ) : (
                <Moon className="mr-1.5 h-3.5 w-3.5 text-slate-700" />
              )}
              {theme === "dark" ? "Light" : "Dark"}
            </Button>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  className="h-9 shrink-0 rounded-xl bg-blue-900 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-950 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add
                </Button>
              </DialogTrigger>

              <DialogContent className="z-[9999] max-h-[92vh] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:max-w-[720px]">
                <DialogHeader className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                  <DialogTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                    <span className="rounded-xl bg-blue-950 p-2 text-white dark:bg-blue-700">
                      <Plus className="h-4 w-4" />
                    </span>
                    ငွေလွှဲစာရင်းအသစ်
                  </DialogTitle>

                  <DialogDescription>
                    Japan ဘက်လက်ခံငွေနဲ့ Myanmar ဘက်ပေးငွေကို မှတ်ပါ။
                  </DialogDescription>
                </DialogHeader>

                <div className="max-h-[calc(92vh-82px)] overflow-y-auto px-5 py-4">
                  {createRecordForm}
                </div>
              </DialogContent>
            </Dialog>

            <Button
              type="button"
              variant="outline"
              className="h-9 shrink-0 rounded-xl border-slate-200 bg-white px-3 text-xs shadow-sm dark:border-white/10 dark:bg-white/5"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatCard
            title="လက်ခံရရှိသော Yen"
            value={yen(totals.yen)}
            helper="Cancelled မပါဝင်ပါ"
            icon={<WalletCards className="h-3.5 w-3.5" />}
          />

          <StatCard
            title="Myanmar ပေးရန်"
            value={mmk(totals.mmk)}
            helper="Rate ဖြင့်တွက်ထားသည်"
            icon={<Banknote className="h-3.5 w-3.5" />}
          />

          <StatCard
            title="Service Fee"
            value={yen(totals.fee)}
            helper="Total fee amount"
            icon={<CircleDollarSign className="h-3.5 w-3.5" />}
          />

          <StatCard
            title="မပြီးသေးသောစာရင်း"
            value={totals.pending}
            helper="Pending records"
            icon={<Clock3 className="h-3.5 w-3.5" />}
          />
        </section>

        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/75">
          <CardHeader className="relative p-4 pb-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="text-base font-black sm:text-lg">
                  ငွေလွှဲစာရင်းများ
                </CardTitle>
                <CardDescription className="mt-1 text-xs sm:text-sm">
                  Customer, receiver, phone, payout method ဖြင့်ရှာနိုင်ပါတယ်။
                </CardDescription>
              </div>

              <div className="grid gap-2 sm:grid-cols-[240px_150px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    className="h-10 rounded-xl border-slate-200 bg-white/80 pl-9 text-sm shadow-sm focus-visible:ring-blue-900 dark:border-white/10 dark:bg-slate-950/70"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search"
                  />
                </div>

                <Select
                  value={statusFilter}
                  onValueChange={(value: "all" | RemittanceStatus) =>
                    setStatusFilter(value)
                  }
                >
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white/80 text-sm shadow-sm focus:ring-blue-900 dark:border-white/10 dark:bg-slate-950/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">စောင့်ဆိုင်း</SelectItem>
                    <SelectItem value="paid">ပြီးဆုံး</SelectItem>
                    <SelectItem value="cancelled">ပယ်ဖျက်</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="mt-4 dark:bg-white/10" />
          </CardHeader>

          <CardContent className="relative px-4 pb-4">
            <div className="hidden overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm dark:border-white/10 dark:bg-slate-950/50 lg:block">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-slate-50/90 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-3 font-bold">Date</th>
                    <th className="px-3 py-3 font-bold">Customer</th>
                    <th className="px-3 py-3 font-bold">Receiver</th>
                    <th className="px-3 py-3 font-bold">Method</th>
                    <th className="px-3 py-3 text-right font-bold">JPY</th>
                    <th className="px-3 py-3 text-right font-bold">Rate</th>
                    <th className="px-3 py-3 text-right font-bold">MMK</th>
                    <th className="px-3 py-3 font-bold">Status</th>
                    <th className="px-3 py-3 text-right font-bold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {filteredRecords.map((row) => (
                    <tr
                      key={row.id}
                      className="bg-white/60 transition-colors hover:bg-slate-50 dark:bg-transparent dark:hover:bg-white/5"
                    >
                      <td className="whitespace-nowrap px-3 py-3 text-slate-500 dark:text-slate-400">
                        {row.date}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-slate-100 p-1.5 text-slate-500 dark:bg-white/10 dark:text-slate-300">
                            <UserRound className="h-3.5 w-3.5" />
                          </span>
                          <span className="font-bold">{row.customerName}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-bold">{row.receiverName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {row.receiverPhone || "-"}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Landmark className="h-4 w-4 text-slate-400" />
                          <span>{row.payoutMethod}</span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-right font-bold">
                        {yen(row.yenAmount)}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-right text-slate-500 dark:text-slate-400">
                        {row.exchangeRate}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-right font-black text-slate-900 dark:text-white">
                        {mmk(row.yenAmount * row.exchangeRate)}
                      </td>

                      <td className="px-3 py-3">
                        <Select
                          value={row.status}
                          onValueChange={(value: RemittanceStatus) =>
                            changeStatus(row.id, value)
                          }
                        >
                          <SelectTrigger className="h-8 w-[128px] rounded-xl border-slate-200 bg-white text-xs focus:ring-blue-900 dark:border-white/10 dark:bg-slate-950">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">စောင့်ဆိုင်း</SelectItem>
                            <SelectItem value="paid">ပြီးဆုံး</SelectItem>
                            <SelectItem value="cancelled">ပယ်ဖျက်</SelectItem>
                          </SelectContent>
                        </Select>

                        <Badge
                          variant="outline"
                          className={`mt-2 rounded-full px-2.5 py-0.5 text-[11px] ${statusTone(
                            row.status
                          )}`}
                        >
                          {row.status === "paid" && (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          )}
                          {statusLabels[row.status]}
                        </Badge>
                      </td>

                      <td className="px-3 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/40"
                          onClick={() => removeRecord(row.id)}
                          aria-label="Delete record"
                        >
                          <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-3 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                      >
                        {loading
                          ? "စာရင်းများ ဖတ်နေသည်..."
                          : "ငွေလွှဲစာရင်း မရှိသေးပါ။"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 lg:hidden">
              {filteredRecords.map((row) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {row.date}
                      </p>
                      <h3 className="mt-1 font-black">{row.customerName}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Receiver: {row.receiverName}
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className={`rounded-full px-2.5 py-0.5 text-[11px] ${statusTone(
                        row.status
                      )}`}
                    >
                      {statusLabels[row.status]}
                    </Badge>
                  </div>

                  <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-white/5">
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500 dark:text-slate-400">
                        Phone
                      </span>
                      <span className="font-semibold">
                        {row.receiverPhone || "-"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500 dark:text-slate-400">
                        Method
                      </span>
                      <span className="font-semibold">{row.payoutMethod}</span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500 dark:text-slate-400">
                        JPY
                      </span>
                      <span className="font-bold">{yen(row.yenAmount)}</span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500 dark:text-slate-400">
                        MMK
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {mmk(row.yenAmount * row.exchangeRate)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Select
                      value={row.status}
                      onValueChange={(value: RemittanceStatus) =>
                        changeStatus(row.id, value)
                      }
                    >
                      <SelectTrigger className="h-9 flex-1 rounded-xl border-slate-200 bg-white text-xs focus:ring-blue-900 dark:border-white/10 dark:bg-slate-950">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">စောင့်ဆိုင်း</SelectItem>
                        <SelectItem value="paid">ပြီးဆုံး</SelectItem>
                        <SelectItem value="cancelled">ပယ်ဖျက်</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-xl border-rose-200 text-rose-600 dark:border-rose-900/60 dark:text-rose-300"
                      onClick={() => removeRecord(row.id)}
                      aria-label="Delete record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredRecords.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                  {loading
                    ? "စာရင်းများ ဖတ်နေသည်..."
                    : "ငွေလွှဲစာရင်း မရှိသေးပါ။"}
                </div>
              )}
            </div>

            <Separator className="my-4 dark:bg-white/10" />

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge
                variant="secondary"
                className="rounded-full bg-blue-50 px-3 py-1 text-blue-950 dark:bg-blue-950/50 dark:text-blue-200"
              >
                Total JPY {yen(totals.yen)}
              </Badge>

              <Badge
                variant="secondary"
                className="rounded-full bg-blue-50 px-3 py-1 text-blue-950 dark:bg-blue-950/50 dark:text-blue-200"
              >
                Total MMK {mmk(totals.mmk)}
              </Badge>

              <Badge
                variant="secondary"
                className="rounded-full bg-blue-50 px-3 py-1 text-blue-950 dark:bg-blue-950/50 dark:text-blue-200"
              >
                Fee {yen(totals.fee)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
