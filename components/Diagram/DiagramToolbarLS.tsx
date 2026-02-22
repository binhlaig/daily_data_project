"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DiagramToolbarLS({
  title,
  setTitle,
  onAddNode,
  onSave,
  saving,
  onExport,
  onImport,
}: {
  title: string;
  setTitle: (v: string) => void;
  onAddNode: () => void;
  onSave: () => void;
  saving: boolean;
  onExport: () => void;
  onImport: (txt: string) => void;
}) {
  return (
    <div className="absolute left-3 right-3 top-3 z-10 flex items-center gap-2 rounded-2xl border bg-background/70 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Diagram title"
        className="h-10"
      />

      <Button variant="secondary" onClick={onAddNode}>
        + Node
      </Button>

      <Button onClick={onSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>

      <Button variant="outline" onClick={onExport}>
        Export
      </Button>

      <Button
        variant="outline"
        onClick={() => {
          const txt = prompt("Paste exported JSON here") ?? "";
          if (txt.trim()) onImport(txt);
        }}
      >
        Import
      </Button>
    </div>
  );
}