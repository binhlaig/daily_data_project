"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Chat = { id: string; title: string; updatedAt: string | null };
type Msg = { id: string; role: "user" | "ai"; text: string; createdAt: string | null };

export default function ProChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadChats() {
    const r = await fetch("/api/chats", { cache: "no-store" });
    const d = await r.json();
    setChats(d);
    if (!activeChatId && d?.[0]?.id) setActiveChatId(d[0].id);
  }

  async function loadMessages(chatId: string) {
    const r = await fetch(`/api/chats/${chatId}/messages`, { cache: "no-store" });
    const d = await r.json();
    setMessages(d);
  }

  useEffect(() => {
    loadChats().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeChatId) loadMessages(activeChatId).catch(console.error);
  }, [activeChatId]);

  async function newChat() {
    const r = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Chat" }),
    });
    const c = await r.json();
    setChats((p) => [c, ...p]);
    setActiveChatId(c.id);
    setMessages([]);
  }

  async function deleteChat(chatId: string) {
    await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
    setChats((p) => p.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      const next = chats.find((c) => c.id !== chatId)?.id ?? null;
      setActiveChatId(next);
      setMessages([]);
    }
  }

  async function send() {
    const t = text.trim();
    if (!t || !activeChatId || loading) return;

    // optimistic user bubble
    setMessages((p) => [...p, { id: crypto.randomUUID(), role: "user", text: t, createdAt: new Date().toISOString() }]);
    setText("");
    setLoading(true);

    try {
      const r = await fetch(`/api/chats/${activeChatId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });

      const d = await r.json();
      if (!r.ok) throw new Error(d?.error ?? "Send failed");

      // replace messages with fresh load (simple + consistent)
      await loadChats();
      await loadMessages(activeChatId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const activeTitle = useMemo(
    () => chats.find((c) => c.id === activeChatId)?.title ?? "Chat",
    [chats, activeChatId]
  );

  return (
    <div className="flex h-screen bg-background">
      {/* SIDEBAR */}
      <aside className="w-72 border-r p-3 hidden md:flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold">BINHLAIG Chats</div>
          <Button size="icon" variant="secondary" onClick={newChat} title="New chat">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto space-y-1">
          {chats.map((c) => {
            const active = c.id === activeChatId;
            return (
              <button
                key={c.id}
                onClick={() => setActiveChatId(c.id)}
                className={[
                  "w-full rounded-xl border px-3 py-2 text-left transition",
                  active ? "bg-muted border-border" : "border-transparent hover:border-border/60 hover:bg-muted/40",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-medium">{c.title}</div>
                  <span
                    className="text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteChat(c.id);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground truncate">
                  {c.updatedAt ?? ""}
                </div>
              </button>
            );
          })}
        </div>

        <Button className="mt-3" variant="secondary" onClick={newChat}>
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </aside>

      {/* MAIN */}
      <main className="flex flex-1 flex-col">
        {/* TOP */}
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div className="font-semibold truncate">{activeTitle}</div>
          <div className="md:hidden">
            <Button size="sm" variant="secondary" onClick={newChat}>
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          </div>
        </div>

        {/* CHAT */}
        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full">
          {messages.map((m) => (
            <div key={m.id} className={`mb-4 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={[
                  "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                ].join(" ")}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && <div className="text-xs text-muted-foreground">AI thinking…</div>}
          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div className="border-t p-3 bg-background">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Type: "FamilyMart lunch 950"'
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              disabled={!activeChatId}
            />
            <Button onClick={send} disabled={!activeChatId || loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}