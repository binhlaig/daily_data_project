"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  VisibilityState,
  SortingState,
} from "@tanstack/react-table";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader, 
  TableRow,
} from "@/components/ui/table";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "@/components/table/DataTablePagination";

type Theme = "income" | "outcome";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey: string;
  theme?: Theme;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  theme = "outcome",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnFilters, columnVisibility },
  });


  // ✅ Theme styles
  const themeGlow = theme === "income" ? "bg-emerald-500/20" : "bg-rose-500/22";
  const themeGlow2 =
    theme === "income" ? "bg-emerald-400/12" : "bg-rose-500/14";
  const hoverRow =
    theme === "income" ? "hover:bg-emerald-500/5" : "hover:bg-rose-500/5";

  // ✅ safer searchKey resolving
  const columnIds = useMemo(() => table.getAllColumns().map((c) => c.id), [
    table,
  ]);

  const resolvedSearchKey = useMemo(() => {
    if (columnIds.includes(searchKey)) return searchKey;
    const fallback = table
      .getAllColumns()
      .find((c) => c.getCanFilter() && c.getIsVisible());
    return fallback?.id ?? "";
  }, [columnIds, searchKey, table]);

  const filterValue = useMemo(() => {
    const f = columnFilters.find((x) => x.id === resolvedSearchKey);
    return (f?.value as string) ?? "";
  }, [columnFilters, resolvedSearchKey]);

  return (
    <div className="space-y-4">
      {/* 🔍 Search + View */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={
              resolvedSearchKey
                ? `Search ${resolvedSearchKey}...`
                : "Search disabled"
            }
            value={filterValue}
            disabled={!resolvedSearchKey}
            onChange={(e) => {
              if (!resolvedSearchKey) return;
              const v = e.target.value;
              setColumnFilters((prev) => {
                const next = prev.filter((x) => x.id !== resolvedSearchKey);
                if (!v) return next;
                return [...next, { id: resolvedSearchKey, value: v }];
              });
            }}
            // className="pl-9 shadow-sm border border-border/60 bg-background/40 backdrop-blur p-0 hover:bg-background/60"
            className={cn(
              "pl-9",
              // ✅ avoid harsh borders
              "shadow-sm border border-border/60 bg-background/40 backdrop-blur hover:bg-background/60",
              "dark:ring-white/10 dark:focus-visible:ring-white/20 ",
              !resolvedSearchKey && "opacity-60"
            )}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "gap-2 rounded-full",
                "border-0 bg-background/40 backdrop-blur shadow-sm",
                "ring-1 ring-black/5 dark:ring-white/10"
              )}
            >
              
              View
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="rounded-xl backdrop-blur">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(v) => column.toggleVisibility(!!v)}
                  className="capitalize"
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ✅ Table Card (NO white border line) */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl",
          // ✅ remove border that causes white-line
          "border-0 shadow-lg",
          // ✅ soft outline instead of border
          "ring-1 ring-black/5 dark:ring-white/10",
          // ✅ keep your gradient background
          "bg-gradient-to-b from-background to-muted/20"
        )}
      >
        {/* glow blobs */}
        <div
          className={cn(
            "pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full blur-3xl",
            themeGlow
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute -bottom-28 -left-28 h-60 w-60 rounded-full blur-3xl",
            themeGlow2
          )}
        />

        <Table>
          {/* ✅ header line softened (no border-b harsh) */}
          <TableHeader className="sticky top-0 z-10 backdrop-blur bg-background/70">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="border-0">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "text-xs uppercase tracking-wide text-muted-foreground",
                      // ✅ subtle separator without white border
                      "border-0"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn("transition border-0", hoverRow)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "py-3 border-0",
                        // ✅ row separators softer (instead of table borders)
                        "shadow-[inset_0_-1px_0_rgba(0,0,0,0.04)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]"
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="border-0">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* ✅ Pagination bar (no border-t harsh) */}
        <div className="bg-background/50 backdrop-blur">
          <div className="h-px w-full bg-black/5 dark:bg-white/10" />
          <DataTablePagination table={table} />
        </div>
      </div>
    </div>
  );
}
