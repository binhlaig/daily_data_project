


"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { RefreshCcw } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { DailyPoint, MoneyRow } from "./types";



function toDayKey(row: MoneyRow) {
  const raw = row.date ?? row.createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function sumByDay(incomes: MoneyRow[], outcomes: MoneyRow[]): DailyPoint[] {
  const map = new Map<string, { income: number; outcome: number }>();

  for (const r of incomes) {
    const key = toDayKey(r);
    if (!key) continue;
    const cur = map.get(key) ?? { income: 0, outcome: 0 };
    cur.income += Number(r.amount ?? 0);
    map.set(key, cur);
  }

  for (const r of outcomes) {
    const key = toDayKey(r);
    if (!key) continue;
    const cur = map.get(key) ?? { income: 0, outcome: 0 };
    cur.outcome += Number(r.amount ?? 0);
    map.set(key, cur);
  }

  return Array.from(map.entries())
    .map(([day, v]) => ({
      day,
      income: v.income,
      outcome: v.outcome,
      profit: v.income - v.outcome,
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

function filterByRange(data: DailyPoint[], range: "90d" | "30d" | "7d") {
  const days = range === "90d" ? 90 : range === "30d" ? 30 : 7;
  if (!data.length) return data;

  const lastDay = new Date(data[data.length - 1].day);
  const start = new Date(lastDay);
  start.setDate(start.getDate() - (days - 1));

  return data.filter((d) => new Date(d.day) >= start);
}

/**
 * ✅ IMPORTANT
 * Your globals.css has:
 *   --chart-1: oklch(...);
 * so you MUST NOT wrap it as hsl(var(--chart-1)).
 * Use var(--chart-1) directly.
 */
const chartConfig = {
  income: { label: "Income", color: "var(--chart-1)" },
  outcome: { label: "Outcome", color: "var(--chart-2)" },
  profit: { label: "Profit", color: "var(--chart-3)" },
} as const;

export default function BigChartBox() {
  const [loading, setLoading] = useState(false);
  const [incomes, setIncomes] = useState<MoneyRow[]>([]);
  const [outcomes, setOutcomes] = useState<MoneyRow[]>([]);
  const [timeRange, setTimeRange] = useState<"90d" | "30d" | "7d">("90d");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [inRes, outRes] = await Promise.all([
        fetch("/api/income", { cache: "no-store" }),
        fetch("/api/outcome", { cache: "no-store" }),
      ]);
      const inJson = await inRes.json();
      const outJson = await outRes.json();
      setIncomes(Array.isArray(inJson) ? inJson : []);
      setOutcomes(Array.isArray(outJson) ? outJson : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const daily = useMemo(() => sumByDay(incomes, outcomes), [incomes, outcomes]);
  const filtered = useMemo(
    () => filterByRange(daily, timeRange),
    [daily, timeRange]
  );

  const titleText = "Income / Outcome / Profit";
  const descText =
    timeRange === "90d"
      ? "Total for the last 3 months"
      : timeRange === "30d"
      ? "Last 30 days"
      : "Last 7 days";

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          {titleText}
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchAll}
            disabled={loading}
            className="h-8 w-8"
            aria-label="Refresh"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>

        <CardDescription>
          <span className="@[540px]/card:block hidden">{descText}</span>
          <span className="@[540px]/card:hidden">
            {timeRange === "90d"
              ? "Last 3 months"
              : timeRange === "30d"
              ? "Last 30 days"
              : "Last 7 days"}
          </span>
        </CardDescription>

        <div className="absolute right-4 top-4">
          <Select
            value={timeRange}
            onValueChange={(v) => setTimeRange(v as any)}
          >
            <SelectTrigger
              className="@[767px]/card:hidden flex w-40"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>

            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[320px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filtered}>
              <defs>
                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-income)"
                    stopOpacity={0.9}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-income)"
                    stopOpacity={0.1}
                  />
                </linearGradient>

                <linearGradient id="fillOutcome" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-outcome)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-outcome)"
                    stopOpacity={0.1}
                  />
                </linearGradient>

                <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-profit)"
                    stopOpacity={0.55}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-profit)"
                    stopOpacity={0.08}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />

              <YAxis tickLine={false} axisLine={false} tickMargin={8} />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) =>
                      new Date(value as string).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                }
              />

              <Area
                dataKey="income"
                type="natural"
                stroke="var(--color-income)"
                fill="url(#fillIncome)"
                strokeWidth={2}
              />
              <Area
                dataKey="outcome"
                type="natural"
                stroke="var(--color-outcome)"
                fill="url(#fillOutcome)"
                strokeWidth={2}
              />
              <Area
                dataKey="profit"
                type="natural"
                stroke="var(--color-profit)"
                fill="url(#fillProfit)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
