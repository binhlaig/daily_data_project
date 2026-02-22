// "use client";

// import React, { useMemo, useState } from "react";
// import { Trash2, Search } from "lucide-react";


// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { OutcomeRow } from "@/lib/data/outcome";

// function formatJPY(n: number) {
//   return new Intl.NumberFormat("ja-JP", {
//     style: "currency",
//     currency: "JPY",
//     maximumFractionDigits: 0,
//   }).format(Number(n) || 0);
// }

// function formatDate(iso?: string) {
//   if (!iso) return "—";
//   const d = new Date(iso);
//   return new Intl.DateTimeFormat("ja-JP", {
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   }).format(d);
// }

// export default function OutcomeTableClient({
//   initialRows,
// }: {
//   initialRows: OutcomeRow[];
// }) {
//   const [rows, setRows] = useState<OutcomeRow[]>(initialRows);
//   const [q, setQ] = useState("");

//   const filtered = useMemo(() => {
//     const s = q.trim().toLowerCase();
//     if (!s) return rows;
//     return rows.filter((r) => {
//       const hay = `${r.title ?? ""} ${r.note ?? ""} ${r.category ?? ""}`.toLowerCase();
//       return hay.includes(s);
//     });
//   }, [rows, q]);

//   const total = useMemo(
//     () => filtered.reduce((acc, r) => acc + Number(r.amount || 0), 0),
//     [filtered]
//   );

//   async function onDelete(id: string) {
//     const ok = confirm("Delete this outcome?");
//     if (!ok) return;

//     const res = await fetch(`/api/outcome/${id}`, { method: "DELETE" });
//     if (res.ok) {
//       setRows((prev) => prev.filter((r) => r._id !== id));
//     } else {
//       alert("Delete failed");
//     }
//   }

//   return (
//     <Card className="rounded-xl border-border/60 bg-background/60">
//       <CardHeader className="pb-2">
//         <div className="flex items-center justify-between gap-3">
//           <CardTitle className="text-sm">Outcome Table</CardTitle>
//           <Badge variant="secondary" className="rounded-full">
//             Total: {formatJPY(total)}
//           </Badge>
//         </div>

//         <div className="mt-3 flex items-center gap-2">
//           <div className="relative w-full max-w-sm">
//             <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
//             <Input
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//               placeholder="Search outcome..."
//               className="pl-8"
//             />
//           </div>
//         </div>
//       </CardHeader>

//       <CardContent className="overflow-x-auto">
//         <table className="w-full text-sm">
//           <thead className="text-muted-foreground">
//             <tr className="border-b">
//               <th className="py-3 text-left font-medium">Date</th>
//               <th className="py-3 text-left font-medium">Title</th>
//               <th className="py-3 text-left font-medium">Category</th>
//               <th className="py-3 text-left font-medium">Note</th>
//               <th className="py-3 text-right font-medium">Amount</th>
//               <th className="py-3 text-right font-medium">Action</th>
//             </tr>
//           </thead>

//           <tbody>
//             {filtered.length === 0 ? (
//               <tr>
//                 <td colSpan={6} className="py-10 text-center text-muted-foreground">
//                   No outcome data.
//                 </td>
//               </tr>
//             ) : (
//               filtered.map((r) => (
//                 <tr key={r._id} className="border-b last:border-b-0">
//                   <td className="py-3 whitespace-nowrap">{formatDate(r.createdAt)}</td>
//                   <td className="py-3 min-w-[180px]">{r.title}</td>
//                   <td className="py-3">
//                     <Badge variant="outline" className="rounded-full">
//                       {r.category ?? "General"}
//                     </Badge>
//                   </td>
//                   <td className="py-3 min-w-[240px] text-muted-foreground">
//                     {r.note || "—"}
//                   </td>
//                   <td className="py-3 text-right font-semibold tabular-nums">
//                     {formatJPY(r.amount)}
//                   </td>
//                   <td className="py-3 text-right">
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       onClick={() => onDelete(r._id)}
//                       className="rounded-xl"
//                     >
//                       <Trash2 className="h-4 w-4" />
//                     </Button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </CardContent>
//     </Card>
//   );
// }





"use client";

import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTable } from "./outcom_data_table";
import { columns } from "./outcome_colunm";

type OutcomeRow = {
  _id: string;
  amount?: number;
  shop?: string;
  bank?: string;
  notice?: string;
  date?: string | null;     // ISO string
  createdAt?: string | null;
};

type FilterKey = "all" | "today" | "month";

function isoDayKey(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10); // yyyy-mm-dd
}

export default function OutcomeTableClient({ rows }: { rows: OutcomeRow[] }) {
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

      // this month
      const d = new Date(key);
      return d.getFullYear() === yyyy && d.getMonth() === mm;
    });
  }, [rows, filter]);

  const total = useMemo(
    () => filtered.reduce((s, r) => s + (Number(r.amount) || 0), 0),
    [filtered]
  );

  const yen = (n: number) =>
    `¥ ${new Intl.NumberFormat("ja-JP").format(Math.round(n || 0))}`;

  return (
    <div className="space-y-3">
      {/* ✅ Quick chips row */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setFilter("all")}
          className={cn(
            "h-8 rounded-full bg-background/40 backdrop-blur",
            filter === "all" && "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
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
            filter === "today" && "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
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
            filter === "month" && "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
          )}
        >
          This month
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            Records: <span className="ml-1 font-semibold">{filtered.length}</span>
          </Badge>
          <Badge variant="secondary" className="rounded-full">
            Total: <span className="ml-1 font-semibold">{yen(total)}</span>
          </Badge>
        </div>
      </div>

      {/* ✅ Table */}
      <DataTable
        columns={columns as any}
        data={filtered as any}
        searchKey="shop"
        theme="outcome"
      />
    </div>
  );
}
