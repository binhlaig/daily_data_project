import React from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RefreshCw, TrendingUp } from "lucide-react";
import { fetchIncomes } from "@/lib/data/alldata";
import { BreadCrumbItem } from "@/components/dashboard/outcome/bread-crumb-item";
import IncomeTableClient from "@/components/dashboard/income/IncomeTableClient";
import { InAddForm } from "@/components/dashboard/income/IncomeForm";



const yen = (n: number) =>
  `¥ ${new Intl.NumberFormat("ja-JP").format(Math.round(n || 0))}`;

function safeDateKey(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export default async function Page() {
  const incomeDocs = await fetchIncomes(); // ✅ server fetch

  const rows = (incomeDocs ?? []).map((r: any) => ({
    _id: String(r._id),
    amount: Number(r.amount || 0),
    company: String(r.company || ""),
    bank: String(r.bank || ""),
    notice: String(r.notice || ""),
    month: String(r.month || ""),
    date: r.date ? new Date(r.date).toISOString() : null,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
  }));

  // ✅ Summary (server)
  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const count = rows.length;

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = now.getMonth();
  const todayStr = now.toISOString().slice(0, 10);

  let todayTotal = 0;
  let monthTotal = 0;

  for (const r of rows) {
    const key = safeDateKey(r.date);
    if (!key) continue;
    const d = new Date(key);

    if (key === todayStr) todayTotal += Number(r.amount) || 0;
    if (d.getFullYear() === yyyy && d.getMonth() === mm)
      monthTotal += Number(r.amount) || 0;
  }

  return (
    <div className="space-y-4">
      <BreadCrumbItem />

      {/* ✅ Header */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50/40 via-background to-muted/20 dark:from-emerald-900/20 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        <div className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full bg-emerald-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold tracking-wide">
                Income
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Income list, totals and searchable table.
              </CardDescription>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary" className="rounded-full bg-background/40 backdrop-blur">
                  Total: <span className="ml-1 font-semibold">{yen(total)}</span>
                </Badge>

                <Badge variant="secondary" className="rounded-full bg-background/40 backdrop-blur">
                  Month:{" "}
                  <span className="ml-1 font-semibold">{yen(monthTotal)}</span>
                </Badge>

                <Badge variant="secondary" className="rounded-full bg-background/40 backdrop-blur">
                  Today:{" "}
                  <span className="ml-1 font-semibold">{yen(todayTotal)}</span>
                </Badge>

                <Badge variant="secondary" className="rounded-full bg-background/40 backdrop-blur">
                  Records: <span className="ml-1 font-semibold">{count}</span>
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="gap-1 rounded-full text-emerald-600 dark:text-emerald-400 bg-background/40 backdrop-blur"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Revenue
              </Badge>

              <InAddForm />

              {/* ✅ refresh */}
              <Button variant="outline" className="bg-background/40 backdrop-blur" asChild>
                <a href="/income">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ✅ Table Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50/30 via-background to-muted/20 dark:from-emerald-900/10 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        <div className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl" />

        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold tracking-wide">
            Income Table
          </CardTitle>
          <CardDescription className="text-xs">Search by company</CardDescription>
        </CardHeader>

        <CardContent>
          <IncomeTableClient rows={rows as any} />
        </CardContent>
      </Card>
    </div>
  );
}
