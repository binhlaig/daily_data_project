import React from "react";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { fetchIncomesTotal, fetchOutcomes } from "@/lib/data/alldata";
import EventCalendar from "@/components/Daily/EventCalander";
import DashboardGlowGrid from "./DashboardGlowGrid";
import { ModeToggle } from "@/components/darkmode";
import { fetchTodayTotals, fetchMonthTotals } from "@/lib/data/alldata";
import DailyChartClient from "@/components/dashboard/DailyChartClient";
import { fetchDailySeries } from "@/lib/data/alldata";

const today = await fetchTodayTotals();
const month = await fetchMonthTotals();

function formatJPY(n: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function Page() {
  const h = await headers();
  const session = await auth.api.getSession({
    headers: Object.fromEntries(h.entries()),
  });

  const totalRaw = await fetchIncomesTotal();
  const incomeTotal = Number(totalRaw) || 0;

  const result = await fetchOutcomes();
  const totalout = result?.totalout;

  const outcomeTotal =
    totalout?.reduce(
      (tot: number, item: { amount: number }) => tot + Number(item.amount || 0),
      0
    ) ?? 0;

  const profit = incomeTotal - outcomeTotal;
  const daily = await fetchDailySeries(30);

  const profitTone =
    profit > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : profit < 0
      ? "text-rose-600 dark:text-rose-400"
      : "text-foreground";

  return (
    <div className="min-h-screen flex flex-col">
      {/* ✅ Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Daily Data</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <div className="gap-2">
            <ModeToggle />
          </div>

          <Badge variant="secondary" className="rounded-full">
            ADMIN
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full hidden sm:inline-flex max-w-[260px] truncate"
            title={session?.user?.email ?? ""}
          >
            {session?.user?.email ?? "—"}
          </Badge>
        </div>
      </header>

      {/* ✅ Body */}
      <div className="flex-1 p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* <DashboardGlowGrid
          incomeTotal={incomeTotal}
          outcomeTotal={outcomeTotal}
          profitTotal={profit}
        /> */}

        <DashboardGlowGrid
          incomeTotal={incomeTotal}
          outcomeTotal={outcomeTotal}
          profitTotal={profit}
          incomeToday={today.incomeToday}
          outcomeToday={today.outcomeToday}
          profitToday={today.profitToday}
          incomeMonth={month.incomeMonth}
          outcomeMonth={month.outcomeMonth}
          profitMonth={month.profitMonth}
        />
      </div>

      {/* ✅ Main grid (left = Transactions, right = Calendar) */}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* LEFT: Transactions (big) */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Transactions</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="min-h-[40vh] rounded-xl bg-muted/30 border border-border/60 p-4">
              <div className="text-xs text-muted-foreground">
                <div className="space-y-4">
                  <DailyChartClient data={daily} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: Calendar (sticky) */}
        <div className="space-y-4 lg:sticky lg:top-20 h-fit">
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Calendar</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <EventCalendar />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
