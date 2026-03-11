"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = {
  id: string;
  role: "user" | "ai";
  text: string;
  streaming?: boolean;
};

function uid() {
  // crypto.randomUUID() မရတဲ့ env မျိုးအတွက် fallback ပါ
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(16).slice(2);
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const streamTimer = useRef<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (streamTimer.current) window.clearInterval(streamTimer.current);
    };
  }, []);

  async function smartParseOutcome(input: string) {
    const r = await fetch("/api/ai/parse-outcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
    });
    if (!r.ok) throw new Error("AI error");
    return await r.json();
  }

  async function saveOutcome(ai: any) {
    await fetch("/api/outcomes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: ai.amount ?? "",
        shop: ai.shop ?? "",
        bank: ai.bank ?? "true",
        notice: `[#${ai.category ?? "Unknown"}] ${ai.notice ?? ""}`.trim(),
        date: new Date().toISOString(),
      }),
    });
  }

  function streamAIText(fullText: string) {
    const aiId = uid();

    // 1) add empty AI message
    setMessages((p) => [...p, { id: aiId, role: "ai", text: "", streaming: true }]);

    // 2) typewriter effect
    let i = 0;
    const speedMs = 12; // ChatGPT feel (adjust 8~20)

    if (streamTimer.current) window.clearInterval(streamTimer.current);

    streamTimer.current = window.setInterval(() => {
      i += 1;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId
            ? {
                ...m,
                text: fullText.slice(0, i),
                streaming: i < fullText.length,
              }
            : m
        )
      );

      if (i >= fullText.length) {
        if (streamTimer.current) window.clearInterval(streamTimer.current);
        streamTimer.current = null;
      }
    }, speedMs);
  }

  async function send() {
    const t = text.trim();
    if (!t || loading) return;

    // add user msg immediately
    setMessages((p) => [...p, { id: uid(), role: "user", text: t }]);
    setText("");
    setLoading(true);

    try {
      const ai = await smartParseOutcome(t);

      const reply =
        `Amount: ${ai.amount ?? "-"}\n` +
        `Shop: ${ai.shop ?? "-"}\n` +
        `Category: ${ai.category ?? "-"} (${typeof ai.confidence === "number" ? ai.confidence.toFixed(2) : ai.confidence ?? "-"})\n` +
        `Note: ${ai.notice ?? "-"}`;

      // Start streaming UI
      streamAIText(reply);

      // Save to Mongo (non-blocking feel)
      saveOutcome(ai).catch(console.error);
    } catch (e) {
      console.error(e);
      streamAIText("❌ AI error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* CHAT */}
      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`mb-4 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={[
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted",
              ].join(" ")}
            >
              {m.text}
              {/* caret while streaming */}
              {m.role === "ai" && m.streaming ? (
                <span className="ml-1 inline-block w-2 animate-pulse">▍</span>
              ) : null}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-xs text-muted-foreground">AI thinking…</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="border-t bg-background p-3">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Type: "FamilyMart lunch 950"'
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <Button onClick={send} disabled={loading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}