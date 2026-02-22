"use client";

import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";

export const incomeColumns: ColumnDef<any>[] = [

{
  accessorKey:"date",
  header:"Date",
  cell:({row})=>(
    <div>{dayjs(row.original.date).format("DD-MM-YYYY")}</div>
  )
},

{ accessorKey:"shop", header:"Shop" },

{
  accessorKey:"amount",
  header:"Amount",
  cell:({row})=>(
    <span className="text-emerald-600 font-medium">
      {row.original.amount} ¥
    </span>
  )
},

{ accessorKey:"bank", header:"Bank" },
{ accessorKey:"notice", header:"Notice" },

{
  accessorKey:"createdAt",
  header:"Created",
  cell:({row})=>(
    <div>{dayjs(row.original.createdAt).format("DD-MM-YYYY HH:mm")}</div>
  )
},

];

