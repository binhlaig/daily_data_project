


"use client";

import dayjs from "dayjs";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowUpDown, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Delete_In from "./Delete_In";

const yen = (n: any) =>
  `¥ ${new Intl.NumberFormat("ja-JP").format(Number(n ?? 0) || 0)}`;

export const IncomeColumns: ColumnDef<IncomeType>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const d = row.original.date;
      return (
        <Badge
          variant="secondary"
          className="rounded-full bg-background/40 backdrop-blur border border-border/60"
        >
          {d ? dayjs(d).format("DD-MM-YYYY") : "-"}
        </Badge>
      );
    },
  },

  {
    accessorKey: "month",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-2 rounded-full hover:bg-emerald-500/10"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Month <ArrowUpDown className="ml-2 h-4 w-4 opacity-70" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-sm font-medium text-foreground/90">
        {row.original.month ?? "-"}
      </div>
    ),
  },

  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-2 rounded-full hover:bg-emerald-500/10"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Amount <ArrowUpDown className="ml-2 h-4 w-4 opacity-70" />
      </Button>
    ),
    cell: ({ row }) => {
      const v = row.original.amount as any;
      return (
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 transition"
        >
          {yen(v)}
        </Link>
      );
    },
  },

  // ✅ IMPORTANT: compamy -> company (searchKey="company" matches)
  {
    accessorKey: "compamy",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-2 rounded-full hover:bg-emerald-500/10"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Company <ArrowUpDown className="ml-2 h-4 w-4 opacity-70" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="max-w-[240px] truncate text-sm font-medium">
        {row.original.compamy ?? "-"}
      </div>
    ),
  },

  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const c = row.original.createdAt;
      return (
        <div className="text-xs text-muted-foreground">
          {c ? dayjs(c).format("DD-MM-YYYY • HH:mm:ss") : "-"}
        </div>
      );
    },
  },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const id = row.original._id;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 w-9 rounded-full border border-border/60 bg-background/40 backdrop-blur p-0 hover:bg-background/60"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-44 rounded-xl border-border/60 bg-background/70 backdrop-blur"
          >
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
              // ✅ Delete_In is a component; keep it but wrap click area nicely
              onSelect={(e) => e.preventDefault()}
            >
              <Trash2 className="h-4 w-4" />
              <span className="flex-1">Delete</span>
              <span className="ml-auto">
                <Delete_In id={id} />
               
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer text-muted-foreground">
              Suspend (placeholder)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

