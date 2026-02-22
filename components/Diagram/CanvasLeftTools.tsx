"use client";

import { cn } from "@/lib/utils";
import {
  Plus,
  Sparkles,
  MousePointer2,
  Square,
  Circle,
  ArrowUpRight,
  Pencil,
  Eraser,
  Type,
} from "lucide-react";

export type ToolKey =
  | "add"
  | "ai"
  | "select"
  | "rect"
  | "circle"
  | "arrow"
  | "pen"
  | "erase"
  | "text";

type ToolItem = {
  key: ToolKey;
  Icon: any;
  label: string;
  shortcut?: string; // V R O A L D T
  section?: "top" | "main";
};

const tools: ToolItem[] = [
  { key: "add", Icon: Plus, label: "Add", shortcut: "+", section: "top" },
  { key: "ai", Icon: Sparkles, label: "AI", shortcut: "⌘J", section: "top" },

  { key: "select", Icon: MousePointer2, label: "Select", shortcut: "V", section: "main" },
  { key: "rect", Icon: Square, label: "Rectangle", shortcut: "R", section: "main" },
  { key: "circle", Icon: Circle, label: "Ellipse", shortcut: "O", section: "main" },
  { key: "arrow", Icon: ArrowUpRight, label: "Arrow", shortcut: "A", section: "main" },
  { key: "pen", Icon: Pencil, label: "Draw", shortcut: "L", section: "main" },
  { key: "erase", Icon: Eraser, label: "Eraser", shortcut: "D", section: "main" },
  { key: "text", Icon: Type, label: "Text", shortcut: "T", section: "main" },
];

export default function CanvasLeftTools({
  tool,
  setTool,
  onAIClick,
  onAddNode,
}: {
  tool: ToolKey;
  setTool: (t: ToolKey) => void;
  onAIClick: () => void;
  onAddNode: () => void;
}) {
  const top = tools.filter((t) => t.section === "top");
  const main = tools.filter((t) => t.section === "main");

  return (
    <div className="absolute left-3 top-14 z-30">
      {/* right divider like screenshot */}
      <div className="absolute -right-3 top-0 h-full w-px bg-border/60" />

      <div className="rounded-2xl border border-border/60 bg-black/30 p-2 backdrop-blur supports-[backdrop-filter]:bg-black/20">
        {/* TOP GROUP */}
        <div className="flex flex-col gap-1.5">
          {top.map((it) => (
            <ToolRow
              key={it.key}
              active={tool === it.key}
              Icon={it.Icon}
              shortcut={it.shortcut}
              onClick={() => {
                if (it.key === "ai") onAIClick();
                else if (it.key === "add") onAddNode();
                else setTool(it.key);
              }}
            />
          ))}
        </div>

        <div className="my-2 h-px bg-border/60" />

        {/* MAIN GROUP */}
        <div className="flex flex-col gap-1.5">
          {main.map((it) => (
            <ToolRow
              key={it.key}
              active={tool === it.key}
              Icon={it.Icon}
              shortcut={it.shortcut}
              onClick={() => setTool(it.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolRow({
  active,
  Icon,
  shortcut,
  onClick,
}: {
  active: boolean;
  Icon: any;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2 rounded-xl px-2 py-2 transition",
        active ? "bg-white/10 ring-1 ring-white/10" : "hover:bg-white/5"
      )}
    >
      <div
        className={cn(
          "grid h-10 w-10 place-items-center rounded-xl border transition",
          active
            ? "border-white/15 bg-white/10"
            : "border-white/10 bg-white/5 group-hover:bg-white/10"
        )}
      >
        <Icon className="h-4 w-4 text-white/90" />
      </div>

      <div className="w-5 text-left text-[11px] font-medium text-white/40">
        {shortcut}
      </div>
    </button>
  );
}