"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import NoteMarkdown from "@/components/note_code/NoteMarkdown";
import { detectLang } from "@/lib/detectLang";

type View = "editor" | "preview" | "split";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  heightClassName?: string; // e.g. "h-[calc(100vh-240px)]"
};

const EMOJI_MAP: Array<{ key: string; emoji: string }> = [
  { key: ":ok:", emoji: "✅ " },
  { key: ":fire:", emoji: "🔥 " },
  { key: ":tip:", emoji: "💡 " },
  { key: ":warn:", emoji: "⚠️ " },
  { key: ":info:", emoji: "ℹ️ " },
  { key: ":new:", emoji: "✨ " },
];

function replaceTokensSmart(text: string) {
  // convert tokens anywhere, but mostly used when user finishes typing
  let out = text;
  for (const m of EMOJI_MAP) {
    // convert only when followed by space/newline/end (so it won't fight typing too hard)
    const re = new RegExp(`${escapeRegExp(m.key)}(?=\\s|$)`, "gi");
    out = out.replace(re, m.emoji.trimEnd());
  }
  return out;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getLineStartIndex(text: string, caret: number) {
  const i = text.lastIndexOf("\n", Math.max(0, caret - 1));
  return i === -1 ? 0 : i + 1;
}

function getLineText(text: string, caret: number) {
  const start = getLineStartIndex(text, caret);
  const end = text.indexOf("\n", caret);
  return text.slice(start, end === -1 ? text.length : end);
}

type Cmd = {
  id: string;
  title: string;
  hint: string;
  keyword: string; // for filtering
  run: (ctx: {
    text: string;
    caret: number;
    selectionEnd: number;
  }) => { nextText: string; nextCaret: number };
};

export default function UltimateMarkdownEditor({
  value,
  onChange,
  placeholder = "Write markdown here...",
  heightClassName = "h-[calc(100vh-240px)]",
}: Props) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // Split controls
  const [view, setView] = useState<View>("editor");

  // Slash menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const commands: Cmd[] = useMemo(
    () => [
      {
        id: "ok",
        title: "OK",
        hint: "Insert ✅ at cursor",
        keyword: "ok done check",
        run: ({ text, caret, selectionEnd }) => insertAt(text, caret, selectionEnd, "✅ "),
      },
      {
        id: "fire",
        title: "Next upgrade",
        hint: "Insert 🔥 at cursor",
        keyword: "fire upgrade next",
        run: ({ text, caret, selectionEnd }) => insertAt(text, caret, selectionEnd, "🔥 "),
      },
      {
        id: "tip",
        title: "Tip",
        hint: "Insert 💡 at cursor",
        keyword: "tip hint idea",
        run: ({ text, caret, selectionEnd }) => insertAt(text, caret, selectionEnd, "💡 "),
      },
      {
        id: "warn",
        title: "Warning",
        hint: "Insert ⚠️ at cursor",
        keyword: "warn warning caution important",
        run: ({ text, caret, selectionEnd }) => insertAt(text, caret, selectionEnd, "⚠️ "),
      },
      {
        id: "info",
        title: "Info",
        hint: "Insert ℹ️ at cursor",
        keyword: "info note",
        run: ({ text, caret, selectionEnd }) => insertAt(text, caret, selectionEnd, "ℹ️ "),
      },
      {
        id: "codeblock",
        title: "Code block",
        hint: "Wrap selection with ```",
        keyword: "code block fenced",
        run: ({ text, caret, selectionEnd }) => wrapSelectionAsCodeBlock(text, caret, selectionEnd),
      },
      {
        id: "h2",
        title: "Heading (##)",
        hint: "Make current line a heading",
        keyword: "h2 heading title",
        run: ({ text, caret }) => prefixLine(text, caret, "## "),
      },
      {
        id: "bullet",
        title: "Bullet list",
        hint: "Add - to current line",
        keyword: "list bullet dash",
        run: ({ text, caret }) => prefixLine(text, caret, "- "),
      },
      {
        id: "quote",
        title: "Quote",
        hint: "Add > to current line",
        keyword: "quote blockquote",
        run: ({ text, caret }) => prefixLine(text, caret, "> "),
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = menuQuery.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.keyword.toLowerCase().includes(q)
    );
  }, [commands, menuQuery]);

  // Keep index safe
  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [filtered.length, activeIndex]);

  function setCaret(pos: number) {
    const ta = taRef.current;
    if (!ta) return;
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = pos;
    });
  }

  function closeMenu() {
    setMenuOpen(false);
    setMenuQuery("");
    setActiveIndex(0);
  }

  function applyCommand(cmd: Cmd) {
    const ta = taRef.current;
    if (!ta) return;

    const caret = ta.selectionStart ?? value.length;
    const selectionEnd = ta.selectionEnd ?? caret;

    // If menu was triggered by "/query", remove that "/query" from current line
    // e.g. "text /wa" -> remove "/wa" portion right before caret if present
    const cleaned = removeSlashQueryOnLine(value, caret, menuQuery);

    const caretAfterClean = adjustCaretAfterSlashRemoval(value, cleaned, caret);

    const result = cmd.run({
      text: cleaned,
      caret: caretAfterClean,
      selectionEnd: caretAfterClean,
    });

    onChange(result.nextText);
    closeMenu();
    setCaret(result.nextCaret);
  }

  function handleChange(next: string) {
    onChange(next);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget;
    const caret = ta.selectionStart ?? 0;
    const line = getLineText(value, caret);

    // Open slash menu when user types "/" (at any position)
    if (!menuOpen && e.key === "/") {
      // open after the "/" actually appears -> small delay
      requestAnimationFrame(() => {
        setMenuOpen(true);
        setMenuQuery("");
        setActiveIndex(0);
      });
      return;
    }

    // If menu open: navigation + enter apply
    if (menuOpen) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[activeIndex];
        if (cmd) applyCommand(cmd);
        return;
      }

      // typing updates query (basic)
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // only update query if slash exists on current line
        if (line.includes("/")) {
          requestAnimationFrame(() => {
            const caret2 = ta.selectionStart ?? 0;
            const q = extractSlashQuery(value, caret2);
            setMenuQuery(q);
          });
        }
        return;
      }

      // Backspace updates query
      if (e.key === "Backspace") {
        requestAnimationFrame(() => {
          const caret2 = ta.selectionStart ?? 0;
          const q = extractSlashQuery(value, caret2);
          // if no slash query anymore, close menu
          if (!q && !getLineText(value, caret2).includes("/")) closeMenu();
          else setMenuQuery(q);
        });
        return;
      }
    }

    // Auto token convert when user presses Space or Enter
    if (e.key === " " || e.key === "Enter") {
      // convert tokens on the whole text (safe + simple)
      const converted = replaceTokensSmart(value);
      if (converted !== value) {
        const oldCaret = caret;
        onChange(converted);
        // caret position might shift slightly; keep it approx
        setCaret(oldCaret);
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData("text");
    if (!text) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    const isMultiLine = trimmed.includes("\n");
    const looksLikeCommand =
      /^(npm|pnpm|yarn|npx|git|docker|docker-compose|kubectl|helm|curl|wget|ssh|python|python3|pip|pip3|java|mvn|gradle|go|cargo)\b/i.test(
        trimmed
      );

    if (!isMultiLine && !looksLikeCommand) return;

    e.preventDefault();

    const lang = detectLang(trimmed);
    const wrapped = `\n\`\`\`${lang}\n${trimmed}\n\`\`\`\n`;

    const ta = e.currentTarget;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    const currentValue = value ?? "";
    const newValue =
      currentValue.substring(0, start) + wrapped + currentValue.substring(end);

    onChange(newValue);

    // place caret after inserted block
    setCaret(start + wrapped.length);
  }

  // Quick toolbar insert (cursor-aware)
  function quickInsert(s: string) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? start;

    const next = value.substring(0, start) + s + value.substring(end);
    onChange(next);
    setCaret(start + s.length);
  }

  return (
    <div className="space-y-3">
      {/* TOP CONTROLS */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={view === "editor" ? "default" : "secondary"}
            size="sm"
            onClick={() => setView("editor")}
          >
            Editor
          </Button>
          <Button
            type="button"
            variant={view === "preview" ? "default" : "secondary"}
            size="sm"
            onClick={() => setView("preview")}
          >
            Preview
          </Button>
          <Button
            type="button"
            variant={view === "split" ? "default" : "secondary"}
            size="sm"
            onClick={() => setView("split")}
          >
            Split
          </Button>
        </div>

        {/* quick hint */}
        <div className="text-xs text-muted-foreground">
          Type <span className="font-mono">/</span> for menu ·{" "}
          <span className="font-mono">:ok:</span> → ✅
        </div>
      </div>

      {/* BODY */}
      <div
        className={[
          view === "split" ? "grid grid-cols-1 gap-3 md:grid-cols-2" : "",
        ].join(" ")}
      >
        {(view === "editor" || view === "split") && (
          <div className="relative">
            {/* Floating toolbar */}
            <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-xl border bg-background/90 p-1 shadow backdrop-blur">
              {[
                { label: "OK", v: "✅ " },
                { label: "Fire", v: "🔥 " },
                { label: "Tip", v: "💡 " },
                { label: "Warn", v: "⚠️ " },
                { label: "Info", v: "ℹ️ " },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  className="rounded-md px-2 py-1 text-xs hover:bg-muted transition"
                  onClick={() => quickInsert(b.v)}
                  title={b.label}
                >
                  {b.v}
                </button>
              ))}
            </div>

            {/* Slash Menu */}
            {menuOpen && (
              <div className="absolute left-3 top-14 z-20 w-[320px] rounded-xl border bg-background/95 shadow-lg backdrop-blur">
                <div className="p-2">
                  <Input
                    value={menuQuery}
                    onChange={(e) => setMenuQuery(e.target.value)}
                    placeholder="Search command… (ok, warn, codeblock)"
                    className="h-9"
                  />
                </div>
                <div className="max-h-64 overflow-auto p-1">
                  {filtered.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No commands
                    </div>
                  ) : (
                    filtered.map((c, i) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => applyCommand(c)}
                        className={[
                          "w-full rounded-lg px-3 py-2 text-left transition",
                          i === activeIndex
                            ? "bg-accent/40"
                            : "hover:bg-accent/20",
                        ].join(" ")}
                      >
                        <div className="text-sm font-medium">{c.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.hint}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="flex items-center justify-between border-t px-3 py-2 text-[11px] text-muted-foreground">
                  <span>↑↓ navigate · Enter apply · Esc close</span>
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={closeMenu}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Textarea */}
            <textarea
              ref={taRef}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder}
              className={[
                heightClassName,
                "w-full rounded-xl border bg-background/10 p-4 pr-36",
                "font-mono text-sm leading-7 outline-none",
              ].join(" ")}
            />
          </div>
        )}

        {(view === "preview" || view === "split") && (
          <ScrollArea className={[heightClassName, "rounded-xl border"].join(" ")}>
            <div className="p-4">
              <NoteMarkdown content={value} />
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

// ---------- helpers ----------
function insertAt(text: string, start: number, end: number, insert: string) {
  const nextText = text.substring(0, start) + insert + text.substring(end);
  return { nextText, nextCaret: start + insert.length };
}

function prefixLine(text: string, caret: number, prefix: string) {
  const lineStart = getLineStartIndex(text, caret);
  // if already has prefix, do nothing
  if (text.slice(lineStart, lineStart + prefix.length) === prefix) {
    return { nextText: text, nextCaret: caret };
  }
  const nextText = text.slice(0, lineStart) + prefix + text.slice(lineStart);
  return { nextText, nextCaret: caret + prefix.length };
}

function wrapSelectionAsCodeBlock(text: string, start: number, end: number) {
  const selected = text.substring(start, end);
  const wrapped = `\n\`\`\`\n${selected || ""}\n\`\`\`\n`;
  const nextText = text.substring(0, start) + wrapped + text.substring(end);
  return { nextText, nextCaret: start + wrapped.length };
}

function extractSlashQuery(text: string, caret: number) {
  const line = getLineText(text, caret);
  const idx = line.lastIndexOf("/");
  if (idx === -1) return "";
  return line.slice(idx + 1).trim();
}

function removeSlashQueryOnLine(text: string, caret: number, q: string) {
  const lineStart = getLineStartIndex(text, caret);
  const line = getLineText(text, caret);
  const idx = line.lastIndexOf("/");
  if (idx === -1) return text;

  const abs = lineStart + idx;
  // remove "/{q}" right before caret area
  const removeLen = 1 + (q?.length ?? 0);
  const next = text.slice(0, abs) + text.slice(abs + removeLen);
  return next;
}

function adjustCaretAfterSlashRemoval(oldText: string, newText: string, oldCaret: number) {
  // naive but safe: keep caret at same index if possible
  return Math.min(oldCaret, newText.length);
}