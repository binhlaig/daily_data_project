// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import {
//   ResponsiveContainer,
//   AreaChart,
//   Area,
//   Tooltip,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   Legend,
// } from "recharts";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";

// type DailyPoint = { name: string; income: number; outcome: number; profit: number };

// function money(n: number) {
//   return `¥ ${Number(n ?? 0).toLocaleString()}`;
// }

// function Tip({ active, payload, label }: any) {
//   if (!active || !payload?.length) return null;
//   const income = payload.find((p: any) => p.dataKey === "income")?.value ?? 0;
//   const outcome = payload.find((p: any) => p.dataKey === "outcome")?.value ?? 0;
//   const profit = payload.find((p: any) => p.dataKey === "profit")?.value ?? 0;

//   return (
//     <div className="rounded-2xl border border-border/60 bg-background/95 px-3 py-2 shadow-xl backdrop-blur">
//       <div className="text-[11px] text-muted-foreground">{label}</div>
//       <div className="mt-1 space-y-1 text-sm">
//         <div className="flex justify-between gap-6"><span>Income</span><b className="tabular-nums">{money(income)}</b></div>
//         <div className="flex justify-between gap-6"><span>Outcome</span><b className="tabular-nums">{money(outcome)}</b></div>
//         <div className="flex justify-between gap-6"><span>Profit</span><b className="tabular-nums">{money(profit)}</b></div>
//       </div>
//     </div>
//   );
// }

// export default function DailyTrendChart({ days = 30 }: { days?: number }) {
//   const [loading, setLoading] = useState(false);
//   const [data, setData] = useState<DailyPoint[]>([]);
//   const [range, setRange] = useState(days);

//   const fetchData = async (d: number) => {
//     setLoading(true);
//     try {
//       const res = await fetch(`/api/analytics/daily?days=${d}`, { cache: "no-store" });
//       const json = await res.json();
//       setData(Array.isArray(json?.data) ? json.data : []);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData(range);
//   }, [range]);

//   const totalIncome = useMemo(() => data.reduce((s, x) => s + (x.income ?? 0), 0), [data]);
//   const totalOutcome = useMemo(() => data.reduce((s, x) => s + (x.outcome ?? 0), 0), [data]);
//   const totalProfit = totalIncome - totalOutcome;

//   return (
//     <Card className="relative overflow-visible rounded-2xl border border-border/60 bg-gradient-to-b from-background to-muted/20 shadow-sm">
//       <CardHeader className="flex flex-row items-center justify-between gap-3">
//         <div className="min-w-0">
//           <CardTitle className="text-sm font-semibold tracking-wide">Daily Trend</CardTitle>
//           <p className="mt-1 text-xs text-muted-foreground">
//             Income vs Outcome (last {range} days)
//           </p>
//         </div>

//         <div className="flex items-center gap-2">
//           <Button variant="outline" size="sm" onClick={() => setRange(7)} disabled={loading}>
//             7D
//           </Button>
//           <Button variant="outline" size="sm" onClick={() => setRange(30)} disabled={loading}>
//             30D
//           </Button>
//           <Button variant="outline" size="sm" onClick={() => setRange(90)} disabled={loading}>
//             90D
//           </Button>
//           <Button variant="outline" size="sm" onClick={() => fetchData(range)} disabled={loading}>
//             {loading ? "Loading..." : "Refresh"}
//           </Button>
//         </div>
//       </CardHeader>

//       <CardContent>
//         <div className="grid gap-3 md:grid-cols-3">
//           <div className="rounded-xl border border-border/60 bg-background/50 p-3">
//             <div className="text-xs text-muted-foreground">Income</div>
//             <div className="text-lg font-semibold tabular-nums">{money(totalIncome)}</div>
//           </div>
//           <div className="rounded-xl border border-border/60 bg-background/50 p-3">
//             <div className="text-xs text-muted-foreground">Outcome</div>
//             <div className="text-lg font-semibold tabular-nums">{money(totalOutcome)}</div>
//           </div>
//           <div className="rounded-xl border border-border/60 bg-background/50 p-3">
//             <div className="text-xs text-muted-foreground">Profit</div>
//             <div className="text-lg font-semibold tabular-nums">{money(totalProfit)}</div>
//           </div>
//         </div>

//         <div className="mt-4 h-[320px] w-full">
//           <ResponsiveContainer width="100%" height="100%">
//             <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
//               <defs>
//                 <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.9} />
//                   <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.08} />
//                 </linearGradient>
//                 <linearGradient id="gOutcome" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.9} />
//                   <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.08} />
//                 </linearGradient>
//               </defs>

//               <CartesianGrid vertical={false} stroke="hsl(var(--muted-foreground) / 0.14)" />
//               <XAxis dataKey="name" tickMargin={8} tick={{ fontSize: 12 }} />
//               <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
//               <Legend />
//               <Tooltip content={<Tip />} wrapperStyle={{ zIndex: 9999 }} allowEscapeViewBox={{ x: true, y: true }} />

//               <Area type="monotone" dataKey="income" stroke="var(--chart-2)" fill="url(#gIncome)" strokeWidth={2} dot={false} />
//               <Area type="monotone" dataKey="outcome" stroke="var(--chart-1)" fill="url(#gOutcome)" strokeWidth={2} dot={false} />
//               {/* profit ကိုလိုချင်ရင် uncomment */}
//               <Area type="monotone" dataKey="profit" stroke="var(--chart-5)" fill="transparent" strokeWidth={2} dot={false} />
//             </AreaChart>
//           </ResponsiveContainer>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }



"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type DailyPoint = {
  date: string;
  income: number;
  outcome: number;
  profit: number;
};

function money(n: number) {
  return `¥ ${Number(n ?? 0).toLocaleString()}`;
}

function shortDateLabel(value: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}/${day}`;
}

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const income = payload.find((p: any) => p.dataKey === "income")?.value ?? 0;
  const outcome = payload.find((p: any) => p.dataKey === "outcome")?.value ?? 0;
  const profit = payload.find((p: any) => p.dataKey === "profit")?.value ?? 0;

  return (
    <div className="rounded-2xl border border-border/60 bg-background/95 px-3 py-2 shadow-xl backdrop-blur">
      <div className="text-[11px] text-muted-foreground">{label}</div>

      <div className="mt-1 space-y-1 text-sm">
        <div className="flex justify-between gap-6">
          <span>Income</span>
          <b className="tabular-nums">{money(income)}</b>
        </div>

        <div className="flex justify-between gap-6">
          <span>Outcome</span>
          <b className="tabular-nums">{money(outcome)}</b>
        </div>

        <div className="flex justify-between gap-6">
          <span>Profit</span>
          <b className="tabular-nums">{money(profit)}</b>
        </div>
      </div>
    </div>
  );
}

export default function DailyTrendChart({ days = 30 }: { days?: number }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DailyPoint[]>([]);
  const [range, setRange] = useState(days);
  const [error, setError] = useState("");

  const fetchData = async (d: number) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/analytics/daily?days=${d}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch daily trend data");
      }

      const json = await res.json();
      setData(Array.isArray(json?.data) ? json.data : []);
    } catch (err: any) {
      console.error(err);
      setData([]);
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(range);
  }, [range]);

  const totalIncome = useMemo(
    () => data.reduce((sum, item) => sum + Number(item.income ?? 0), 0),
    [data]
  );

  const totalOutcome = useMemo(
    () => data.reduce((sum, item) => sum + Number(item.outcome ?? 0), 0),
    [data]
  );

  const totalProfit = totalIncome - totalOutcome;

  return (
    <Card className="relative overflow-visible rounded-2xl border border-border/60 bg-gradient-to-b from-background to-muted/20 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold tracking-wide">
            Daily Trend
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Income vs Outcome by date (last {range} days)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={range === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => setRange(7)}
            disabled={loading}
          >
            7D
          </Button>

          <Button
            variant={range === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setRange(30)}
            disabled={loading}
          >
            30D
          </Button>

          <Button
            variant={range === 90 ? "default" : "outline"}
            size="sm"
            onClick={() => setRange(90)}
            disabled={loading}
          >
            90D
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(range)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <div className="text-xs text-muted-foreground">Income</div>
            <div className="text-lg font-semibold tabular-nums">
              {money(totalIncome)}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <div className="text-xs text-muted-foreground">Outcome</div>
            <div className="text-lg font-semibold tabular-nums">
              {money(totalOutcome)}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <div className="text-xs text-muted-foreground">Profit</div>
            <div
              className={`text-lg font-semibold tabular-nums ${
                totalProfit >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {money(totalProfit)}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
            {error}
          </div>
        ) : null}

        <div className="mt-4 h-[320px] w-full">
          {data.length === 0 && !loading && !error ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border/60 text-sm text-muted-foreground">
              No daily trend data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--chart-2)"
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--chart-2)"
                      stopOpacity={0.08}
                    />
                  </linearGradient>

                  <linearGradient id="gOutcome" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.08}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  stroke="hsl(var(--muted-foreground) / 0.14)"
                />

                <XAxis
                  dataKey="date"
                  tickMargin={8}
                  tick={{ fontSize: 12 }}
                  tickFormatter={shortDateLabel}
                />

                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                />

                <Legend />

                <Tooltip
                  content={<Tip />}
                  labelFormatter={(value) => String(value)}
                  wrapperStyle={{ zIndex: 9999 }}
                  allowEscapeViewBox={{ x: true, y: true }}
                />

                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="var(--chart-2)"
                  fill="url(#gIncome)"
                  strokeWidth={2}
                  dot={false}
                />

                <Area
                  type="monotone"
                  dataKey="outcome"
                  stroke="var(--chart-1)"
                  fill="url(#gOutcome)"
                  strokeWidth={2}
                  dot={false}
                />

                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="var(--chart-5)"
                  fill="transparent"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}