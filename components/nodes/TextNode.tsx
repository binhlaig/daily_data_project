"use client";

import { Handle, Position } from "reactflow";

export default function TextNode({ data }: { data: any }) {
  return (
    <div className="rounded-xl border bg-background/90 px-3 py-2 shadow-sm backdrop-blur">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div
        contentEditable
        suppressContentEditableWarning
        className="min-w-[80px] cursor-text text-sm outline-none"
        onBlur={(e) => {
          data.onChange?.(e.currentTarget.textContent ?? "");
        }}
      >
        {data.label ?? "Text"}
      </div>
    </div>
  );
}