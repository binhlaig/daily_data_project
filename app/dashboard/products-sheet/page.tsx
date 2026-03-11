"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { GripVertical, Plus, Trash2, Pencil } from "lucide-react";

type Row = {
  id: string;
  values: Record<string, string>;
};

const STORAGE = "binhlaig_dynamic_sheet_v2";

function safeUUID() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now());
}

function SortableColumnHead({
  id,
  onRename,
  onDelete,
}: {
  id: string;
  onRename: (col: string) => void;
  onDelete: (col: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <TableHead ref={setNodeRef} style={style} className="whitespace-nowrap">
      <div className="flex items-center gap-2">
        {/* Drag handle (ဒီ icon ကိုဆွဲပြီး reorder) */}
        <button
          type="button"
          className="inline-flex items-center rounded-md p-1 hover:bg-muted"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        <span className="font-medium">{id}</span>

        <button
          type="button"
          className="inline-flex items-center rounded-md p-1 hover:bg-muted"
          title="Rename"
          onClick={() => onRename(id)}
        >
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </button>

        <button
          type="button"
          className="inline-flex items-center rounded-md p-1 hover:bg-destructive/10"
          title="Delete column"
          onClick={() => onDelete(id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </button>
      </div>
    </TableHead>
  );
}

export default function Page() {
  const [columns, setColumns] = useState<string[]>(["Name", "Price", "Stock"]);
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<{ id: string; col: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // load
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        if (Array.isArray(d.columns)) setColumns(d.columns);
        if (Array.isArray(d.rows)) setRows(d.rows);
        return;
      } catch {}
    }
    // demo
    setRows([
      { id: "1", values: { Name: "Rice", Price: "2000", Stock: "12" } },
      { id: "2", values: { Name: "Oil", Price: "3500", Stock: "5" } },
    ]);
  }, []);

  // save
  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify({ columns, rows }));
  }, [columns, rows]);

  const filteredRows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const joined = columns.map((c) => r.values[c] ?? "").join(" ").toLowerCase();
      return joined.includes(s);
    });
  }, [rows, q, columns]);

  // add column
  const addColumn = () => {
    const name = prompt("Column name?");
    if (!name) return;
    const col = name.trim();
    if (!col) return;

    if (columns.includes(col)) {
      toast.error("Column already exists");
      return;
    }

    setColumns((c) => [...c, col]);
    setRows((r) => r.map((x) => ({ ...x, values: { ...x.values, [col]: "" } })));
    toast.success("Column added");
  };

  // rename column
  const renameColumn = (old: string) => {
    const name = prompt("Rename column", old);
    if (!name) return;
    const col = name.trim();
    if (!col || col === old) return;

    if (columns.includes(col)) {
      toast.error("Same name exists");
      return;
    }

    setColumns((c) => c.map((x) => (x === old ? col : x)));
    setRows((r) =>
      r.map((row) => {
        const v = { ...row.values };
        v[col] = v[old] ?? "";
        delete v[old];
        return { ...row, values: v };
      })
    );
    toast.success("Renamed");
  };

  // delete column
  const deleteColumn = (col: string) => {
    if (!confirm(`Delete column "${col}" ?`)) return;

    setColumns((c) => c.filter((x) => x !== col));
    setRows((r) =>
      r.map((row) => {
        const v = { ...row.values };
        delete v[col];
        return { ...row, values: v };
      })
    );
    toast.success("Column deleted");
  };

  // add row
  const addRow = () => {
    const v: Record<string, string> = {};
    columns.forEach((c) => (v[c] = ""));
    setRows((r) => [...r, { id: safeUUID(), values: v }]);
    toast.success("Row added");
  };

  // edit cell
  const startEdit = (id: string, col: string, val: string) => {
    setEditing({ id, col });
    setDraft(val ?? "");
  };

  const commit = () => {
    if (!editing) return;
    setRows((prev) =>
      prev.map((r) =>
        r.id !== editing.id
          ? r
          : { ...r, values: { ...r.values, [editing.col]: draft } }
      )
    );
    setEditing(null);
    setDraft("");
    toast.success("Saved ✅");
  };

  const cancel = () => {
    setEditing(null);
    setDraft("");
    toast("Canceled");
  };

  // ✅ Drag reorder columns
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const from = columns.indexOf(String(active.id));
    const to = columns.indexOf(String(over.id));
    if (from === -1 || to === -1 || from === to) return;

    setColumns((cols) => arrayMove(cols, from, to));
    toast.success("Column order updated");
  };

  const clearAll = () => {
    if (!confirm("Clear all local data?")) return;
    localStorage.removeItem(STORAGE);
    setRows([]);
    setColumns(["Name", "Price", "Stock"]);
    setEditing(null);
    setDraft("");
    toast.success("Storage cleared");
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <Button onClick={addRow} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Add Row
          </Button>
          <Button onClick={addColumn} variant="outline" className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Add Column
          </Button>
          <Button onClick={clearAll} variant="outline" className="rounded-xl">
            Clear
          </Button>
        </div>

        <div className="w-full md:w-[280px]">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Column header ရဲ့ <span className="font-medium">drag icon</span> (⋮⋮) ကိုဆွဲပြီး reorder လုပ်နိုင်ပါတယ်။
      </div>

      <div className="border rounded-2xl overflow-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <SortableContext
                  items={columns}
                  strategy={horizontalListSortingStrategy}
                >
                  {columns.map((col) => (
                    <SortableColumnHead
                      key={col}
                      id={col}
                      onRename={renameColumn}
                      onDelete={deleteColumn}
                    />
                  ))}
                </SortableContext>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/40">
                  {columns.map((col) => {
                    const isEditing = editing?.id === row.id && editing?.col === col;

                    return (
                      <TableCell key={col} className="align-middle">
                        {isEditing ? (
                          <Input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={commit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                commit();
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                cancel();
                              }
                            }}
                            className="h-9 rounded-xl"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(row.id, col, row.values[col] ?? "")}
                            className="w-full text-left rounded-xl px-2 py-1 hover:bg-muted"
                            title="Click to edit"
                          >
                            {row.values[col] ?? ""}
                          </button>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}

              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No data
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>
    </div>
  );
}