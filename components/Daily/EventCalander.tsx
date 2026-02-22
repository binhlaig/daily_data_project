

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Calendar from "react-calendar";


import {
  Clock,
  Plus,
  RefreshCw,
  Pin,
  Trash2,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

type NoteItem = {
  _id: string;
  dateKey: string; // YYYY-MM-DD
  time?: string; // HH:mm
  title?: string;
  content?: string;
  tags?: string[];
  mood?: string;
  isPinned?: boolean;
  updatedAt?: string;
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const toDateKey = (d: Date) => d.toISOString().slice(0, 10);

const nowTime = () => {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const isValidHHmm = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

const monthLabel = (d: Date) =>
  d.toLocaleDateString(undefined, { year: "numeric", month: "long" });

export default function EventCalendar() {
  const [value, onChange] = useState<Value>(new Date());

  const selectedDate = useMemo(() => {
    const v = Array.isArray(value) ? value[0] : value;
    return v instanceof Date ? v : new Date();
  }, [value]);

  const dateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);

  const [activeStartDate, setActiveStartDate] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [noteDays, setNoteDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // editor
  const [activeId, setActiveId] = useState<string | null>(null);
  const [time, setTime] = useState<string>(nowTime());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const isEditing = !!activeId;
  const timeRef = useRef<HTMLInputElement | null>(null);

  const fetchMonthDots = async (d: Date) => {
    try {
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const res = await fetch(`/api/daily-note-items-days?year=${y}&month=${m}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const arr: string[] = Array.isArray(data) ? data : [];
      setNoteDays(new Set(arr));
    } catch {
      // keep old
    }
  };

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/daily-note-items?dateKey=${dateKey}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const arr: NoteItem[] = Array.isArray(data) ? data : [];

      arr.sort((a, b) => {
        const ap = a.isPinned ? 1 : 0;
        const bp = b.isPinned ? 1 : 0;
        if (bp !== ap) return bp - ap;

        const at = a.time?.trim() || "99:99";
        const bt = b.time?.trim() || "99:99";
        if (at !== bt) return at.localeCompare(bt);

        return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
      });

      setNotes(arr);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchNotes(), fetchMonthDots(activeStartDate)]);
  };

  useEffect(() => {
    fetchMonthDots(activeStartDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMonthDots(activeStartDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStartDate]);

  useEffect(() => {
    fetchNotes();
    setActiveId(null);
    setTime(nowTime());
    setTitle("");
    setContent("");
    setTimeout(() => timeRef.current?.focus(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  const startEdit = (n: NoteItem) => {
    setActiveId(n._id);
    setTime(n.time?.trim() || nowTime());
    setTitle(n.title ?? "");
    setContent(n.content ?? "");
    setTimeout(() => timeRef.current?.focus(), 0);
  };

  const cancelEdit = () => {
    setActiveId(null);
    setTime(nowTime());
    setTitle("");
    setContent("");
    setTimeout(() => timeRef.current?.focus(), 0);
  };

  const save = async () => {
    const t = time?.trim();
    const safeTime = isValidHHmm(t) ? t : nowTime();

    if (!title.trim() && !content.trim()) return;

    const payload = {
      dateKey,
      time: safeTime,
      title: title.trim(),
      content: content.trim(),
      isPinned: false,
    };

    setSaving(true);
    try {
      const res = await fetch(
        activeId ? `/api/daily-note-items/${activeId}` : "/api/daily-note-items",
        {
          method: activeId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error();

      setNoteDays((prev) => new Set(prev).add(dateKey));
      await fetchNotes();
      cancelEdit();
      await fetchMonthDots(activeStartDate);
    } catch {
      // optional: toast
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (id: string, next: boolean) => {
    try {
      const res = await fetch(`/api/daily-note-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: next }),
      });
      if (!res.ok) throw new Error();
      await fetchNotes();
    } catch {}
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/daily-note-items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();

      await fetchNotes();

      const check = await fetch(`/api/daily-note-items?dateKey=${dateKey}`);
      const data = await check.json();
      const arr: NoteItem[] = Array.isArray(data) ? data : [];
      if (arr.length === 0) {
        setNoteDays((prev) => {
          const nextSet = new Set(prev);
          nextSet.delete(dateKey);
          return nextSet;
        });
      }

      if (activeId === id) cancelEdit();
      await fetchMonthDots(activeStartDate);
    } catch {}
  };

  const todayKey = toDateKey(new Date());

  return (
    <Card className="overflow-hidden relative border-border/60 bg-gradient-to-b from-background to-muted/20 shadow-sm">
      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold tracking-wide">
              Daily Notes Calendar
            </CardTitle>
            <div className="mt-1 text-xs text-muted-foreground">
              Selected: <span className="font-medium">{dateKey}</span>
            </div>
          </div>

          <button
            onClick={refreshAll}
            className="rounded-full px-3 py-2 border border-border/60 bg-background/40 backdrop-blur hover:bg-muted/30 transition"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", loading ? "animate-spin" : "")} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-3 sm:p-4">
        {/* ✅ Calendar wrapper */}
        <div className="rounded-xl border border-border/60 bg-background/40 backdrop-blur p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">{monthLabel(activeStartDate)}</div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-full border border-border/60 bg-background/40 px-2 py-1 hover:bg-muted/30 transition"
                onClick={() =>
                  setActiveStartDate(
                    (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)
                  )
                }
                title="Prev month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                className="rounded-full border border-border/60 bg-background/40 px-2 py-1 hover:bg-muted/30 transition"
                onClick={() =>
                  setActiveStartDate(
                    (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)
                  )
                }
                title="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Calendar
            value={value}
            onChange={onChange}
            activeStartDate={activeStartDate}
            onActiveStartDateChange={({ activeStartDate }) => {
              if (activeStartDate) setActiveStartDate(activeStartDate);
            }}
            calendarType="gregory"
            formatShortWeekday={(_, date) =>
              date.toLocaleDateString(undefined, { weekday: "short" })
            }
            tileClassName={({ date, view }) => {
              if (view !== "month") return "";
              const key = toDateKey(date);
              const isToday = key === todayKey;
              const isSelected = key === dateKey;
              return cn(
                "relative rounded-lg p-2 text-sm transition",
                "hover:bg-muted/30",
                isToday && "ring-1 ring-emerald-500/40",
                isSelected && "ring-2 ring-violet-500/50 bg-muted/30"
              );
            }}
            tileContent={({ date, view }) => {
              if (view !== "month") return null;
              const key = toDateKey(date);
              if (!noteDays.has(key)) return null;
              return (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                  <span className="block h-1.5 w-1.5 rounded-full bg-rose-500" />
                </div>
              );
            }}
            // ✅ remove default next/prev label to avoid duplication
            nextLabel={null}
            prevLabel={null}
            next2Label={null}
            prev2Label={null}
          />

          {/* small legend */}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
            Days with notes
            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-emerald-500/70" />
            Today
          </div>
        </div>

        {/* ✅ Add/Edit form (match dashboard style) */}
        <div className="rounded-xl border border-border/60 bg-background/40 backdrop-blur p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-sm font-semibold flex items-center gap-2">
              {isEditing ? (
                <>
                  <Pencil className="h-4 w-4" /> Edit Note
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Add Note
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full gap-1">
                <Clock className="h-3 w-3" />
                <input
                  ref={timeRef}
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-transparent outline-none text-xs"
                />
              </Badge>

              {isEditing && (
                <button
                  onClick={cancelEdit}
                  className="text-xs rounded-full border border-border/60 bg-background/40 px-3 py-1 hover:bg-muted/30 transition flex items-center gap-1"
                  title="Cancel"
                  disabled={saving}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              )}
            </div>
          </div>

          <input
            className="w-full rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none"
            placeholder="Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="mt-2 w-full min-h-[90px] rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none"
            placeholder="Write note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="mt-3 flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2",
                "bg-foreground text-background hover:opacity-90 transition",
                saving && "opacity-60 cursor-not-allowed"
              )}
            >
              {isEditing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {saving ? "Saving..." : isEditing ? "Update" : "Add"}
            </button>
          </div>

          <div className="mt-2 text-[11px] text-muted-foreground">
            * Time မထည့်/မမှန်ရင် Save လုပ်တဲ့အချိန် <b>auto now time</b> ထည့်ပေးမယ်။
          </div>
        </div>

        {/* ✅ Notes list */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : notes.length === 0 ? (
            <div className="text-sm text-muted-foreground">No notes for this day.</div>
          ) : (
            notes.map((n, idx) => (
              <div
                key={n._id}
                className={cn(
                  "rounded-xl border border-border/60 bg-background/40 backdrop-blur p-4",
                  n.isPinned
                    ? "ring-1 ring-violet-500/30"
                    : idx % 2 === 0
                    ? "ring-1 ring-rose-500/20"
                    : "ring-1 ring-emerald-500/20"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => startEdit(n)}
                    className="min-w-0 text-left hover:opacity-90"
                    title="Click to edit"
                  >
                    <div className="flex items-center gap-2">
                      <div className="truncate font-semibold">
                        {n.title?.trim() ? n.title : "(No title)"}
                      </div>
                      {n.isPinned ? (
                        <Badge variant="secondary" className="rounded-full gap-1">
                          <Pin className="h-3 w-3" /> Pinned
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="rounded-full gap-1">
                        <Clock className="h-3 w-3" />
                        {n.time?.trim() ? n.time : "--:--"}
                      </Badge>
                    </div>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePin(n._id, !n.isPinned)}
                      className="text-xs rounded-full border border-border/60 bg-background/40 px-3 py-1 hover:bg-muted/30 transition"
                      title="Pin"
                    >
                      {n.isPinned ? "Unpin" : "Pin"}
                    </button>

                    <button
                      onClick={() => remove(n._id)}
                      className="text-xs rounded-full border border-red-500/30 text-red-600 px-3 py-1 hover:bg-red-500/10 transition flex items-center gap-1"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
                  {n.content?.trim() ? n.content : "—"}
                </p>

                {n.updatedAt && (
                  <div className="mt-3 text-[11px] text-muted-foreground">
                    Updated: {new Date(n.updatedAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
