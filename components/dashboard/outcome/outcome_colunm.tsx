"use client";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import dayjs from "dayjs";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Delete_Out from "@/components/Form/Delete_Out";


export const columns: ColumnDef<OutComeType>[] = [
  {
    accessorKey: "date",

    header: "Date",
    cell: ({ row }) => (
      <div>{dayjs(row.original.date).format("DD-MM-YYYY")}</div>
    ),
  },
  {
    accessorKey: "shop",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Shop
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <Link href="/" className="hover:text-red-600">
        {row.original.amount} ¥
      </Link>
    ),
  },
  {
    accessorKey: "bank",
    header: "Bank",
  },
  {
    accessorKey: "notice",
    header: "Notice",
  },

  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <div>{dayjs(row.original.createdAt).format("DD-MM-YYYY : HH:mm:ss")}</div>
    ),
  },
  {
    header: "Actions",
    cell: ({ row }) => {
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
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>
              <>
                <Delete_Out id={row.original._id} /> &nbsp;
                <span className="text-sm text-red-700">Delete</span>
              </>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              Suspend User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
