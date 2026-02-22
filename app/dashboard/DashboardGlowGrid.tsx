// "use client";

// import React from "react";
// import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";
// import { GlowingEffect } from "@/components/ui/glowing-effect";
// import { cn } from "@/lib/utils";

// function formatJPY(n: number) {
//   return new Intl.NumberFormat("ja-JP", {
//     style: "currency",
//     currency: "JPY",
//     maximumFractionDigits: 0,
//   }).format(Number(n) || 0);
// }

// export default function DashboardGlowGrid({
//   incomeTotal,
//   outcomeTotal,
//   profit,
// }: {
//   incomeTotal: number;
//   outcomeTotal: number;
//   profit: number;
// }) {
//   return (
//     <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
//       <GridItem
//         icon={<TrendingUp className="h-4 w-4 text-black dark:text-neutral-400" />}
//         title="Income"
//         description={
//           <>
//             <div className="text-2xl font-semibold tabular-nums">
//               {formatJPY(incomeTotal)}
//             </div>
//             <div className="text-sm text-neutral-600 dark:text-neutral-400">
//               Total income
//             </div>
//           </>
//         }
//       />

//       <GridItem
//         icon={<TrendingDown className="h-4 w-4 text-black dark:text-neutral-400" />}
//         title="Outcome"
//         description={
//           <>
//             <div className="text-2xl font-semibold tabular-nums">
//               {formatJPY(outcomeTotal)}
//             </div>
//             <div className="text-sm text-neutral-600 dark:text-neutral-400">
//               Total expenses
//             </div>
//           </>
//         }
//       />

//       <GridItem
//         icon={<Sparkles className="h-4 w-4 text-black dark:text-neutral-400" />}
//         title="Profit"
//         description={
//           <>
//             <div
//               className={cn(
//                 "text-2xl font-semibold tabular-nums",
//                 profit > 0
//                   ? "text-emerald-600 dark:text-emerald-400"
//                   : profit < 0
//                   ? "text-rose-600 dark:text-rose-400"
//                   : ""
//               )}
//             >
//               {formatJPY(profit)}
//             </div>
//             <div className="text-sm text-neutral-600 dark:text-neutral-400">
//               Income − Outcome
//             </div>
//           </>
//         }
//       />
//     </ul>
//   );
// }

// function GridItem({
//   icon,
//   title,
//   description,
// }: {
//   icon: React.ReactNode;
//   title: string;
//   description: React.ReactNode;
// }) {
//   return (
//     <li className="list-none min-h-[160px]">
//       <div className="relative h-full rounded-2xl border border-border/70 bg-background/50 p-2 overflow-hidden">
//         <GlowingEffect
//           spread={34}
//           glow
//           disabled={false}
//           proximity={50}
//           inactiveZone={0.1}
//           blur={8}
//           borderWidth={1}
//         />

//         <div className="relative flex h-full flex-col justify-between gap-3 rounded-xl p-6">
//           <div className="w-fit rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/40 dark:bg-neutral-900/40 p-2">
//             {icon}
//           </div>

//           <div className="space-y-2">
//             <h3 className="text-lg font-semibold">{title}</h3>
//             <div className="text-base">{description}</div>
//           </div>
//         </div>
//       </div>
//     </li>
//   );
// }







"use client";

import React, { useMemo, useState } from "react";
import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

type RangeKey = "today" | "month" | "total";

function formatJPY(n: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function rangeLabel(r: RangeKey) {
  if (r === "today") return "Today";
  if (r === "month") return "This Month";
  return "Total";
}

export default function DashboardGlowGrid({
  // totals
  incomeTotal,
  outcomeTotal,
  profitTotal,

  // optional: today
  incomeToday,
  outcomeToday,
  profitToday,

  // optional: month
  incomeMonth,
  outcomeMonth,
  profitMonth,

  defaultRange = "today",
}: {
  incomeTotal: number;
  outcomeTotal: number;
  profitTotal: number;

  incomeToday?: number;
  outcomeToday?: number;
  profitToday?: number;

  incomeMonth?: number;
  outcomeMonth?: number;
  profitMonth?: number;

  defaultRange?: RangeKey;
}) {
  const [range, setRange] = useState<RangeKey>(defaultRange);

  const data = useMemo(() => {
    const pick = <T extends number | undefined>(
      today: T,
      month: T,
      total: number
    ) => {
      if (range === "today") return today ?? total;
      if (range === "month") return month ?? total;
      return total;
    };

    const income = pick(incomeToday, incomeMonth, incomeTotal);
    const outcome = pick(outcomeToday, outcomeMonth, outcomeTotal);

    const profit =
      range === "today"
        ? profitToday ?? income - outcome
        : range === "month"
        ? profitMonth ?? income - outcome
        : profitTotal;

    return { income, outcome, profit };
  }, [
    range,
    incomeToday,
    incomeMonth,
    incomeTotal,
    outcomeToday,
    outcomeMonth,
    outcomeTotal,
    profitToday,
    profitMonth,
    profitTotal,
  ]);

  return (
    <div className="space-y-4">
      {/* ✅ Range Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          Overview <span className="text-muted-foreground">• {rangeLabel(range)}</span>
        </div>

        <div className="inline-flex items-center rounded-xl border border-border/70 bg-background/60 p-1">
          <ToggleBtn active={range === "today"} onClick={() => setRange("today")}>
            Today
          </ToggleBtn>
          <ToggleBtn active={range === "month"} onClick={() => setRange("month")}>
            Month
          </ToggleBtn>
          <ToggleBtn active={range === "total"} onClick={() => setRange("total")}>
            Total
          </ToggleBtn>
        </div>
      </div>

      {/* ✅ 3 Glow Cards */}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GridItem
          icon={<TrendingUp className="h-4 w-4 text-black dark:text-neutral-400" />}
          title="Income"
          subtitle={rangeLabel(range)}
          value={formatJPY(data.income)}
          note="Total income"
        />

        <GridItem
          icon={<TrendingDown className="h-4 w-4 text-black dark:text-neutral-400" />}
          title="Outcome"
          subtitle={rangeLabel(range)}
          value={formatJPY(data.outcome)}
          note="Total expenses"
        />

        <GridItem
          icon={<Sparkles className="h-4 w-4 text-black dark:text-neutral-400" />}
          title="Profit"
          subtitle={rangeLabel(range)}
          value={formatJPY(data.profit)}
          note="Income − Outcome"
          tone={
            data.profit > 0
              ? "positive"
              : data.profit < 0
              ? "negative"
              : "neutral"
          }
        />
      </ul>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs rounded-lg transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
      )}
    >
      {children}
    </button>
  );
}

function GridItem({
  icon,
  title,
  subtitle,
  value,
  note,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: string;
  note: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  return (
    <li className="list-none min-h-[160px]">
      <div className="relative h-full rounded-2xl border border-border/70 bg-background/50 p-2 overflow-hidden">
        <GlowingEffect
          spread={34}
          glow
          disabled={false}
          proximity={50}
          inactiveZone={0.1}
          blur={8}
          borderWidth={1}
        />

        <div className="relative flex h-full flex-col justify-between gap-3 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="w-fit rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/40 dark:bg-neutral-900/40 p-2">
              {icon}
            </div>

            <span className="text-xs text-muted-foreground">{subtitle}</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{title}</h3>

            <div
              className={cn(
                "text-2xl font-semibold tabular-nums",
                tone === "positive" && "text-emerald-600 dark:text-emerald-400",
                tone === "negative" && "text-rose-600 dark:text-rose-400"
              )}
            >
              {value}
            </div>

            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {note}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
