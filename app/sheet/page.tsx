
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import ExcelJS from "exceljs";

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

import {
  GripVertical,
  Plus,
  Trash2,
  Pencil,
  PaintBucket,
  Type,
  Eraser,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Square,
  Settings2,
  Sigma,
  FunctionSquare,
  Calculator,
  FileSpreadsheet,
  Link2,
  Save,
  RefreshCcw,
  Unlink,
  Download,
  FileText,
  Upload,
  FolderOpen,
  BarChart3,
  Database,
  LineChart as LineChartIcon,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

import {
  saveHandle,
  loadHandle,
  clearHandle,
  ensurePermission,
} from "@/lib/sheetFileHandle";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

/* ---------------- Types ---------------- */

type Row = { id: string; values: Record<string, string> };

type TextAlign = "left" | "center" | "right";
type CellStyle = {
  bg?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  align?: TextAlign;
  border?: boolean;
  fontSize?: number;
};
type CellStyleMap = Record<string, CellStyle>;
type FormulaMap = Record<string, string>;
type LinkedFileKind = "xlsx" | "csv" | null;
type ChartMetric = "sum" | "avg" | "min" | "max";

const STORAGE = "binhlaig_dynamic_sheet_v12_simple_collapsible";

/* ---------------- Utils ---------------- */

function safeUUID() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function cellKey(rowId: string, col: string) {
  return `${rowId}::${col}`;
}

function toColLetters(idx: number) {
  let n = idx + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function fromColLetters(s: string) {
  const up = s.toUpperCase();
  let n = 0;
  for (let i = 0; i < up.length; i++) {
    const c = up.charCodeAt(i);
    if (c < 65 || c > 90) return -1;
    n = n * 26 + (c - 64);
  }
  return n - 1;
}

function detectFileKindFromName(name?: string | null): LinkedFileKind {
  const lower = String(name ?? "").toLowerCase();
  if (lower.endsWith(".xlsx")) return "xlsx";
  if (lower.endsWith(".csv")) return "csv";
  return null;
}

function formatNumber(n: number) {
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat().format(
    Number.isInteger(n) ? n : Number(n.toFixed(3))
  );
}

function toNumberLoose(value: string | number | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const cleaned = raw
    .replace(/,/g, "")
    .replace(/[￥¥$€£₩฿₮₭]/g, "")
    .replace(/\s+/g, "");

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const FILL_SWATCH = [
  "#ffffff",
  "#fef3c7",
  "#dcfce7",
  "#dbeafe",
  "#fae8ff",
  "#ffe4e6",
  "#e5e7eb",
  "#111827",
];

const TEXT_SWATCH = [
  "#111827",
  "#ffffff",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#6b7280",
];

/* ---------------- Small UI helpers ---------------- */

function CollapseSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && <div className="border-t px-4 py-4">{children}</div>}
    </div>
  );
}

function SortableColumnHead({
  id,
  colIndex,
  onRename,
  onDelete,
}: {
  id: string;
  colIndex: number;
  onRename: (col: string) => void;
  onDelete: (col: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <TableHead ref={setNodeRef} style={style} className="whitespace-nowrap">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center rounded-md p-1 hover:bg-muted"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        <span className="text-[10px] text-muted-foreground tabular-nums">
          {toColLetters(colIndex)}
        </span>

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

/* ---------------- Excel helpers ---------------- */

async function exportXlsxBuffer(columns: string[], rows: Row[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");

  ws.addRow(columns);
  ws.getRow(1).font = { bold: true };

  for (const r of rows) {
    ws.addRow(columns.map((c) => r.values?.[c] ?? ""));
  }

  columns.forEach((_, i) => {
    const col = ws.getColumn(i + 1);
    let maxLen = 10;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const v = cell.value ? String(cell.value) : "";
      maxLen = Math.max(maxLen, Math.min(50, v.length + 2));
    });
    col.width = maxLen;
  });

  return await wb.xlsx.writeBuffer();
}

async function parseXlsxToSheet(arrayBuffer: ArrayBuffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arrayBuffer);

  const ws = wb.worksheets[0];
  if (!ws) throw new Error("No worksheet found");

  const headerRow = ws.getRow(1);
  const columns: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell) => {
    const v = cell.value ? String(cell.value).trim() : "";
    if (v) columns.push(v);
  });

  if (columns.length === 0) throw new Error("Header row is empty");

  const rows: Row[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const values: Record<string, string> = {};
    let hasAny = false;

    for (let c = 1; c <= columns.length; c++) {
      const cell = row.getCell(c);

      const raw =
        cell.value &&
        typeof cell.value === "object" &&
        "result" in (cell.value as any)
          ? (cell.value as any).result
          : cell.value;

      const txt = raw == null ? "" : String(raw);
      if (txt.trim() !== "") hasAny = true;
      values[columns[c - 1]] = txt;
    }

    if (hasAny) rows.push({ id: safeUUID(), values });
  }

  return { columns, rows };
}

/* ---------------- CSV helpers ---------------- */

function escapeCsvValue(value: string) {
  const s = String(value ?? "");
  if (
    s.includes('"') ||
    s.includes(",") ||
    s.includes("\n") ||
    s.includes("\r")
  ) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function exportCsvText(columns: string[], rows: Row[]) {
  const lines: string[] = [];
  lines.push(columns.map(escapeCsvValue).join(","));

  for (const row of rows) {
    lines.push(
      columns.map((c) => escapeCsvValue(row.values?.[c] ?? "")).join(",")
    );
  }

  return lines.join("\r\n");
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let i = 0;
  let inQuotes = false;

  while (i < line.length) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cur += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === ",") {
      out.push(cur);
      cur = "";
      i++;
      continue;
    }

    cur += ch;
    i++;
  }

  out.push(cur);
  return out;
}

function parseCsvText(csvText: string) {
  const normalized = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rawLines = normalized.split("\n");

  const lines: string[] = [];
  let buffer = "";
  let quoteCount = 0;

  for (const part of rawLines) {
    if (buffer) buffer += "\n" + part;
    else buffer = part;

    quoteCount += (part.match(/"/g) || []).length;

    if (quoteCount % 2 === 0) {
      lines.push(buffer);
      buffer = "";
      quoteCount = 0;
    }
  }

  if (buffer) lines.push(buffer);

  const nonEmpty = lines.filter((x) => x.trim() !== "");
  if (!nonEmpty.length) throw new Error("CSV is empty");

  const header = parseCsvLine(nonEmpty[0]).map((x) => x.trim());
  const columns = header.filter((x) => x !== "");

  if (!columns.length) throw new Error("CSV header row is empty");

  const rows: Row[] = [];
  for (let i = 1; i < nonEmpty.length; i++) {
    const vals = parseCsvLine(nonEmpty[i]);
    const values: Record<string, string> = {};
    let hasAny = false;

    for (let c = 0; c < columns.length; c++) {
      const txt = String(vals[c] ?? "");
      if (txt.trim() !== "") hasAny = true;
      values[columns[c]] = txt;
    }

    if (hasAny) rows.push({ id: safeUUID(), values });
  }

  return { columns, rows };
}

/* ---------------- Formula Engine ---------------- */

type Token =
  | { t: "num"; v: number }
  | { t: "op"; v: "+" | "-" | "*" | "/" }
  | { t: "lpar" }
  | { t: "rpar" }
  | { t: "comma" }
  | { t: "name"; v: string }
  | { t: "cell"; col: number; row: number }
  | { t: "colon" };

function tokenizeFormula(src: string): Token[] {
  const s = src.trim();
  const out: Token[] = [];
  let i = 0;

  const isDigit = (ch: string) => ch >= "0" && ch <= "9";
  const isAlpha = (ch: string) =>
    (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z") || ch === "_";

  while (i < s.length) {
    const ch = s[i];

    if (ch === " " || ch === "\t" || ch === "\n") {
      i++;
      continue;
    }

    if (ch === "+" || ch === "-" || ch === "*" || ch === "/") {
      out.push({ t: "op", v: ch });
      i++;
      continue;
    }
    if (ch === "(") {
      out.push({ t: "lpar" });
      i++;
      continue;
    }
    if (ch === ")") {
      out.push({ t: "rpar" });
      i++;
      continue;
    }
    if (ch === ",") {
      out.push({ t: "comma" });
      i++;
      continue;
    }
    if (ch === ":") {
      out.push({ t: "colon" });
      i++;
      continue;
    }

    if (isDigit(ch) || (ch === "." && isDigit(s[i + 1] ?? ""))) {
      let j = i;
      while (j < s.length && (isDigit(s[j]) || s[j] === ".")) j++;
      const num = Number(s.slice(i, j));
      out.push({ t: "num", v: Number.isFinite(num) ? num : 0 });
      i = j;
      continue;
    }

    if (isAlpha(ch)) {
      let j = i;
      while (j < s.length && isAlpha(s[j])) j++;
      const letters = s.slice(i, j);

      let k = j;
      if (k < s.length && isDigit(s[k])) {
        while (k < s.length && isDigit(s[k])) k++;
        const rowStr = s.slice(j, k);
        const colIdx = fromColLetters(letters);
        const rowIdx = Number(rowStr) - 1;
        if (colIdx >= 0 && rowIdx >= 0)
          out.push({ t: "cell", col: colIdx, row: rowIdx });
        else out.push({ t: "name", v: letters.toUpperCase() });
        i = k;
        continue;
      }

      out.push({ t: "name", v: letters.toUpperCase() });
      i = j;
      continue;
    }

    i++;
  }

  return out;
}

function createParser(tokens: Token[], ctx: FormulaContext) {
  let p = 0;

  const peek = () => tokens[p];
  const eat = () => tokens[p++];

  function parseExpr(): number {
    let v = parseTerm();
    while (true) {
      const t = peek();
      if (t?.t === "op" && (t.v === "+" || t.v === "-")) {
        eat();
        const r = parseTerm();
        v = t.v === "+" ? v + r : v - r;
      } else break;
    }
    return v;
  }

  function parseTerm(): number {
    let v = parseFactor();
    while (true) {
      const t = peek();
      if (t?.t === "op" && (t.v === "*" || t.v === "/")) {
        eat();
        const r = parseFactor();
        v = t.v === "*" ? v * r : v / (r === 0 ? 1 : r);
      } else break;
    }
    return v;
  }

  function parseFactor(): number {
    const t = peek();
    if (!t) return 0;

    if (t.t === "op" && (t.v === "+" || t.v === "-")) {
      eat();
      const v = parseFactor();
      return t.v === "-" ? -v : v;
    }

    if (t.t === "num") {
      eat();
      return t.v;
    }

    if (t.t === "cell") {
      eat();
      return ctx.getCellNumber(t.row, t.col);
    }

    if (t.t === "name") {
      const name = t.v;
      eat();
      const lp = peek();
      if (!lp || lp.t !== "lpar") return 0;
      eat();
      const args: ArgValue[] = [];
      if (peek() && peek()!.t !== "rpar") {
        while (true) {
          args.push(parseArg());
          if (peek()?.t === "comma") {
            eat();
            continue;
          }
          break;
        }
      }
      if (peek()?.t === "rpar") eat();

      return ctx.applyFunc(name, args);
    }

    if (t.t === "lpar") {
      eat();
      const v = parseExpr();
      if (peek()?.t === "rpar") eat();
      return v;
    }

    eat();
    return 0;
  }

  type ArgValue =
    | { kind: "num"; v: number }
    | { kind: "range"; r1: number; c1: number; r2: number; c2: number };

  function parseArg(): ArgValue {
    const a = peek();

    if (a?.t === "cell") {
      const first = a;
      eat();
      if (peek()?.t === "colon") {
        eat();
        const b = peek();
        if (b?.t === "cell") {
          eat();
          return {
            kind: "range",
            r1: first.row,
            c1: first.col,
            r2: b.row,
            c2: b.col,
          };
        }
      }
      return { kind: "num", v: ctx.getCellNumber(first.row, first.col) };
    }

    const v = parseExpr();
    return { kind: "num", v };
  }

  return { parseExpr, atEnd: () => p >= tokens.length };
}

type FormulaContext = {
  getCellNumber: (rowIndex0: number, colIndex0: number) => number;
  applyFunc: (
    name: string,
    args: Array<
      | { kind: "num"; v: number }
      | { kind: "range"; r1: number; c1: number; r2: number; c2: number }
    >
  ) => number;
};

function evalFormula(src: string, ctx: FormulaContext): number {
  try {
    const tokens = tokenizeFormula(src);
    const parser = createParser(tokens, ctx);
    const v = parser.parseExpr();
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

/* ---------------- Page ---------------- */

export default function ProductsSheetPage() {
  const [columns, setColumns] = useState<string[]>(["Name", "Price", "Qty"]);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  const [active, setActive] = useState<{ r: number; c: number } | null>(null);

  const [styles, setStyles] = useState<CellStyleMap>({});
  const [formulas, setFormulas] = useState<FormulaMap>({});

  const [fileHandle, setFileHandle] = useState<any>(null);
  const [linkedFileKind, setLinkedFileKind] = useState<LinkedFileKind>(null);
  const [localFileName, setLocalFileName] = useState("");

  const [fxOpen, setFxOpen] = useState(false);
  const [fxText, setFxText] = useState("");

  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState("");

  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");

  const [dragOver, setDragOver] = useState(false);

  const [chartMetric, setChartMetric] = useState<ChartMetric>("sum");
  const [chartCategoryCol, setChartCategoryCol] = useState<string>("");
  const [chartValueCol, setChartValueCol] = useState<string>("");

  const [editing, setEditing] = useState<{
    rowId: string;
    col: string;
    r: number;
    c: number;
    original: string;
    isFormula: boolean;
  } | null>(null);

  const [draft, setDraft] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cellRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const setCellRef = (key: string) => (el: HTMLButtonElement | null) => {
    if (!el) cellRefs.current.delete(key);
    else cellRefs.current.set(key, el);
  };

  const focusCell = (r: number, c: number) => {
    const el = cellRefs.current.get(`${r}:${c}`);
    if (el) el.focus();
  };

  const setActiveAndFocus = (r: number, c: number) => {
    setActive({ r, c });
    requestAnimationFrame(() => focusCell(r, c));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const canFS =
    typeof window !== "undefined" &&
    "showOpenFilePicker" in window &&
    "showSaveFilePicker" in window;

  /* ---------------- Auto load ---------------- */

  useEffect(() => {
    (async () => {
      try {
        const h = await loadHandle();
        if (h) {
          const ok = await ensurePermission(h, false);
          if (ok) {
            const file = await h.getFile();
            const kind = detectFileKindFromName(file.name);

            if (kind === "xlsx") {
              const buf = await file.arrayBuffer();
              const parsed = await parseXlsxToSheet(buf);
              setColumns(parsed.columns);
              setRows(parsed.rows);
              setFileHandle(h);
              setLinkedFileKind("xlsx");
              setLocalFileName(file.name);
              toast.success("Excel auto-loaded ✅");
              return;
            }

            if (kind === "csv") {
              const text = await file.text();
              const parsed = parseCsvText(text);
              setColumns(parsed.columns);
              setRows(parsed.rows);
              setFileHandle(h);
              setLinkedFileKind("csv");
              setLocalFileName(file.name);
              toast.success("CSV auto-loaded ✅");
              return;
            }
          }
        }

        const raw = localStorage.getItem(STORAGE);
        if (raw) {
          try {
            const d = JSON.parse(raw);
            if (Array.isArray(d.columns)) setColumns(d.columns);
            if (Array.isArray(d.rows)) setRows(d.rows);
            if (d.styles && typeof d.styles === "object") setStyles(d.styles);
            if (d.formulas && typeof d.formulas === "object")
              setFormulas(d.formulas);
            if (typeof d.localFileName === "string")
              setLocalFileName(d.localFileName);
            if (typeof d.chartMetric === "string")
              setChartMetric(d.chartMetric);
            if (typeof d.chartCategoryCol === "string")
              setChartCategoryCol(d.chartCategoryCol);
            if (typeof d.chartValueCol === "string")
              setChartValueCol(d.chartValueCol);
            return;
          } catch {}
        }

        setRows([
          { id: "1", values: { Name: "Rice", Price: "2000", Qty: "2" } },
          { id: "2", values: { Name: "Oil", Price: "3500", Qty: "1" } },
        ]);
      } catch (e) {
        console.log(e);
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE,
      JSON.stringify({
        columns,
        rows,
        styles,
        formulas,
        localFileName,
        chartMetric,
        chartCategoryCol,
        chartValueCol,
      })
    );
  }, [
    columns,
    rows,
    styles,
    formulas,
    localFileName,
    chartMetric,
    chartCategoryCol,
    chartValueCol,
  ]);

  const filteredRows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((r) => {
      const joined = columns
        .map((c) => r.values[c] ?? "")
        .join(" ")
        .toLowerCase();
      return joined.includes(s);
    });
  }, [rows, q, columns]);

  useEffect(() => {
    if (!filteredRows.length || !columns.length) {
      setActive(null);
      setEditing(null);
      return;
    }
    setActive((prev) => {
      if (!prev) return { r: 0, c: 0 };
      return {
        r: clamp(prev.r, 0, filteredRows.length - 1),
        c: clamp(prev.c, 0, columns.length - 1),
      };
    });
  }, [filteredRows.length, columns.length]);

  const maxR = filteredRows.length - 1;
  const maxC = columns.length - 1;

  const nextCell = (r: number, c: number) => {
    if (c < maxC) return { r, c: c + 1 };
    if (r < maxR) return { r: r + 1, c: 0 };
    return { r, c };
  };

  const prevCell = (r: number, c: number) => {
    if (c > 0) return { r, c: c - 1 };
    if (r > 0) return { r: r - 1, c: maxC };
    return { r, c };
  };

  const moveByArrow = (r: number, c: number, key: string) => {
    if (key === "ArrowUp") return { r: clamp(r - 1, 0, maxR), c };
    if (key === "ArrowDown") return { r: clamp(r + 1, 0, maxR), c };
    if (key === "ArrowLeft") return { r, c: clamp(c - 1, 0, maxC) };
    if (key === "ArrowRight") return { r, c: clamp(c + 1, 0, maxC) };
    return { r, c };
  };

  const getActiveCellIdentity = () => {
    if (!active) return null;
    const row = filteredRows[active.r];
    const col = columns[active.c];
    if (!row || !col) return null;
    return { rowId: row.id, col, r: active.r, c: active.c };
  };

  const getStyle = (rowId: string, col: string): CellStyle =>
    styles[cellKey(rowId, col)] ?? {};

  const patchActiveStyle = (patch: Partial<CellStyle>) => {
    const cell = getActiveCellIdentity();
    if (!cell) return toast.error("Cell တစ်ခုကို အရင်ရွေးပါ");
    const k = cellKey(cell.rowId, cell.col);
    setStyles((prev) => ({ ...prev, [k]: { ...(prev[k] ?? {}), ...patch } }));
  };

  const clearStyle = () => {
    const cell = getActiveCellIdentity();
    if (!cell) return toast.error("Cell တစ်ခုကို အရင်ရွေးပါ");
    const k = cellKey(cell.rowId, cell.col);
    setStyles((prev) => {
      const copy = { ...prev };
      delete copy[k];
      return copy;
    });
  };

  const activeStyle = (() => {
    const cell = getActiveCellIdentity();
    if (!cell) return null;
    return getStyle(cell.rowId, cell.col);
  })();

  const toggleBold = () => patchActiveStyle({ bold: !activeStyle?.bold });
  const toggleItalic = () => patchActiveStyle({ italic: !activeStyle?.italic });
  const setAlign = (align: TextAlign) => patchActiveStyle({ align });
  const toggleBorder = () => patchActiveStyle({ border: !activeStyle?.border });
  const setFontSize = (n: number) =>
    patchActiveStyle({ fontSize: clamp(n || 14, 10, 48) });

  /* ---------------- Formula helpers ---------------- */

  const ctx: FormulaContext = {
    getCellNumber: (rowIndex0, colIndex0) => {
      const r = filteredRows[rowIndex0];
      const col = columns[colIndex0];
      if (!r || !col) return 0;

      const k = cellKey(r.id, col);
      const f = formulas[k];

      const valStr =
        f != null ? String(evalFormulaSafe(f, 0)) : r.values[col] ?? "";
      const num = Number(String(valStr).replace(/,/g, ""));
      return Number.isFinite(num) ? num : 0;
    },
    applyFunc: (name, args) => {
      const nums: number[] = [];
      for (const a of args) {
        if (a.kind === "num") nums.push(a.v);
        else {
          const r1 = Math.min(a.r1, a.r2);
          const r2 = Math.max(a.r1, a.r2);
          const c1 = Math.min(a.c1, a.c2);
          const c2 = Math.max(a.c1, a.c2);
          for (let rr = r1; rr <= r2; rr++) {
            for (let cc = c1; cc <= c2; cc++) {
              nums.push(ctx.getCellNumber(rr, cc));
            }
          }
        }
      }

      const up = name.toUpperCase();
      if (up === "SUM") return nums.reduce((a, b) => a + b, 0);
      if (up === "AVG" || up === "AVERAGE")
        return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      if (up === "MIN") return nums.length ? Math.min(...nums) : 0;
      if (up === "MAX") return nums.length ? Math.max(...nums) : 0;
      if (up === "PRODUCT") return nums.reduce((a, b) => a * b, 1);
      return 0;
    },
  };

  function evalFormulaSafe(src: string, depth: number): number {
    if (depth > 12) return 0;
    const safeCtx: FormulaContext = {
      ...ctx,
      getCellNumber: (r, c) => {
        const row = filteredRows[r];
        const col = columns[c];
        if (!row || !col) return 0;
        const k = cellKey(row.id, col);
        const f = formulas[k];
        if (f != null) return evalFormulaSafe(f, depth + 1);
        const num = Number(String(row.values[col] ?? "").replace(/,/g, ""));
        return Number.isFinite(num) ? num : 0;
      },
    };
    return evalFormula(src, safeCtx);
  }

  const getDisplayText = (rowId: string, col: string) => {
    const k = cellKey(rowId, col);
    const f = formulas[k];
    if (f != null) {
      const v = evalFormulaSafe(f, 0);
      if (Number.isInteger(v)) return String(v);
      return String(Math.round(v * 1000) / 1000);
    }
    return rows.find((r) => r.id === rowId)?.values[col] ?? "";
  };

  const setActiveFormula = (formulaWithOrWithoutEq: string) => {
    const cell = getActiveCellIdentity();
    if (!cell) return toast.error("Cell တစ်ခုကို အရင်ရွေးပါ");
    const raw = formulaWithOrWithoutEq.trim();
    const f = raw.startsWith("=") ? raw.slice(1) : raw;
    if (!f) return;

    const k = cellKey(cell.rowId, cell.col);
    setFormulas((prev) => ({ ...prev, [k]: f }));
    toast.success("Formula set ✅");
  };

  const clearActiveFormula = () => {
    const cell = getActiveCellIdentity();
    if (!cell) return toast.error("Cell တစ်ခုကို အရင်ရွေးပါ");
    const k = cellKey(cell.rowId, cell.col);
    setFormulas((prev) => {
      const copy = { ...prev };
      delete copy[k];
      return copy;
    });
    toast.success("Formula cleared");
  };

  const sumThisColumn = () => {
    const cell = getActiveCellIdentity();
    if (!cell) return toast.error("Cell တစ်ခုကို အရင်ရွေးပါ");

    const colLetter = toColLetters(cell.c);
    const start = `${colLetter}1`;
    const end = `${colLetter}${filteredRows.length}`;
    setActiveFormula(`=SUM(${start}:${end})`);
  };

  const rowTotalPriceQty = () => {
    const cell = getActiveCellIdentity();
    if (!cell) return toast.error("Cell တစ်ခုကို အရင်ရွေးပါ");
    if (!filteredRows[cell.r]) return;

    const priceCol = prompt(
      `Price column name? (available: ${columns.join(", ")})`,
      "Price"
    );
    if (!priceCol) return;

    const qtyCol = prompt(
      `Qty column name? (available: ${columns.join(", ")})`,
      "Qty"
    );
    if (!qtyCol) return;

    const pIdx = columns.indexOf(priceCol);
    const qIdx = columns.indexOf(qtyCol);
    if (pIdx < 0 || qIdx < 0) return toast.error("Column name မမှန်ပါ");

    const rowNum = cell.r + 1;
    const pRef = `${toColLetters(pIdx)}${rowNum}`;
    const qRef = `${toColLetters(qIdx)}${rowNum}`;
    setActiveFormula(`=${pRef}*${qRef}`);
  };

  /* ---------------- Import helpers ---------------- */

  const resetSheetDecorations = () => {
    setStyles({});
    setFormulas({});
    setActive(null);
    setEditing(null);
    setDraft("");
  };

  const applyParsedSheet = (
    parsed: { columns: string[]; rows: Row[] },
    options?: { fileName?: string; toastLabel?: string }
  ) => {
    setColumns(parsed.columns);
    setRows(parsed.rows);
    resetSheetDecorations();

    const numericCols = parsed.columns.filter((col) =>
      parsed.rows.some((row) => toNumberLoose(row.values[col]) !== null)
    );
    const categoryCols = parsed.columns.filter(
      (col) => !numericCols.includes(col)
    );

    setChartValueCol(numericCols[0] ?? parsed.columns[0] ?? "");
    setChartCategoryCol(categoryCols[0] ?? parsed.columns[0] ?? "");

    if (options?.fileName) setLocalFileName(options.fileName);
    toast.success(options?.toastLabel ?? "Imported ✅");
  };

  const importBrowserFile = async (file: File) => {
    const kind = detectFileKindFromName(file.name);
    if (!kind) {
      toast.error("Only .csv and .xlsx files are supported");
      return;
    }

    try {
      if (kind === "csv") {
        const text = await file.text();
        const parsed = parseCsvText(text);
        applyParsedSheet(parsed, {
          fileName: file.name,
          toastLabel: "CSV imported from PC ✅",
        });
        return;
      }

      const buf = await file.arrayBuffer();
      const parsed = await parseXlsxToSheet(buf);
      applyParsedSheet(parsed, {
        fileName: file.name,
        toastLabel: "XLSX imported from PC ✅",
      });
    } catch (e) {
      toast.error(e?.message ?? "Import failed");
    }
  };

  const openLocalFile = () => {
    fileInputRef.current?.click();
  };

  /* ---------------- CRUD ---------------- */

  const addColumn = () => {
    const name = prompt("Column name?");
    if (!name) return;
    const col = name.trim();
    if (!col) return;
    if (columns.includes(col)) return toast.error("Column already exists");

    setColumns((c) => [...c, col]);
    setRows((r) =>
      r.map((x) => ({ ...x, values: { ...x.values, [col]: "" } }))
    );
    toast.success("Column added");
  };

  const renameColumn = (old: string) => {
    const name = prompt("Rename column", old);
    if (!name) return;
    const col = name.trim();
    if (!col || col === old) return;
    if (columns.includes(col)) return toast.error("Same name exists");

    setStyles((prev) => {
      const next: CellStyleMap = {};
      for (const k of Object.keys(prev)) {
        const [rowId, c] = k.split("::");
        if (c === old) next[cellKey(rowId, col)] = prev[k];
        else next[k] = prev[k];
      }
      return next;
    });

    setFormulas((prev) => {
      const next: FormulaMap = {};
      for (const k of Object.keys(prev)) {
        const [rowId, c] = k.split("::");
        if (c === old) next[cellKey(rowId, col)] = prev[k];
        else next[k] = prev[k];
      }
      return next;
    });

    if (chartCategoryCol === old) setChartCategoryCol(col);
    if (chartValueCol === old) setChartValueCol(col);

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

  const deleteColumn = (col: string) => {
    if (!confirm(`Delete column "${col}" ?`)) return;

    setStyles((prev) => {
      const next: CellStyleMap = {};
      for (const k of Object.keys(prev)) {
        const [, c] = k.split("::");
        if (c !== col) next[k] = prev[k];
      }
      return next;
    });

    setFormulas((prev) => {
      const next: FormulaMap = {};
      for (const k of Object.keys(prev)) {
        const [, c] = k.split("::");
        if (c !== col) next[k] = prev[k];
      }
      return next;
    });

    if (chartCategoryCol === col) setChartCategoryCol("");
    if (chartValueCol === col) setChartValueCol("");

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

  const addRow = () => {
    const v: Record<string, string> = {};
    columns.forEach((c) => (v[c] = ""));
    setRows((r) => [...r, { id: safeUUID(), values: v }]);
    toast.success("Row added");
  };

  const deleteRow = (id: string) => {
    setStyles((prev) => {
      const next: CellStyleMap = {};
      for (const k of Object.keys(prev)) {
        const [rowId] = k.split("::");
        if (rowId !== id) next[k] = prev[k];
      }
      return next;
    });

    setFormulas((prev) => {
      const next: FormulaMap = {};
      for (const k of Object.keys(prev)) {
        const [rowId] = k.split("::");
        if (rowId !== id) next[k] = prev[k];
      }
      return next;
    });

    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Row deleted");
  };

  /* ---------------- Editing ---------------- */

  const startEditAt = (r: number, c: number) => {
    const row = filteredRows[r];
    const col = columns[c];
    if (!row || !col) return;

    const k = cellKey(row.id, col);
    const f = formulas[k];

    const original = f != null ? `=${f}` : row.values[col] ?? "";
    setEditing({ rowId: row.id, col, r, c, original, isFormula: f != null });
    setDraft(original);
    setActive({ r, c });
  };

  const commitEdit = (opts?: {
    go?: "next" | "prev";
    arrowKey?: string;
    continueEdit?: boolean;
  }) => {
    if (!editing) return;

    const { rowId, col, original, r, c } = editing;
    const newVal = draft;
    const k = cellKey(rowId, col);

    if (newVal.trim().startsWith("=")) {
      const f = newVal.trim().slice(1);
      setFormulas((prev) => ({ ...prev, [k]: f }));
    } else {
      setFormulas((prev) => {
        if (!(k in prev)) return prev;
        const copy = { ...prev };
        delete copy[k];
        return copy;
      });

      setRows((prev) =>
        prev.map((row) =>
          row.id !== rowId
            ? row
            : { ...row, values: { ...row.values, [col]: newVal } }
        )
      );
    }

    if (newVal !== original) toast.success("Saved ✅");

    setEditing(null);
    setDraft("");

    let target = { r, c };
    if (opts?.go === "next") target = nextCell(r, c);
    else if (opts?.go === "prev") target = prevCell(r, c);
    else if (opts?.arrowKey) target = moveByArrow(r, c, opts.arrowKey);

    requestAnimationFrame(() => {
      setActiveAndFocus(target.r, target.c);
      if (opts?.continueEdit) {
        requestAnimationFrame(() => startEditAt(target.r, target.c));
      }
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft("");
    toast("Canceled");
    if (active) requestAnimationFrame(() => focusCell(active.r, active.c));
  };

  /* ---------------- DnD ---------------- */

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const from = columns.indexOf(String(active.id));
    const to = columns.indexOf(String(over.id));
    if (from === -1 || to === -1 || from === to) return;

    setColumns((cols) => arrayMove(cols, from, to));
    toast.success("Column order updated");
  };

  /* ---------------- File IO ---------------- */

  const downloadXlsx = async () => {
    try {
      const buf = await exportXlsxBuffer(columns, rows);
      const blob = new Blob([buf], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-sheet.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("XLSX downloaded ✅");
    } catch (e) {
      toast.error(e?.message ?? "Download failed");
    }
  };

  const downloadCsv = async () => {
    try {
      const csv = exportCsvText(columns, rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-sheet.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded ✅");
    } catch (e) {
      toast.error(e?.message ?? "CSV download failed");
    }
  };

  const linkFile = async () => {
    try {
      if (!canFS)
        return toast.error("This browser doesn't support file picker");

      // @ts-ignore
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Excel Workbook",
            accept: {
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
                ".xlsx",
              ],
            },
          },
          {
            description: "CSV File",
            accept: {
              "text/csv": [".csv"],
            },
          },
        ],
      });

      const ok = await ensurePermission(handle, false);
      if (!ok) return toast.error("Permission denied");

      const file = await handle.getFile();
      const kind = detectFileKindFromName(file.name);

      if (kind === "xlsx") {
        const buf = await file.arrayBuffer();
        const parsed = await parseXlsxToSheet(buf);
        applyParsedSheet(parsed, {
          fileName: file.name,
          toastLabel: "Linked XLSX ✅",
        });
        await saveHandle(handle);
        setFileHandle(handle);
        setLinkedFileKind("xlsx");
        return;
      }

      if (kind === "csv") {
        const text = await file.text();
        const parsed = parseCsvText(text);
        applyParsedSheet(parsed, {
          fileName: file.name,
          toastLabel: "Linked CSV ✅",
        });
        await saveHandle(handle);
        setFileHandle(handle);
        setLinkedFileKind("csv");
        return;
      }

      toast.error("Only .xlsx and .csv files are supported");
    } catch (e) {
      toast.error(e?.message ?? "Link failed");
    }
  };

  const saveFileAs = async () => {
    try {
      if (!canFS)
        return toast.error("This browser doesn't support file picker");

      const typePick = window.confirm(
        "OK = Save as XLSX\nCancel = Save as CSV"
      );

      if (typePick) {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: "my-sheet.xlsx",
          types: [
            {
              description: "Excel Workbook",
              accept: {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
                  ".xlsx",
                ],
              },
            },
          ],
        });

        const ok = await ensurePermission(handle, true);
        if (!ok) return toast.error("Permission denied");

        const buf = await exportXlsxBuffer(columns, rows);
        const writable = await handle.createWritable();
        await writable.write(new Blob([buf]));
        await writable.close();

        await saveHandle(handle);
        setFileHandle(handle);
        setLinkedFileKind("xlsx");
        setLocalFileName("my-sheet.xlsx");
        toast.success("Saved as XLSX ✅");
        return;
      }

      // @ts-ignore
      const handle = await window.showSaveFilePicker({
        suggestedName: "my-sheet.csv",
        types: [
          {
            description: "CSV File",
            accept: {
              "text/csv": [".csv"],
            },
          },
        ],
      });

      const ok = await ensurePermission(handle, true);
      if (!ok) return toast.error("Permission denied");

      const csv = exportCsvText(columns, rows);
      const writable = await handle.createWritable();
      await writable.write(
        new Blob([csv], { type: "text/csv;charset=utf-8;" })
      );
      await writable.close();

      await saveHandle(handle);
      setFileHandle(handle);
      setLinkedFileKind("csv");
      setLocalFileName("my-sheet.csv");
      toast.success("Saved as CSV ✅");
    } catch (e) {
      toast.error(e?.message ?? "Save failed");
    }
  };

  const updateSave = async () => {
    try {
      if (!fileHandle || !linkedFileKind)
        return toast.error("No linked file yet");
      const ok = await ensurePermission(fileHandle, true);
      if (!ok) return toast.error("Permission denied");

      const writable = await fileHandle.createWritable();

      if (linkedFileKind === "xlsx") {
        const buf = await exportXlsxBuffer(columns, rows);
        await writable.write(
          new Blob([buf], {
            type:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          })
        );
      } else {
        const csv = exportCsvText(columns, rows);
        await writable.write(
          new Blob([csv], { type: "text/csv;charset=utf-8;" })
        );
      }

      await writable.close();
      toast.success(
        linkedFileKind === "xlsx" ? "Excel updated ✅" : "CSV updated ✅"
      );
    } catch (e) {
      toast.error(e?.message ?? "Update failed");
    }
  };

  const unlinkFile = async () => {
    await clearHandle();
    setFileHandle(null);
    setLinkedFileKind(null);
    toast.success("Unlinked ✅");
  };

  const importCsvFromText = () => {
    try {
      if (!csvText.trim()) return toast.error("CSV text မရှိသေးပါ");

      const parsed = parseCsvText(csvText);
      applyParsedSheet(parsed, {
        fileName: "pasted-csv.txt",
        toastLabel: "CSV imported ✅",
      });

      setCsvOpen(false);
      setCsvText("");
    } catch (e) {
      toast.error(e?.message ?? "CSV import failed");
    }
  };

  const exportSheetJson = async () => {
    try {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        columns,
        rows,
        styles,
        formulas,
      };

      const pretty = JSON.stringify(payload, null, 2);
      setJsonText(pretty);

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(pretty);
        toast.success("JSON exported + copied ✅");
      } else {
        toast.success("JSON exported ✅");
      }

      setJsonOpen(true);
    } catch (e) {
      toast.error(e?.message ?? "JSON export failed");
    }
  };

  const downloadSheetJson = () => {
    try {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        columns,
        rows,
        styles,
        formulas,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-sheet-data.json";
      a.click();
      URL.revokeObjectURL(url);

      toast.success("JSON downloaded ✅");
    } catch (e) {
      toast.error(e?.message ?? "JSON download failed");
    }
  };

  /* ---------------- Output / Analytics ---------------- */

  const numericColumnStats = useMemo(() => {
    return columns
      .map((col) => {
        const nums = rows
          .map((row) => {
            const k = cellKey(row.id, col);
            const f = formulas[k];
            if (f != null) return evalFormulaSafe(f, 0);
            return toNumberLoose(row.values[col]);
          })
          .filter(
            (n): n is number => typeof n === "number" && Number.isFinite(n)
          );

        return {
          col,
          count: nums.length,
          sum: nums.reduce((a, b) => a + b, 0),
          avg: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0,
          min: nums.length ? Math.min(...nums) : 0,
          max: nums.length ? Math.max(...nums) : 0,
          isNumeric: nums.length > 0,
        };
      })
      .filter((x) => x.isNumeric);
  }, [columns, rows, formulas]);

  const activeColumnStats = useMemo(() => {
    if (!active) return null;
    const col = columns[active.c];
    if (!col) return null;
    return numericColumnStats.find((x) => x.col === col) ?? null;
  }, [active, columns, numericColumnStats]);

  const totalCells = rows.length * columns.length;

  const barSummaryData = useMemo(() => {
    return numericColumnStats.map((item) => ({
      name: item.col,
      value:
        chartMetric === "sum"
          ? item.sum
          : chartMetric === "avg"
          ? item.avg
          : chartMetric === "min"
          ? item.min
          : item.max,
    }));
  }, [numericColumnStats, chartMetric]);

  const rowTrendData = useMemo(() => {
    const valueCol =
      chartValueCol && columns.includes(chartValueCol)
        ? chartValueCol
        : numericColumnStats[0]?.col ?? "";

    if (!valueCol) return [];

    return rows.map((row, idx) => {
      const k = cellKey(row.id, valueCol);
      const f = formulas[k];
      const v =
        f != null
          ? evalFormulaSafe(f, 0)
          : toNumberLoose(row.values[valueCol]) ?? 0;

      return {
        name: String(idx + 1),
        value: v,
      };
    });
  }, [rows, chartValueCol, numericColumnStats, columns, formulas]);

  const categoryValueChartData = useMemo(() => {
    if (!chartCategoryCol || !chartValueCol) return [];
    if (!columns.includes(chartCategoryCol) || !columns.includes(chartValueCol))
      return [];

    return rows
      .map((row) => {
        const label = String(row.values[chartCategoryCol] ?? "");
        const k = cellKey(row.id, chartValueCol);
        const f = formulas[k];
        const value =
          f != null
            ? evalFormulaSafe(f, 0)
            : toNumberLoose(row.values[chartValueCol]);

        if (!label || value == null) return null;

        return {
          name: label,
          value,
        };
      })
      .filter((x): x is { name: string; value: number } => !!x);
  }, [rows, columns, chartCategoryCol, chartValueCol, formulas]);

  /* ---------------- Render ---------------- */

  return (
    <div className="p-4 md:p-6 space-y-4">
     
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={async (e) => {
          const input = e.currentTarget;
          const file = input.files?.[0];

          if (!file) {
            input.value = "";
            return;
          }

          try {
            await importBrowserFile(file);
          } finally {
            input.value = "";
          }
        }}
      />

      {/* Minimal top bar */}
      <div className="rounded-2xl border p-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={openLocalFile} className="rounded-xl">
            <FolderOpen className="mr-2 h-4 w-4" />
            Open File
          </Button>

          <Button onClick={addRow} variant="outline" className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Row
          </Button>

          <Button onClick={addColumn} variant="outline" className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Column
          </Button>

          <div className="ml-auto flex w-full md:w-auto items-center gap-2">
            <div className="w-full md:w-[260px]">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="rounded-xl"
              />
            </div>

            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setMoreOpen((p) => !p)}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {moreOpen ? "Hide" : "More"}
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          File:{" "}
          <span className="font-medium">
            {localFileName || "No file selected"}
          </span>
          {linkedFileKind ? ` • ${linkedFileKind.toUpperCase()}` : ""}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (!file) return;
          await importBrowserFile(file);
        }}
        className={[
          "rounded-2xl border-2 border-dashed p-4 transition text-sm",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 bg-background",
        ].join(" ")}
      >
        CSV / XLSX file ကို drag & drop ချပြီးလည်း import လုပ်နိုင်ပါတယ်။
      </div>

      {/* More tools */}
      {moreOpen && (
        <div className="space-y-3">
          <CollapseSection
            title="File Tools"
            icon={<FileSpreadsheet className="h-4 w-4" />}
            defaultOpen
          >
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={openLocalFile}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Open Local File
              </Button>

              <Button
                variant="outline"
                className="rounded-xl"
                disabled={!canFS}
                onClick={linkFile}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Link File
              </Button>

              <Button
                variant="outline"
                className="rounded-xl"
                disabled={!canFS}
                onClick={saveFileAs}
              >
                <Save className="mr-2 h-4 w-4" />
                Save File
              </Button>

              <Button
                variant="outline"
                className="rounded-xl"
                disabled={!fileHandle}
                onClick={updateSave}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Update Save
              </Button>

              <Button
                variant="outline"
                className="rounded-xl"
                disabled={!fileHandle}
                onClick={unlinkFile}
              >
                <Unlink className="mr-2 h-4 w-4" />
                Unlink
              </Button>

              <Button
                variant="outline"
                className="rounded-xl"
                onClick={downloadXlsx}
              >
                <Download className="mr-2 h-4 w-4" />
                XLSX
              </Button>

              <Button
                variant="outline"
                className="rounded-xl"
                onClick={downloadCsv}
              >
                <FileText className="mr-2 h-4 w-4" />
                CSV
              </Button>

              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setCsvOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import CSV Text
              </Button>

              <Button
                variant="outline"
                className="rounded-xl"
                onClick={exportSheetJson}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
            </div>
          </CollapseSection>

          <CollapseSection
            title="Formula Tools"
            icon={<FunctionSquare className="h-4 w-4" />}
          >
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  const cell = getActiveCellIdentity();
                  if (!cell) return toast.error("Cell ကိုအရင်ရွေးပါ");
                  const k = cellKey(cell.rowId, cell.col);
                  const f = formulas[k];
                  setFxText(f ? `=${f}` : "");
                  setFxOpen(true);
                }}
              >
                <FunctionSquare className="mr-2 h-4 w-4" />
                fx
              </Button>

              <Button
                variant="outline"
                className="rounded-xl"
                onClick={sumThisColumn}
              >
                <Sigma className="mr-2 h-4 w-4" />
                Sum Column
              </Button>

              <Button
                variant="outline"
                className="rounded-xl"
                onClick={rowTotalPriceQty}
              >
                <Calculator className="mr-2 h-4 w-4" />
                Price×Qty
              </Button>

              <Button
                variant="outline"
                className="rounded-xl"
                onClick={clearActiveFormula}
              >
                Clear Formula
              </Button>
            </div>
          </CollapseSection>

          <CollapseSection
            title="Style Tools"
            icon={<PaintBucket className="h-4 w-4" />}
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeStyle?.bold ? "default" : "outline"}
                  onClick={toggleBold}
                  className="rounded-xl"
                >
                  <Bold className="h-4 w-4" />
                </Button>

                <Button
                  variant={activeStyle?.italic ? "default" : "outline"}
                  onClick={toggleItalic}
                  className="rounded-xl"
                >
                  <Italic className="h-4 w-4" />
                </Button>

                <Button
                  variant={
                    activeStyle?.align === "left" ? "default" : "outline"
                  }
                  onClick={() => setAlign("left")}
                  className="rounded-xl"
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant={
                    activeStyle?.align === "center" ? "default" : "outline"
                  }
                  onClick={() => setAlign("center")}
                  className="rounded-xl"
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>

                <Button
                  variant={
                    activeStyle?.align === "right" ? "default" : "outline"
                  }
                  onClick={() => setAlign("right")}
                  className="rounded-xl"
                >
                  <AlignRight className="h-4 w-4" />
                </Button>

                <Button
                  variant={activeStyle?.border ? "default" : "outline"}
                  onClick={toggleBorder}
                  className="rounded-xl"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Border
                </Button>

                <Button
                  onClick={clearStyle}
                  variant="outline"
                  className="rounded-xl"
                >
                  <Eraser className="mr-2 h-4 w-4" />
                  Clear Style
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm">Font size</span>
                <Input
                  type="number"
                  min={10}
                  max={48}
                  value={activeStyle?.fontSize ?? 14}
                  onChange={(e) => setFontSize(Number(e.target.value || 14))}
                  className="w-[120px] rounded-xl"
                />
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 text-sm">
                    <PaintBucket className="h-4 w-4" />
                    Fill
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {FILL_SWATCH.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => patchActiveStyle({ bg: c })}
                        className="h-7 w-7 rounded-md border"
                        style={{ background: c }}
                        title={c}
                      />
                    ))}
                  </div>

                  <input
                    type="color"
                    value={activeStyle?.bg ?? "#ffffff"}
                    onChange={(e) => patchActiveStyle({ bg: e.target.value })}
                    className="h-9 w-12 rounded-md border bg-transparent"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 text-sm">
                    <Type className="h-4 w-4" />
                    Text
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {TEXT_SWATCH.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => patchActiveStyle({ color: c })}
                        className="h-7 w-7 rounded-md border"
                        style={{ background: c }}
                        title={c}
                      />
                    ))}
                  </div>

                  <input
                    type="color"
                    value={activeStyle?.color ?? "#111827"}
                    onChange={(e) =>
                      patchActiveStyle({ color: e.target.value })
                    }
                    className="h-9 w-12 rounded-md border bg-transparent"
                  />
                </div>
              </div>
            </div>
          </CollapseSection>

          <CollapseSection
            title="Outputs"
            icon={<Database className="h-4 w-4" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-2xl border p-4">
                <div className="text-sm text-muted-foreground">Rows</div>
                <div className="mt-2 text-2xl font-bold">
                  {formatNumber(rows.length)}
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <div className="text-sm text-muted-foreground">Columns</div>
                <div className="mt-2 text-2xl font-bold">
                  {formatNumber(columns.length)}
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <div className="text-sm text-muted-foreground">Cells</div>
                <div className="mt-2 text-2xl font-bold">
                  {formatNumber(totalCells)}
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <div className="text-sm text-muted-foreground">
                  Selected File
                </div>
                <div className="mt-2 text-sm font-semibold break-all">
                  {localFileName || "No file selected"}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {numericColumnStats.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Numeric column မရှိသေးပါ။
                </div>
              ) : (
                numericColumnStats.map((item) => (
                  <div key={item.col} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{item.col}</div>
                      <div className="text-xs text-muted-foreground">
                        values: {item.count}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div className="rounded-lg bg-muted/40 px-3 py-2">
                        <div className="text-xs text-muted-foreground">SUM</div>
                        <div className="font-semibold">
                          {formatNumber(item.sum)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted/40 px-3 py-2">
                        <div className="text-xs text-muted-foreground">AVG</div>
                        <div className="font-semibold">
                          {formatNumber(item.avg)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted/40 px-3 py-2">
                        <div className="text-xs text-muted-foreground">MIN</div>
                        <div className="font-semibold">
                          {formatNumber(item.min)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted/40 px-3 py-2">
                        <div className="text-xs text-muted-foreground">MAX</div>
                        <div className="font-semibold">
                          {formatNumber(item.max)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {activeColumnStats && (
              <div className="mt-4 rounded-2xl border p-4">
                <div className="font-medium mb-3">
                  Active Column: {activeColumnStats.col}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="rounded-lg bg-muted/40 px-3 py-2">
                    <div className="text-xs text-muted-foreground">SUM</div>
                    <div className="font-semibold">
                      {formatNumber(activeColumnStats.sum)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-3 py-2">
                    <div className="text-xs text-muted-foreground">AVG</div>
                    <div className="font-semibold">
                      {formatNumber(activeColumnStats.avg)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-3 py-2">
                    <div className="text-xs text-muted-foreground">MIN</div>
                    <div className="font-semibold">
                      {formatNumber(activeColumnStats.min)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-3 py-2">
                    <div className="text-xs text-muted-foreground">MAX</div>
                    <div className="font-semibold">
                      {formatNumber(activeColumnStats.max)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CollapseSection>

          <CollapseSection
            title="Charts"
            icon={<BarChart3 className="h-4 w-4" />}
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(["sum", "avg", "min", "max"] as ChartMetric[]).map((m) => (
                  <Button
                    key={m}
                    size="sm"
                    variant={chartMetric === m ? "default" : "outline"}
                    className="rounded-xl"
                    onClick={() => setChartMetric(m)}
                  >
                    {m.toUpperCase()}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-2xl border p-3">
                  <div className="mb-3 flex items-center gap-2 font-medium">
                    <BarChart3 className="h-4 w-4" />
                    Summary Chart
                  </div>

                  {barSummaryData.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Numeric chart data မရှိသေးပါ။
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barSummaryData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border p-3">
                  <div className="mb-3 flex items-center gap-2 font-medium">
                    <LineChartIcon className="h-4 w-4" />
                    Row Trend
                  </div>

                  {rowTrendData.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Trend data မရှိသေးပါ။
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={rowTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="value"
                            strokeWidth={2}
                            dot
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border p-4 space-y-4">
                <div>
                  <div className="font-medium">Custom Category Chart</div>
                  <div className="text-sm text-muted-foreground">
                    Category column နဲ့ numeric column ရွေးပြီး chart
                    ကြည့်နိုင်ပါတယ်။
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Category
                    </div>
                    <select
                      value={chartCategoryCol}
                      onChange={(e) => setChartCategoryCol(e.target.value)}
                      className="h-10 rounded-xl border bg-background px-3 text-sm"
                    >
                      <option value="">Select</option>
                      {columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Value</div>
                    <select
                      value={chartValueCol}
                      onChange={(e) => setChartValueCol(e.target.value)}
                      className="h-10 rounded-xl border bg-background px-3 text-sm"
                    >
                      <option value="">Select</option>
                      {columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {categoryValueChartData.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Chart ပြရန် category နဲ့ value ကိုရွေးပါ။
                  </div>
                ) : (
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryValueChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </CollapseSection>
        </div>
      )}

      {/* Formula Dialog */}
      <AlertDialog open={fxOpen} onOpenChange={setFxOpen}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Formula (fx)</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Example: <span className="font-medium">=SUM(B1:B10)</span>,{" "}
              <span className="font-medium">=B2*C2</span>
            </div>

            <Input
              value={fxText}
              onChange={(e) => setFxText(e.target.value)}
              placeholder="=SUM(A1:A10)"
              className="rounded-xl"
            />

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setFxText((p) => (p || "=") + "SUM(")}
              >
                SUM(
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setFxText((p) => (p || "=") + "AVG(")}
              >
                AVG(
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setFxText((p) => (p || "=") + "MIN(")}
              >
                MIN(
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setFxText((p) => (p || "=") + "MAX(")}
              >
                MAX(
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setFxText((p) => (p || "=") + "PRODUCT(")}
              >
                PRODUCT(
              </Button>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              asChild
              onClick={() => {
                if (!fxText.trim()) return;
                setActiveFormula(fxText);
                setFxOpen(false);
              }}
            >
              <Button className="rounded-xl">Apply</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV Import Dialog */}
      <AlertDialog open={csvOpen} onOpenChange={setCsvOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Import CSV Text</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              CSV content ကို paste လုပ်ပါ။ First row ကို header
              အဖြစ်သတ်မှတ်မယ်။
            </div>

            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`Name,Price,Qty
Rice,2000,2
Oil,3500,1`}
              className="min-h-[260px] w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button className="rounded-xl" onClick={importCsvFromText}>
                Import
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* JSON Export Dialog */}
      <AlertDialog open={jsonOpen} onOpenChange={setJsonOpen}>
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Export Sheet JSON</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-3">
            <textarea
              value={jsonText}
              readOnly
              className="min-h-[320px] w-full rounded-xl border bg-muted/30 px-3 py-3 text-xs outline-none"
            />

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(jsonText);
                    toast.success("Copied ✅");
                  } catch {
                    toast.error("Copy failed");
                  }
                }}
              >
                Copy JSON
              </Button>

              <Button
                variant="outline"
                className="rounded-xl"
                onClick={downloadSheetJson}
              >
                Download JSON
              </Button>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button className="rounded-xl">Done</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Sheet Only */}
      <div className="border rounded-2xl overflow-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px] text-xs text-muted-foreground">
                  #
                </TableHead>

                <SortableContext
                  items={columns}
                  strategy={horizontalListSortingStrategy}
                >
                  {columns.map((col, idx) => (
                    <SortableColumnHead
                      key={col}
                      id={col}
                      colIndex={idx}
                      onRename={renameColumn}
                      onDelete={deleteColumn}
                    />
                  ))}
                </SortableContext>

                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredRows.map((row, rIdx) => (
                <TableRow key={row.id} className="hover:bg-muted/40">
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {rIdx + 1}
                  </TableCell>

                  {columns.map((col, cIdx) => {
                    const isEditing =
                      editing?.rowId === row.id && editing?.col === col;
                    const isActive = active?.r === rIdx && active?.c === cIdx;

                    const st = getStyle(row.id, col);

                    const cellCss: React.CSSProperties = {
                      background: st.bg,
                      color: st.color,
                      fontWeight: st.bold ? 700 : 400,
                      fontStyle: st.italic ? "italic" : "normal",
                      textAlign: st.align ?? "left",
                      fontSize: st.fontSize ? `${st.fontSize}px` : "14px",
                      border: st.border
                        ? "1px solid rgba(0,0,0,0.18)"
                        : undefined,
                    };

                    const shown = getDisplayText(row.id, col);
                    const k = cellKey(row.id, col);
                    const hasFormula = formulas[k] != null;

                    return (
                      <TableCell key={col} className="align-middle">
                        {isEditing ? (
                          <Input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={() => commitEdit()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                commitEdit();
                                return;
                              }
                              if (e.key === "Escape") {
                                e.preventDefault();
                                cancelEdit();
                                return;
                              }
                              if (e.key === "Tab") {
                                e.preventDefault();
                                commitEdit({
                                  go: e.shiftKey ? "prev" : "next",
                                  continueEdit: true,
                                });
                                return;
                              }
                              if (
                                e.key === "ArrowUp" ||
                                e.key === "ArrowDown" ||
                                e.key === "ArrowLeft" ||
                                e.key === "ArrowRight"
                              ) {
                                e.preventDefault();
                                commitEdit({
                                  arrowKey: e.key,
                                  continueEdit: true,
                                });
                                return;
                              }
                            }}
                            className="h-9 rounded-xl"
                            style={cellCss}
                          />
                        ) : (
                          <button
                            ref={setCellRef(`${rIdx}:${cIdx}`)}
                            type="button"
                            onClick={() => setActiveAndFocus(rIdx, cIdx)}
                            onDoubleClick={() => startEditAt(rIdx, cIdx)}
                            onKeyDown={(e) => {
                              if (e.key === "Tab") {
                                e.preventDefault();
                                const t = e.shiftKey
                                  ? prevCell(rIdx, cIdx)
                                  : nextCell(rIdx, cIdx);
                                setActiveAndFocus(t.r, t.c);
                                return;
                              }
                              if (
                                e.key === "ArrowUp" ||
                                e.key === "ArrowDown" ||
                                e.key === "ArrowLeft" ||
                                e.key === "ArrowRight"
                              ) {
                                e.preventDefault();
                                const t = moveByArrow(rIdx, cIdx, e.key);
                                setActiveAndFocus(t.r, t.c);
                                return;
                              }
                              if (e.key === "Enter" || e.key === "F2") {
                                e.preventDefault();
                                startEditAt(rIdx, cIdx);
                                return;
                              }
                            }}
                            className={[
                              "w-full rounded-xl px-2 py-1 outline-none transition hover:bg-muted",
                              isActive ? "ring-2 ring-primary/40" : "",
                            ].join(" ")}
                            style={cellCss}
                            title={
                              hasFormula
                                ? `Formula: =${formulas[k]}`
                                : "Enter/F2 edit • Arrow move • Tab next"
                            }
                          >
                            <span className="inline-flex items-center gap-2">
                              {shown}
                              {hasFormula && (
                                <span className="text-[10px] text-muted-foreground">
                                  fx
                                </span>
                              )}
                            </span>
                          </button>
                        )}
                      </TableCell>
                    );
                  })}

                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-xl"
                      onClick={() => deleteRow(row.id)}
                      title="Delete row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 2}
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
