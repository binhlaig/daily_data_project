// "use client";

// import React, { useMemo } from "react";
// import {
//   ResponsiveContainer,
//   AreaChart,
//   Area,
//   Tooltip,
//   CartesianGrid,
//   XAxis,
//   YAxis,
// } from "recharts";
// import { TrendingUp, TrendingDown } from "lucide-react";

// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { ChartBoxConfig } from "./types";

// type ColorPreset = { stroke: string; glow: string };

// function pickPreset(key: string): ColorPreset {
//   const k = (key ?? "").toLowerCase();

//   if (k.includes("income") || k.includes("revenue") || k.includes("total"))
//     return { stroke: "hsl(262.1 83.3% 57.8%)", glow: "hsl(262.1 83.3% 57.8%)" }; // violet
//   if (k.includes("outcome") || k.includes("expense") || k.includes("cost"))
//     return { stroke: "hsl(0 84.2% 60.2%)", glow: "hsl(0 84.2% 60.2%)" }; // red
//   if (k.includes("profit"))
//     return { stroke: "hsl(48 96% 53%)", glow: "hsl(48 96% 53%)" }; // amber
//   if (k.includes("users") || k.includes("visit"))
//     return { stroke: "hsl(142.1 76.2% 36.3%)", glow: "hsl(142.1 76.2% 36.3%)" }; // emerald

//   return { stroke: "hsl(var(--primary))", glow: "hsl(var(--primary))" };
// }

// function toNumber(v: any) {
//   const n = Number(v ?? 0);
//   return Number.isFinite(n) ? n : 0;
// }

// function CustomMiniTooltip({ active, payload, label }: any) {
//   if (!active || !payload?.length) return null;
//   const p = payload[0];
//   return (
//     <div className="rounded-xl border bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
//       <div className="text-xs text-muted-foreground">{label ?? ""}</div>
//       <div className="mt-1 flex items-center justify-between gap-4 text-sm">
//         <span className="text-muted-foreground">{p?.name ?? "Value"}</span>
//         <span className="font-semibold">
//           {toNumber(p?.value).toLocaleString()}
//         </span>
//       </div>
//     </div>
//   );
// }

// export default function ChartBox({ props }: { props: ChartBoxConfig }) {
//   const isPositive = props.percentage >= 0;

//   const preset = useMemo(() => pickPreset(props.dataKey ?? props.title), [
//     props.dataKey,
//     props.title,
//   ]);

//   const gid = useMemo(
//     () =>
//       `areaGrad-${(props.dataKey ?? "key").replace(
//         /\s+/g,
//         "-"
//       )}-${Math.random().toString(16).slice(2)}`,
//     [props.dataKey]
//   );

//   const max = useMemo(() => {
//     const key = props.dataKey;
//     if (!key) return 1; // ✅ guard: dataKey undefined

//     const arr = (props.chartData ?? []).map((d: any) => toNumber(d?.[key]));
//     return Math.max(1, ...arr);
//   }, [props.chartData, props.dataKey]);

//   return (
//     <Card className="h-full overflow-hidden relative border-border/60  from-background to-muted/20 shadow-sm transition hover:shadow-md hover:border-border">
//       {/* glow blobs */}
//       <div
//         className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full blur-3xl opacity-35"
//         style={{ background: preset.glow }}
//       />
//       <div
//         className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full blur-3xl opacity-20"
//         style={{ background: preset.glow }}
//       />

//       <CardHeader className="pb-2">
//         <div className="flex items-start justify-between gap-3">
//           <div className="min-w-0">
//             <CardTitle className="text-sm font-semibold tracking-wide">
//               {props.title}
//             </CardTitle>
//             <CardDescription className="mt-1 text-xs">
//               Mini trend for recent days
//             </CardDescription>
//           </div>

//           <Badge
//             variant="secondary"
//             className={[
//               "gap-1 rounded-full",
//               isPositive
//                 ? "text-emerald-600 dark:text-emerald-400"
//                 : "text-red-600 dark:text-red-400",
//             ].join(" ")}
//           >
//             {isPositive ? (
//               <TrendingUp className="h-3.5 w-3.5" />
//             ) : (
//               <TrendingDown className="h-3.5 w-3.5" />
//             )}
//             {isPositive ? "+" : ""}
//             {props.percentage}%
//           </Badge>
//         </div>
//       </CardHeader>

//       <CardContent className="space-y-3">
//         <div className="flex items-end justify-between gap-3">
//           <div className="space-y-1">
//             <div className="text-2xl font-semibold">{props.number}</div>
//             <div className="text-xs text-muted-foreground">Total</div>
//           </div>

//           {/* chart (unchanged: AreaChart + Area + dataKey) */}
//           <div className="h-16 w-[58%]">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart
//                 data={props.chartData}
//                 margin={{ top: 6, right: 0, left: 0, bottom: 0 }}
//               >
//                 <defs>
//                   <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
//                     <stop
//                       offset="5%"
//                       stopColor={preset.stroke}
//                       stopOpacity={0.9}
//                     />
//                     <stop
//                       offset="95%"
//                       stopColor={preset.stroke}
//                       stopOpacity={0.1}
//                     />
//                   </linearGradient>
//                 </defs>

//                 <CartesianGrid
//                   vertical={false}
//                   stroke="hsl(var(--muted-foreground) / 0.18)"
//                 />

//                 <XAxis dataKey="name" hide />
//                 <YAxis hide domain={[0, Math.ceil(max * 1.1)]} />

//                 <Tooltip cursor={false} content={<CustomMiniTooltip />} />

//                 <Area
//                   type="monotone"
//                   dataKey={props.dataKey ?? "value"}
//                   stroke={preset.stroke}
//                   fill={`url(#${gid})`}
//                   strokeWidth={2}
//                   fillOpacity={1}
//                   dot={false}
//                   activeDot={{ r: 3 }}
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartBoxConfig } from "./types";

type ColorPreset = { stroke: string; glow: string };

function pickPreset(key: string): ColorPreset {
  const k = (key ?? "").toLowerCase();

  if (k.includes("income") || k.includes("revenue") || k.includes("total"))
    return { stroke: "hsl(262.1 83.3% 57.8%)", glow: "hsl(262.1 83.3% 57.8%)" }; // violet
  if (k.includes("outcome") || k.includes("expense") || k.includes("cost"))
    return { stroke: "hsl(0 84.2% 60.2%)", glow: "hsl(0 84.2% 60.2%)" }; // red
  if (k.includes("profit"))
    return { stroke: "hsl(48 96% 53%)", glow: "hsl(48 96% 53%)" }; // amber
  if (k.includes("users") || k.includes("visit"))
    return { stroke: "hsl(142.1 76.2% 36.3%)", glow: "hsl(142.1 76.2% 36.3%)" }; // emerald

  return { stroke: "hsl(var(--primary))", glow: "hsl(var(--primary))" };
}

function toNumber(v: any) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function niceCompact(n: number) {
  // 1200 => 1.2K, 1500000 => 1.5M
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000)
    return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

function CustomMiniTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const value = toNumber(p?.value);

  return (
    <div className="rounded-2xl border border-border/60 bg-background/95 px-3 py-2 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="text-[11px] text-muted-foreground">{label ?? ""}</div>
      <div className="mt-1 flex items-center justify-between gap-6 text-sm">
        <span className="text-muted-foreground">{p?.name ?? "Value"}</span>
        <span className="font-semibold tabular-nums">
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default function ChartBox({ props }: { props: ChartBoxConfig }) {
  const isPositive = props.percentage >= 0;

  const preset = useMemo(() => pickPreset(props.dataKey ?? props.title), [
    props.dataKey,
    props.title,
  ]);

  // stable id (no Math.random) -> avoids hydration mismatch & re-render gradient flicker
  const gid = useMemo(() => {
    const base = (props.dataKey ?? props.title ?? "key")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");
    return `areaGrad-${base}`;
  }, [props.dataKey, props.title]);

  const max = useMemo(() => {
    const key = props.dataKey;
    if (!key) return 1;
    const arr = (props.chartData ?? []).map((d: any) => toNumber(d?.[key]));
    return Math.max(1, ...arr);
  }, [props.chartData, props.dataKey]);

  const yTop = Math.ceil(max * 1.12);

  // try to parse number from props.number if it's string like "1200"
  const mainNumber =
    typeof props.number === "number"
      ? props.number
      : Number(String(props.number ?? "").replace(/,/g, "")) || 0;

  return (
    <Card
      className={[
        "group relative h-full overflow-visible rounded-2xl border",
        "border border-border/60 bg-gradient-to-b from-background to-muted/20",
        "shadow-sm transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-lg hover:border-border",
      ].join(" ")}
    >
      {/* soft glow */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full blur-3xl opacity-25 transition-opacity duration-300 group-hover:opacity-35"
        style={{ background: preset.glow }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full blur-3xl opacity-15"
        style={{ background: preset.glow }}
      />

      {/* subtle noise layer (optional aesthetic) */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:radial-gradient(#000_1px,transparent_1px)] [background-size:14px_14px] dark:opacity-[0.06]" />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold tracking-wide">
              {props.title}
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Mini trend for recent days
            </CardDescription>
          </div>

          <Badge
            variant="secondary"
            className={[
              "gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[11px]",
              "backdrop-blur supports-[backdrop-filter]:bg-background/40",
              isPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400",
            ].join(" ")}
          >
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span className="tabular-nums">
              {isPositive ? "+" : ""}
              {props.percentage}%
            </span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <div className="text-2xl font-semibold leading-none tabular-nums">
              {typeof props.number === "string"
                ? props.number
                : mainNumber.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Total ·{" "}
              <span className="tabular-nums">{niceCompact(mainNumber)}</span>
            </div>
          </div>

          {/* chart */}
          <div className="h-16 w-[58%]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={props.chartData}
                margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={preset.stroke}
                      stopOpacity={0.95}
                    />
                    <stop
                      offset="75%"
                      stopColor={preset.stroke}
                      stopOpacity={0.18}
                    />
                    <stop
                      offset="100%"
                      stopColor={preset.stroke}
                      stopOpacity={0.06}
                    />
                  </linearGradient>

                  {/* optional stroke glow */}
                  <filter
                    id={`${gid}-shadow`}
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feGaussianBlur stdDeviation="2.2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <CartesianGrid
                  vertical={false}
                  stroke="hsl(var(--muted-foreground) / 0.14)"
                />

                <XAxis dataKey="name" hide />
                <YAxis hide domain={[0, yTop]} />

                {/* <Tooltip cursor={false} content={<CustomMiniTooltip />} /> */}
                <Tooltip
                  cursor={false}
                  content={<CustomMiniTooltip />}
                  wrapperStyle={{ zIndex: 9999 }}
                  allowEscapeViewBox={{ x: true, y: true }}
                />

                {/* glow stroke behind */}
                <Area
                  type="monotone"
                  dataKey={props.dataKey ?? "value"}
                  stroke={preset.stroke}
                  fill="transparent"
                  strokeWidth={4}
                  opacity={0.18}
                  dot={false}
                  activeDot={false as any}
                />

                <Area
                  type="monotone"
                  dataKey={props.dataKey ?? "value"}
                  stroke={preset.stroke}
                  fill={`url(#${gid})`}
                  strokeWidth={2}
                  filter={`url(#${gid}-shadow)`}
                  fillOpacity={1}
                  dot={false}
                  activeDot={{ r: 3.5, strokeWidth: 0, fill: preset.stroke }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
