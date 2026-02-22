
"use client";

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Props = {
  title: string;
  data: any[];
  dataKey: string;
  nameKey?: string;     // default "name"
  subtitle?: string;
  trend?: number;       // +12, -4
  valuePrefix?: string; // "¥ "
  valueSuffix?: string; // ""
};

type ColorPreset = {
  stroke: string;
  glow: string;
};

function pickPreset(dataKey: string): ColorPreset {
  const k = dataKey.toLowerCase();

  if (k.includes("sale") || k.includes("order") || k.includes("visit")) {
    return { stroke: "hsl(142.1 76.2% 36.3%)", glow: "hsl(142.1 76.2% 36.3%)" }; // emerald
  }
  if (k.includes("revenue") || k.includes("income") || k.includes("total")) {
    return { stroke: "hsl(262.1 83.3% 57.8%)", glow: "hsl(262.1 83.3% 57.8%)" }; // violet
  }
  if (k.includes("profit")) {
    return { stroke: "hsl(48 96% 53%)", glow: "hsl(48 96% 53%)" }; // amber
  }
  if (k.includes("outcome") || k.includes("expense") || k.includes("cost")) {
    return { stroke: "hsl(0 84.2% 60.2%)", glow: "hsl(0 84.2% 60.2%)" }; // red
  }

  // ✅ FIX: your CSS var already contains oklch(...), don't wrap with hsl()
  return { stroke: "var(--primary)", glow: "var(--primary)" };
}

function toNumber(v: any) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

// ✅ dark/light friendly tooltip (pure recharts)
function CustomBarTooltip({
  active,
  payload,
  label,
  valuePrefix,
  valueSuffix,
}: any) {
  if (!active || !payload?.length) return null;

  const p = payload[0];
  const name = p?.payload?.name ?? label ?? "";
  const value = Number(p?.value ?? 0);

  return (
    <div className="rounded-xl border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
      <div className="text-xs text-muted-foreground">Label</div>
      <div className="text-sm font-semibold">{String(name)}</div>
      <div className="mt-1 text-xs text-muted-foreground">Value</div>
      <div className="text-sm font-semibold">
        {(valuePrefix ?? "") + value.toLocaleString() + (valueSuffix ?? "")}
      </div>
    </div>
  );
}

export default function BarBox({
  title,
  subtitle,
  data,
  dataKey,
  nameKey = "name",
  trend,
  valuePrefix,
  valueSuffix,
}: Props) {
  const preset = useMemo(() => pickPreset(dataKey), [dataKey]);

  const gid = useMemo(
    () => `barGrad-${dataKey}-${Math.random().toString(16).slice(2)}`,
    [dataKey]
  );

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const max = useMemo(() => {
    const vals = (data ?? []).map((d) => toNumber(d?.[dataKey]));
    const m = Math.max(0, ...vals);
    return m || 1;
  }, [data, dataKey]);

  const total = useMemo(() => {
    return (data ?? []).reduce((s, d) => s + toNumber(d?.[dataKey]), 0);
  }, [data, dataKey]);

  const trendPositive = (trend ?? 0) >= 0;

  return (
    <>
      <Card className="h-full overflow-hidden relative border-border/60 bg-gradient-to-b from-background to-muted/20 shadow-sm transition hover:shadow-md hover:border-border">
        {/* glow blobs */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full blur-3xl opacity-40"
          style={{ background: preset.glow }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full blur-3xl opacity-20"
          style={{ background: preset.glow }}
        />

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold tracking-wide">
                {title}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {subtitle ?? "Tap a bar to see details"}
              </p>
            </div>

            {typeof trend === "number" && (
              <Badge
                variant="secondary"
                className={[
                  "gap-1 rounded-full",
                  trendPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400",
                ].join(" ")}
              >
                {trendPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {trendPositive ? "+" : ""}
                {trend}%
              </Badge>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Total</span>
            <span className="font-medium text-foreground">
              {(valuePrefix ?? "") + total.toLocaleString() + (valueSuffix ?? "")}
            </span>
          </div>
        </CardHeader>

        <CardContent className="h-52 pt-2">
          <ResponsiveContainer width="90%" height="50%">
            <BarChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={preset.stroke} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={preset.stroke} stopOpacity={0.18} />
                </linearGradient>
              </defs>

              {/* ✅ FIX: don't wrap oklch vars with hsl() */}
              <CartesianGrid
                vertical={false}
                stroke="var(--muted-foreground)"
                opacity={0.18}
                strokeDasharray="3 3"
              />

              <XAxis dataKey={nameKey} hide tickLine={false} axisLine={false} />
              <YAxis
                width={34}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                domain={[0, Math.ceil(max * 1.1)]}
              />

              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                content={
                  <CustomBarTooltip
                    valuePrefix={valuePrefix}
                    valueSuffix={valueSuffix}
                  />
                }
              />

              <Bar
                dataKey={dataKey}
                fill={`url(#${gid})`}
                radius={[10, 10, 10, 10]}
                stroke={preset.stroke}
                strokeWidth={1}
                onClick={(payload: any) => {
                  const row = payload?.payload ?? null;
                  if (row) {
                    setSelected(row);
                    setOpen(true);
                  }
                }}
                className="cursor-pointer"
              >
                {(data ?? []).map((row, i) => {
                  const v = toNumber(row?.[dataKey]);
                  const isPeak = v === max;
                  return <Cell key={`cell-${i}`} opacity={isPeak ? 1 : 0.9} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail</DialogTitle>
            <DialogDescription>
              {selected?.[nameKey] ? `For: ${selected?.[nameKey]}` : "Selected bar detail"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 grid gap-3">
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="text-xs text-muted-foreground">Value</div>
              <div className="mt-1 text-2xl font-semibold">
                {(valuePrefix ?? "") +
                  toNumber(selected?.[dataKey]).toLocaleString() +
                  (valueSuffix ?? "")}
              </div>
            </div>

            <div className="rounded-xl border bg-background p-4">
              <div className="text-xs font-medium">Raw row</div>
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-muted/30 p-3 text-xs">
{JSON.stringify(selected, null, 2)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}



