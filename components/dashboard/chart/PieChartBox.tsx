

// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { RefreshCcw } from "lucide-react";
// import {
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   Tooltip,
//   Legend,
// } from "recharts";

// type OutcomeRow = {
//   id?: number;
//   amount?: number | string;
//   date?: string;
//   createdAt?: string;

//   shop?: string;
//   shop_name?: string;
//   shopName?: string;
//   supplier?: string;
//   vendor?: string;
// };

// type PiePoint = { name: string; value: number };

// function getShopName(r: OutcomeRow) {
//   return (
//     r.shop ??
//     r.shop_name ??
//     r.shopName ??
//     r.supplier ??
//     r.vendor ??
//     "Unknown"
//   );
// }

// function toNumber(v: any) {
//   const n = Number(v ?? 0);
//   return Number.isFinite(n) ? n : 0;
// }

// function sumOutcomeByShop(rows: OutcomeRow[]): PiePoint[] {
//   const map = new Map<string, number>();
//   for (const r of rows) {
//     const shop = String(getShopName(r)).trim() || "Unknown";
//     map.set(shop, (map.get(shop) ?? 0) + toNumber(r.amount));
//   }
//   return Array.from(map.entries())
//     .map(([name, value]) => ({ name, value }))
//     .sort((a, b) => b.value - a.value);
// }

// // ✅ IMPORTANT: your CSS vars already contain `oklch(...)`, so use var() directly
// const PIE_COLORS = [
//   "var(--chart-1)",
//   "var(--chart-2)",
//   "var(--chart-3)",
//   "var(--chart-4)",
//   "var(--chart-5)",
// ];

// function CustomTooltip({ active, payload, label }: any) {
//   if (!active || !payload?.length) return null;

//   const p = payload[0];
//   const name = p?.name ?? label ?? "";
//   const value = Number(p?.value ?? 0);

//   return (
//     <div className="rounded-xl border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
//       <div className="text-xs text-muted-foreground">Shop</div>
//       <div className="text-sm font-semibold text-foreground">{name}</div>

//       <div className="mt-1 text-xs text-muted-foreground">Outcome</div>
//       <div className="text-sm font-semibold text-foreground">
//         {value.toLocaleString()}
//       </div>
//     </div>
//   );
// }

// export default function PieChartBox() {
//   const [loading, setLoading] = useState(false);
//   const [outcomes, setOutcomes] = useState<OutcomeRow[]>([]);

//   const fetchOutcome = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch("/api/outcome", { cache: "no-store" });
//       const json = await res.json();
//       setOutcomes(Array.isArray(json) ? json : []);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchOutcome();
//   }, []);

//   const data = useMemo(() => sumOutcomeByShop(outcomes), [outcomes]);
//   const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

//   return (
//     <Card className="h-full overflow-hidden relative border-border/60 bg-gradient-to-b from-background to-muted/20 shadow-sm transition hover:shadow-md hover:border-border">
//       <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
//       <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

//       <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
//         <div className="min-w-0">
//           <CardTitle className="text-sm font-semibold tracking-wide">
//             Outcome by Shop
//           </CardTitle>
//           <p className="mt-1 text-xs text-muted-foreground">
//             Hover slice to see details
//           </p>
//         </div>

//         <Button
//           variant="outline"
//           size="sm"
//           onClick={fetchOutcome}
//           disabled={loading}
//           className="gap-2"
//         >
//           <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
//           Refresh
//         </Button>
//       </CardHeader>

//       <CardContent className="h-[320px] pt-2">
//         <div className="h-full w-full">
//           <ResponsiveContainer width="100%" height="90%">
//             <PieChart>
//               <Tooltip content={<CustomTooltip />} />

//               <Legend
//                 verticalAlign="bottom"
//                 height={36}
//                 wrapperStyle={{
//                   fontSize: "12px",
//                   color: "var(--muted-foreground)",
//                 }}
//               />

//               <Pie
//                 data={data}
//                 dataKey="value"
//                 nameKey="name"
//                 innerRadius={68}
//                 outerRadius={108}
//                 paddingAngle={2}
//                 stroke="var(--background)"
//                 strokeWidth={2}
//               >
//                 {data.map((_, i) => (
//                   <Cell
//                     key={`cell-${i}`}
//                     fill={PIE_COLORS[i % PIE_COLORS.length]}
//                   />
//                 ))}
//               </Pie>
//             </PieChart>
//           </ResponsiveContainer>

//           <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
//             <span>Total Outcome</span>
//             <span className="font-medium text-foreground">
//               {total.toLocaleString()}
//             </span>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }



"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

type OutcomeRow = {
  id?: number;
  amount?: number | string;
  date?: string;
  createdAt?: string;

  shop?: string;
  shop_name?: string;
  shopName?: string;
  supplier?: string;
  vendor?: string;
};

type PiePoint = { name: string; value: number };

function getShopName(r: OutcomeRow) {
  return (
    r.shop ??
    r.shop_name ??
    r.shopName ??
    r.supplier ??
    r.vendor ??
    "Unknown"
  );
}

function toNumber(v: any) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function sumOutcomeByShop(rows: OutcomeRow[]): PiePoint[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const shop = String(getShopName(r)).trim() || "Unknown";
    map.set(shop, (map.get(shop) ?? 0) + toNumber(r.amount));
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const p = payload[0];
  const name = p?.name ?? "";
  const value = Number(p?.value ?? 0);

  return (
    <div className="z-[9999] rounded-2xl border border-border/60 bg-background/95 px-3 py-2 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="text-[11px] text-muted-foreground">Shop</div>
      <div className="text-sm font-semibold text-foreground">{name}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">Outcome</div>
      <div className="text-sm font-semibold tabular-nums text-foreground">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function niceCompact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

export default function PieChartBox() {
  const [loading, setLoading] = useState(false);
  const [outcomes, setOutcomes] = useState<OutcomeRow[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const fetchOutcome = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/outcome", { cache: "no-store" });
      const json = await res.json();
      setOutcomes(Array.isArray(json) ? json : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutcome();
  }, []);

  const data = useMemo(() => sumOutcomeByShop(outcomes), [outcomes]);
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  const top = useMemo(() => data.slice(0, 4), [data]);

  const active = activeIndex != null ? data[activeIndex] : null;

  return (
    // ✅ overflow-visible so Tooltip won't be clipped
    <Card className="group relative h-full overflow-visible rounded-2xl border border-border/60 bg-gradient-to-b from-background to-muted/20 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-border">
      {/* clip only the background effects */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl opacity-60 transition-opacity group-hover:opacity-80" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl opacity-40" />

        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold tracking-wide">
              Outcome by Shop
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Hover slice to see details
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchOutcome}
            disabled={loading}
            className="gap-2 rounded-full"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            {/* LEFT: donut */}
            <div className="relative h-[320px] w-full">
              {/* center label */}
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-2 text-center shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/40">
                  <div className="text-[11px] text-muted-foreground">
                    {active ? active.name : "Total Outcome"}
                  </div>
                  <div className="text-xl font-semibold tabular-nums">
                    {niceCompact(active ? active.value : total)}
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={<CustomTooltip />}
                    wrapperStyle={{ zIndex: 9999 }}
                    allowEscapeViewBox={{ x: true, y: true }}
                  />

                  {/* Legend ကို small + clean */}
                  <Legend
                    verticalAlign="bottom"
                    height={42}
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "12px",
                      color: "var(--muted-foreground)",
                    }}
                    formatter={(value: any) => (
                      <span className="text-muted-foreground">{String(value)}</span>
                    )}
                  />

                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={78}
                    outerRadius={112}
                    paddingAngle={2}
                    stroke="var(--background)"
                    strokeWidth={2}
                    onMouseLeave={() => setActiveIndex(null)}
                    onMouseEnter={(_, idx) => setActiveIndex(idx)}
                  >
                    {data.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                        opacity={activeIndex == null ? 0.95 : activeIndex === i ? 1 : 0.35}
                        style={{
                          filter:
                            activeIndex === i
                              ? "drop-shadow(0 10px 18px rgba(0,0,0,.18))"
                              : "none",
                          transition: "opacity 200ms ease",
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* RIGHT: Top list (kpi-style) */}
            <div className="h-[320px] rounded-2xl border border-border/60 bg-background/70 p-3 backdrop-blur-sm supports-[backdrop-filter]:bg-background/50">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">Top Shops</div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {niceCompact(total)}
                </div>
              </div>

              <div className="mt-3 max-h-[240px] space-y-2 overflow-auto pr-1">
                {top.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No data</div>
                ) : (
                  top.map((t, i) => {
                    const pct = total > 0 ? (t.value / total) * 100 : 0;
                    return (
                      <div
                        key={t.name + i}
                        className="rounded-xl border border-border/50 bg-background/60 p-2 transition hover:bg-background/80"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{t.name}</div>
                            <div className="text-[11px] text-muted-foreground tabular-nums">
                              {pct.toFixed(1)}%
                            </div>
                          </div>
                          <div className="text-sm font-semibold tabular-nums">
                            {niceCompact(t.value)}
                          </div>
                        </div>

                        {/* progress bar */}
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(0, pct))}%`,
                              background: `var(--chart-${(i % 5) + 1})`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Total Outcome</span>
                <span className="font-medium text-foreground tabular-nums">
                  {total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
