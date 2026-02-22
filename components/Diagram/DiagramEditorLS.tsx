"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { nanoid } from "nanoid";

import { getOne, upsert } from "@/lib/storage";

import CanvasTopBar from "@/components/Diagram/CanvasTopBar";
import CanvasLeftTools, { ToolKey } from "@/components/Diagram/CanvasLeftTools";
import TextNode from "@/components/nodes/TextNode";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

type DiagramData = {
  nodes: Node[];
  edges: Edge[];
  viewport?: { x: number; y: number; zoom: number };
};

const RECT_MIN_W = 120;
const RECT_MIN_H = 70;

const CIRCLE_MIN_W = 90;
const CIRCLE_MIN_H = 90;

function rectStyle(w: number, h: number) {
  return {
    width: Math.max(RECT_MIN_W, w),
    height: Math.max(RECT_MIN_H, h),
    borderRadius: 18,
    border: "2px solid rgba(255,255,255,0.85)",
    background: "rgba(0,0,0,0.08)",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
  } as any;
}

function circleStyle(w: number, h: number) {
  return {
    width: Math.max(CIRCLE_MIN_W, w),
    height: Math.max(CIRCLE_MIN_H, h),
    borderRadius: 9999,
    border: "2px solid rgba(255,255,255,0.85)",
    background: "rgba(0,0,0,0.08)",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
  } as any;
}

type DrawKind = "rect" | "circle";

export default function DiagramEditorLS({
  id,
  onChanged,
}: {
  id: string;
  onChanged: () => void;
}) {
  const stored = useMemo(() => getOne(id), [id]);

  const [title, setTitle] = useState(stored?.title ?? "Untitled File");
  const [nodes, setNodes] = useState<Node[]>(stored?.data?.nodes ?? []);
  const [edges, setEdges] = useState<Edge[]>(stored?.data?.edges ?? []);
  const [tool, setTool] = useState<ToolKey>("select");
  const [saving, setSaving] = useState(false);

  // drawing refs
  const [isDrawing, setIsDrawing] = useState(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const draftIdRef = useRef<string | null>(null);
  const drawKindRef = useRef<DrawKind>("rect");

  const rf = useRef<ReactFlowInstance | null>(null);

  useEffect(() => {
    const s = getOne(id);
    setTitle(s?.title ?? "Untitled File");
    setNodes((s?.data?.nodes as any) ?? []);
    setEdges((s?.data?.edges as any) ?? []);
  }, [id]);

  const nodeTypes = useMemo(() => ({ textNode: TextNode }), []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (c: Connection) =>
      setEdges((eds) => addEdge({ ...c, id: nanoid(8) }, eds)),
    []
  );

  const buildData = (): DiagramData => {
    const viewport = rf.current?.getViewport?.() ?? { x: 0, y: 0, zoom: 1 };
    return { nodes, edges, viewport };
  };

  const save = useCallback(() => {
    setSaving(true);
    try {
      const now = Date.now();
      const prev = getOne(id);

      upsert({
        id,
        title,
        data: buildData(),
        createdAt: prev?.createdAt ?? now,
        updatedAt: now,
      });

      onChanged();
    } finally {
      setSaving(false);
    }
  }, [id, title, nodes, edges, onChanged]);

  // autosave
  const t = useRef<any>(null);
  useEffect(() => {
    clearTimeout(t.current);
    t.current = setTimeout(save, 1200);
    return () => clearTimeout(t.current);
  }, [title, nodes, edges, save]);

  const defaultViewport = useMemo(() => stored?.data?.viewport, [stored?.data]);

  const onAIClick = () => alert("AI Diagram UI ✅ (Next step: connect to API)");

  const onAddNode = () => {
    const newNode: Node = {
      id: nanoid(8),
      type: "default",
      position: { x: 160, y: 160 },
      data: { label: "" },
      style: rectStyle(RECT_MIN_W, RECT_MIN_H),
    };
    setNodes((p) => [...p, newNode]);
  };

  // TEXT: click create
  const onPaneClick = useCallback(
    (evt: React.MouseEvent) => {
      if (!rf.current) return;
      if (tool !== "text") return;

      const pos = rf.current.screenToFlowPosition({
        x: evt.clientX,
        y: evt.clientY,
      });

      const nodeId = nanoid(8);
      const newNode: Node = {
        id: nodeId,
        type: "textNode",
        position: pos,
        data: {
          label: "Text",
          onChange: (next: string) => {
            setNodes((prev) =>
              prev.map((n) =>
                n.id === nodeId ? { ...n, data: { ...n.data, label: next } } : n
              )
            );
          },
        },
      };

      setNodes((p) => [...p, newNode]);
    },
    [tool]
  );

  const isConnectMode = tool === "arrow";
  const isDrawMode = tool === "rect" || tool === "circle";

  // ✅ start drawing using onMouseDown (pane only)
  const onMouseDown = useCallback(
    (evt: React.MouseEvent) => {
      if (!rf.current) return;
      if (!isDrawMode) return;

      const el = evt.target as HTMLElement | null;
      if (!el?.closest?.(".react-flow__pane")) return;

      setIsDrawing(true);
      drawKindRef.current = tool === "circle" ? "circle" : "rect";

      const start = rf.current.screenToFlowPosition({
        x: evt.clientX,
        y: evt.clientY,
      });
      drawStartRef.current = start;

      const draftId = nanoid(8);
      draftIdRef.current = draftId;

      const draftNode: Node = {
        id: draftId,
        type: "default",
        position: start,
        data: { label: "" },
        style:
          drawKindRef.current === "circle"
            ? circleStyle(CIRCLE_MIN_W, CIRCLE_MIN_H)
            : rectStyle(RECT_MIN_W, RECT_MIN_H),
      };

      setNodes((prev) => [...prev, draftNode]);
    },
    [isDrawMode, tool]
  );

  // ✅ update drawing using onPaneMouseMove (supported by ReactFlow)
  const onPaneMouseMove = useCallback(
    (evt: React.MouseEvent) => {
      if (!rf.current) return;
      if (!isDrawing) return;

      const start = drawStartRef.current;
      const idd = draftIdRef.current;
      if (!start || !idd) return;

      const now = rf.current.screenToFlowPosition({
        x: evt.clientX,
        y: evt.clientY,
      });

      const x1 = Math.min(start.x, now.x);
      const y1 = Math.min(start.y, now.y);
      const x2 = Math.max(start.x, now.x);
      const y2 = Math.max(start.y, now.y);

      const w = x2 - x1;
      const h = y2 - y1;

      const kind = drawKindRef.current;

      setNodes((prev) =>
        prev.map((n) =>
          n.id !== idd
            ? n
            : {
                ...n,
                position: { x: x1, y: y1 },
                style: kind === "circle" ? circleStyle(w, h) : rectStyle(w, h),
              }
        )
      );
    },
    [isDrawing]
  );

  // ✅ end drawing using onMouseUp
  const onMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    drawStartRef.current = null;
    draftIdRef.current = null;
  }, [isDrawing]);

  // safety: mouseup outside canvas
  useEffect(() => {
    const onWinUp = () => {
      if (isDrawing) {
        setIsDrawing(false);
        drawStartRef.current = null;
        draftIdRef.current = null;
      }
    };
    window.addEventListener("mouseup", onWinUp);
    return () => window.removeEventListener("mouseup", onWinUp);
  }, [isDrawing]);

  const cursorClass =
    tool === "rect" || tool === "circle"
      ? "cursor-crosshair"
      : tool === "text"
      ? "cursor-text"
      : tool === "arrow"
      ? "cursor-cell"
      : "cursor-default";

  return (
    <div className={`relative h-full w-full bg-neutral-950 ${cursorClass}`}>
      <CanvasTopBar title={title} setTitle={setTitle} />

      <CanvasLeftTools
        tool={tool}
        setTool={setTool}
        onAIClick={onAIClick}
        onAddNode={onAddNode}
      />

      <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
        {nodes.length === 0 ? (
          <div className="pointer-events-auto">
            <Button
              variant="secondary"
              className="gap-2 rounded-xl border bg-background/10 text-foreground hover:bg-background/20"
              onClick={onAIClick}
            >
              <Sparkles className="h-4 w-4" />
              Generate AI Diagram
              <span className="ml-2 rounded-md border bg-background/10 px-2 py-0.5 text-xs text-muted-foreground">
                ⌘ J
              </span>
            </Button>
          </div>
        ) : null}
      </div>

      <div className="absolute inset-0 pt-12">
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={(inst) => (rf.current = inst)}
          defaultViewport={defaultViewport}
          fitView
          // ✅ events
          onPaneClick={onPaneClick}
          onMouseDown={onMouseDown}
          onPaneMouseMove={onPaneMouseMove}
          onMouseUp={onMouseUp}
          // behaviors
          nodesConnectable={isConnectMode}
          elementsSelectable={!isConnectMode}
          panOnDrag={!isDrawMode && !isConnectMode}
        >
          <Background />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>

      <div className="absolute bottom-3 right-3 z-20 rounded-xl border bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
        {isConnectMode
          ? "Connect mode (A): drag from node handle"
          : tool === "rect"
          ? isDrawing
            ? "Drawing rectangle..."
            : "Rect mode (R): drag to draw"
          : tool === "circle"
          ? isDrawing
            ? "Drawing circle..."
            : "Circle mode (O): drag to draw"
          : tool === "text"
          ? "Text mode (T): click to place"
          : saving
          ? "Saving..."
          : "Saved"}
      </div>
    </div>
  );
}