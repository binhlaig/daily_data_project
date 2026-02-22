"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DailyPoint = {
  date: string;
  income: number;
  outcome: number;
  profit: number;
};

function yen(n: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

export default function DailyChartClient({ data }: { data: DailyPoint[] }) {
  return (
    <Card className="rounded-xl border-border/60 bg-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          Daily Chart (Last {data.length} days)
        </CardTitle>
      </CardHeader>

      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickMargin={8}
              tickFormatter={(v) => String(v).slice(5)} // "MM-DD"
            />

            <YAxis
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              width={48}
            />
            <Tooltip
              formatter={(value: any, name) => [yen(Number(value)), name]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area type="monotone" dataKey="income" fillOpacity={0.25} />
            <Area type="monotone" dataKey="outcome" fillOpacity={0.25} />
            <Area type="monotone" dataKey="profit" fillOpacity={0.12} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
