import React from "react";
import { headers } from "next/headers";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TrendingDown, RefreshCw } from "lucide-react";

import { auth } from "@/lib/auth";
import { fetchOutcomes } from "@/lib/data/alldata";
import { OutAddForm } from "@/components/Form/OutAddForm";
import { DataTable } from "@/components/dashboard/outcome/outcom_data_table";
import { columns } from "@/components/dashboard/outcome/outcome_colunm";
import OutcomeTableClient from "@/components/dashboard/outcome/OutcomeTableClient";

function yen(n: number) {
  return `¥ ${new Intl.NumberFormat("ja-JP").format(Math.round(n || 0))}`;
}

function safeDateKey(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export default async function OutcomePage() {
  const h = await headers();
  const session = await auth.api.getSession({
    headers: Object.fromEntries(h.entries()),
  });

  const result = await fetchOutcomes();
  const totalout = result?.totalout ?? [];

  // ✅ serialize for client table (plain objects)
  const rows = totalout.map((r: any) => ({
    _id: String(r._id),
    amount: Number(r.amount || 0),
    shop: String(r.shop || ""),
    bank: String(r.bank || ""),
    notice: String(r.notice || ""),
    date: r.date ? new Date(r.date).toISOString() : null,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
  }));

  // ✅ summary
  const total = rows.reduce(
    (s: number, r: any) => s + (Number(r.amount) || 0),
    0
  );

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = now.getMonth();
  const todayStr = now.toISOString().slice(0, 10);

  let todayTotal = 0;
  let monthTotal = 0;

  for (const r of rows) {
    const key = safeDateKey(r.date || undefined);
    if (!key) continue;

    const d = new Date(key);
    if (key === todayStr) todayTotal += Number(r.amount) || 0;
    if (d.getFullYear() === yyyy && d.getMonth() === mm)
      monthTotal += Number(r.amount) || 0;
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* ✅ Header Glass Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-background to-muted/20 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        {/* glow blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-rose-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-rose-500/15 blur-3xl" />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold tracking-wide">
                Outcome
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Expense list, totals, and searchable table.
              </CardDescription>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary" className="rounded-full">
                  Total:{" "}
                  <span className="ml-1 font-semibold">{yen(total)}</span>
                </Badge>

                <Badge variant="secondary" className="rounded-full">
                  Month:{" "}
                  <span className="ml-1 font-semibold">{yen(monthTotal)}</span>
                </Badge>

                <Badge variant="secondary" className="rounded-full">
                  Today:{" "}
                  <span className="ml-1 font-semibold">{yen(todayTotal)}</span>
                </Badge>

                <Badge variant="secondary" className="rounded-full">
                  Records:{" "}
                  <span className="ml-1 font-semibold">{rows.length}</span>
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="gap-1 rounded-full text-rose-600 dark:text-rose-400"
              >
                <TrendingDown className="h-3.5 w-3.5" />
                Expense
              </Badge>

              <OutAddForm />

              {/* ✅ refresh is just router.refresh on client normally,
                  but here keep as visual only */}
              <Button
                variant="outline"
                className="bg-background/40 backdrop-blur rounded-xl"
                asChild
              >
                <a href="/outcome" aria-label="Refresh outcome">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ✅ Table Glass Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-background to-muted/20 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />

        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold tracking-wide">
            Outcome Table
          </CardTitle>
          <CardDescription className="text-xs">Search by shop</CardDescription>
          <Separator className="mt-2" />
        </CardHeader>

        <CardContent>
          {/* <DataTable
            columns={columns as any}
            data={rows as any}
            searchKey="shop"
            theme="outcome"
          /> */}

          <OutcomeTableClient rows={rows as any} />
        </CardContent>
      </Card>
    </div>
  );
}
