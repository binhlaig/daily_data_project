// "use client";

// import React, { useMemo, useState } from "react";

// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";
// import { DataTable } from "../outcome/outcom_data_table";
// import { incomeColumns } from "@/lib/mongoDB/IncomeColumn";

// type IncomeRow = {
//   _id: string;
//   amount?: number;
//   shop?: string;
//   bank?: string;
//   notice?: string;
//   date?: string | null;
//   createdAt?: string | null;
// };

// type Filter = "all" | "today" | "month";

// function dayKey(iso?: string | null) {
//   if (!iso) return null;
//   const d = new Date(iso);
//   if (isNaN(d.getTime())) return null;
//   return d.toISOString().slice(0, 10);
// }

// export default function IncomeTableClient({ rows }: { rows: IncomeRow[] }) {

//   const [filter, setFilter] = useState<Filter>("all");

//   const filtered = useMemo(() => {

//     if (filter === "all") return rows;

//     const now = new Date();
//     const today = now.toISOString().slice(0, 10);
//     const yyyy = now.getFullYear();
//     const mm = now.getMonth();

//     return rows.filter(r => {

//       const key = dayKey(r.date);
//       if (!key) return false;

//       if (filter === "today") return key === today;

//       const d = new Date(key);
//       return d.getFullYear() === yyyy && d.getMonth() === mm;

//     });

//   }, [rows, filter]);

//   const total = filtered.reduce(
//     (s, r) => s + (Number(r.amount) || 0),
//     0
//   );

//   const yen = (n:number)=>`¥ ${new Intl.NumberFormat("ja-JP").format(n)}`;

//   return (
//     <div className="space-y-3">

//       {/* FILTER CHIPS */}
//       <div className="flex flex-wrap items-center gap-2">

//         <Button variant="outline" onClick={()=>setFilter("all")}
//         className={cn("rounded-full", filter==="all" && "bg-emerald-500/10 border-emerald-400")}>
//           All
//         </Button>

//         <Button variant="outline" onClick={()=>setFilter("today")}
//         className={cn("rounded-full", filter==="today" && "bg-emerald-500/10 border-emerald-400")}>
//           Today
//         </Button>

//         <Button variant="outline" onClick={()=>setFilter("month")}
//         className={cn("rounded-full", filter==="month" && "bg-emerald-500/10 border-emerald-400")}>
//           This month
//         </Button>

//         <div className="ml-auto flex gap-2">

//           <Badge variant="secondary" className="rounded-full">
//             Records {filtered.length}
//           </Badge>

//           <Badge variant="secondary" className="rounded-full">
//             Total {yen(total)}
//           </Badge>

//         </div>

//       </div>

//       {/* TABLE */}
//       <DataTable
//         columns={incomeColumns as any}
//         data={filtered as any}
//         searchKey="shop"
//         theme="income"
//       />

//     </div>
//   );
// }




"use client";

import React, { useMemo, useState } from "react";


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTable } from "../outcome/outcom_data_table";
import { IncomeColumns } from "./IncomeColumn";

type IncomeRow = {
  _id: string;
  amount?: number;
  company?: string;
  bank?: string;
  notice?: string;
  date?: string | null; // ISO string
  createdAt?: string | null;
  month?: string;
};

type FilterKey = "all" | "today" | "month";

function isoDayKey(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

const yen = (n: number) =>
  `¥ ${new Intl.NumberFormat("ja-JP").format(Math.round(n || 0))}`;

export default function IncomeTableClient({ rows }: { rows: IncomeRow[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return rows;

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const yyyy = now.getFullYear();
    const mm = now.getMonth();

    return rows.filter((r) => {
      const key = isoDayKey(r.date);
      if (!key) return false;

      if (filter === "today") return key === todayKey;

      const d = new Date(key);
      return d.getFullYear() === yyyy && d.getMonth() === mm;
    });
  }, [rows, filter]);

  const total = useMemo(
    () => filtered.reduce((s, r) => s + (Number(r.amount) || 0), 0),
    [filtered]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setFilter("all")}
          className={cn(
            "h-8 rounded-full bg-background/40 backdrop-blur",
            filter === "all" &&
              "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          )}
        >
          All
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setFilter("today")}
          className={cn(
            "h-8 rounded-full bg-background/40 backdrop-blur",
            filter === "today" &&
              "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          )}
        >
          Today
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setFilter("month")}
          className={cn(
            "h-8 rounded-full bg-background/40 backdrop-blur",
            filter === "month" &&
              "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          )}
        >
          This month
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            Records:{" "}
            <span className="ml-1 font-semibold">{filtered.length}</span>
          </Badge>

          <Badge variant="secondary" className="rounded-full">
            Total: <span className="ml-1 font-semibold">{yen(total)}</span>
          </Badge>
        </div>
      </div>

      <DataTable
        columns={IncomeColumns as any}
        data={filtered as any}
        searchKey="company" // ✅ company search
        theme="income"
      />
    </div>
  );
}
