// // "use client";

// // import React, { useEffect, useMemo, useRef, useState } from "react";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import { ScrollArea } from "@/components/ui/scroll-area";
// // import { Separator } from "@/components/ui/separator";
// // import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// // import { detectLang } from "@/lib/detectLang";

// // import {
// //   Menu,
// //   Plus,
// //   Mic,
// //   Send,
// //   PanelLeftClose,
// //   PanelLeftOpen,
// //   Eye,
// //   Pencil,
// // } from "lucide-react";

// // import NoteMarkdown from "@/components/note_code/NoteMarkdown";
// // import { toastPromise6s } from "@/lib/toastPromise";

// // type Note = {
// //   id: string;
// //   title: string;
// //   content: string;
// //   updatedAt: number;
// // };

// // const SIDEBAR_KEY = "binhlaig_code_notes_sidebar_open_full_v1";
// // const VIEW_KEY = "binhlaig_code_notes_view_mode_v1";

// // function fmtTime(ts: number) {
// //   const d = new Date(ts);
// //   return d.toLocaleString(undefined, { month: "short", day: "2-digit" });
// // }

// // export default function CodeNotesPage() {
// //   const [notes, setNotes] = useState<Note[]>([]);
// //   const [activeId, setActiveId] = useState<string | null>(null);
// //   const [sidebarOpen, setSidebarOpen] = useState(true);

// //   const [q, setQ] = useState("");
// //   const [composer, setComposer] = useState("");

// //   const [viewMode, setViewMode] = useState<"result" | "editor">("result");

// //   // optional: show saving state
// //   const [saving, setSaving] = useState(false);

// //   // debounce timer
// //   const saveTimer = useRef<any>(null);

// //   const active = useMemo(
// //     () => notes.find((n) => n.id === activeId) ?? null,
// //     [notes, activeId]
// //   );

// //   const filtered = useMemo(() => {
// //     const s = q.trim().toLowerCase();
// //     if (!s) return notes;
// //     return notes.filter(
// //       (n) =>
// //         n.title.toLowerCase().includes(s) ||
// //         n.content.toLowerCase().includes(s)
// //     );
// //   }, [notes, q]);

// //   // ✅ Load from API
// //   useEffect(() => {
// //     const sb = localStorage.getItem(SIDEBAR_KEY);
// //     const vm = localStorage.getItem(VIEW_KEY);

// //     if (sb) setSidebarOpen(sb === "1");
// //     if (vm === "editor" || vm === "result") setViewMode(vm);

// //     (async () => {
// //       try {
// //         const res = await fetch("/api/notes", { cache: "no-store" });
// //         const data: Note[] = await res.json();
// //         setNotes(data);
// //         setActiveId(data?.[0]?.id ?? null);

// //         // if no notes, create one automatically
// //         if (!data || data.length === 0) {
// //           const created = await createNoteApi();
// //           setNotes([created]);
// //           setActiveId(created.id);
// //         }
// //       } catch (e) {
// //         console.error(e);
// //       }
// //     })();
// //   }, []);

// //   useEffect(() => {
// //     localStorage.setItem(SIDEBAR_KEY, sidebarOpen ? "1" : "0");
// //   }, [sidebarOpen]);

// //   useEffect(() => {
// //     localStorage.setItem(VIEW_KEY, viewMode);
// //   }, [viewMode]);

// //   // ---------------- API helpers ----------------
// //   async function createNoteApi(): Promise<Note> {
// //     const res = await fetch("/api/notes", {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({ title: "Untitled", content: "" }),
// //     });
// //     if (!res.ok) throw new Error("Create note failed");
// //     return await res.json();
// //   }

// //   async function patchNoteApi(id: string, patch: Partial<Note>) {
// //     const res = await fetch(`/api/notes/${id}`, {
// //       method: "PATCH",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify(patch),
// //     });
// //     if (!res.ok) throw new Error("Update note failed");
// //     return await res.json();
// //   }

// //   async function deleteNoteApi(id: string) {
// //     const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
// //     if (!res.ok) throw new Error("Delete note failed");
// //     return await res.json();
// //   }

// //   // ---------------- actions ----------------
// //   const createNote = async () => {
// //     await toastPromise6s(
// //       async () => {
// //         const n = await createNoteApi();
// //         setNotes((p) => [n, ...p]);
// //         setActiveId(n.id);
// //         return n;
// //       },
// //       {
// //         loading: "Creating note… ⏳",
// //         success: (n) => `Created ✅ (${n.title || "Untitled"})`,
// //         error: (e) => `Create failed ❌: ${e?.message ?? ""}`,
// //       }
// //     );
// //   };

// //   const updateActive = (patch: Partial<Note>) => {
// //     if (!activeId) return;

// //     // optimistic update
// //     setNotes((prev) =>
// //       prev.map((n) =>
// //         n.id === activeId ? { ...n, ...patch, updatedAt: Date.now() } : n
// //       )
// //     );

// //     // debounce save to API
// //     if (saveTimer.current) clearTimeout(saveTimer.current);

// //     saveTimer.current = setTimeout(async () => {
// //       try {
// //         setSaving(true);
// //         await patchNoteApi(activeId, patch);
// //       } catch (e) {
// //         console.error(e);
// //       } finally {
// //         setSaving(false);
// //       }
// //     }, 400);
// //   };

// //   const deleteActive = async () => {
// //     if (!activeId) return;
// //     if (notes.length <= 1) return;

// //     const id = activeId;
// //     const idx = notes.findIndex((n) => n.id === id);
// //     const nextId =
// //       notes[idx + 1]?.id ?? notes[idx - 1]?.id ?? notes[0]?.id ?? null;

// //     // optimistic UI
// //     setNotes((p) => p.filter((n) => n.id !== id));
// //     setActiveId(nextId);

// //     try {
// //       await deleteNoteApi(id);
// //     } catch (e) {
// //       console.error(e);
// //     }
// //   };

// //   const sendToNote = () => {
// //     const text = composer.trim();
// //     if (!text) return;

// //     if (!activeId) {
// //       // if none, create then append
// //       (async () => {
// //         const n = await createNoteApi();
// //         setNotes((p) => [n, ...p]);
// //         setActiveId(n.id);

// //         const next = (n.content ? n.content + "\n\n" : "") + text;
// //         updateActive({ content: next });
// //         setComposer("");
// //       })();
// //       return;
// //     }

// //     const next = (active?.content ? active.content + "\n\n" : "") + text;
// //     updateActive({ content: next });
// //     setComposer("");
// //   };

// //   // Sidebar UI
// //   const SidebarContent = (
// //     <div className="flex h-full flex-col">
// //       <div className="flex items-center justify-between gap-2 p-3">
// //         <div className="text-sm font-semibold">Code Notes</div>
// //         <Button size="sm" onClick={createNote}>
// //           <Plus className="mr-2 h-4 w-4" />
// //           New
// //         </Button>
// //       </div>

// //       {/* Result / Editor buttons in sidebar */}
// //       <div className="px-3 pb-3">
// //         <div className="grid grid-cols-2 gap-2">
// //           <Button
// //             variant={viewMode === "result" ? "default" : "secondary"}
// //             className="w-full justify-start"
// //             onClick={() => setViewMode("result")}
// //           >
// //             <Eye className="mr-2 h-4 w-4" />
// //             Result
// //           </Button>

// //           <Button
// //             variant={viewMode === "editor" ? "default" : "secondary"}
// //             className="w-full justify-start"
// //             onClick={() => setViewMode("editor")}
// //           >
// //             <Pencil className="mr-2 h-4 w-4" />
// //             Editor
// //           </Button>
// //         </div>

// //         {/* optional saving indicator */}
// //         <div className="mt-2 text-[11px] text-muted-foreground">
// //           {saving ? "Saving..." : active ? `Updated: ${fmtTime(active.updatedAt)}` : ""}
// //         </div>
// //       </div>

// //       <div className="px-3 pb-3">
// //         <Input
// //           value={q}
// //           onChange={(e) => setQ(e.target.value)}
// //           placeholder="Search notes..."
// //           className="bg-background/40"
// //         />
// //       </div>

// //       <Separator className="opacity-40" />

// //       <ScrollArea className="flex-1">
// //         <div className="p-2 space-y-1">
// //           {filtered.map((n) => {
// //             const isActive = n.id === activeId;
// //             return (
// //               <button
// //                 key={n.id}
// //                 onClick={() => setActiveId(n.id)}
// //                 className={[
// //                   "w-full rounded-xl border px-3 py-2 text-left transition",
// //                   isActive
// //                     ? "border-border bg-accent/40"
// //                     : "border-transparent hover:border-border/60 hover:bg-accent/20",
// //                 ].join(" ")}
// //               >
// //                 <div className="truncate text-sm font-medium">{n.title}</div>
// //                 <div className="mt-1 text-xs text-muted-foreground">
// //                   {fmtTime(n.updatedAt)}
// //                 </div>
// //               </button>
// //             );
// //           })}
// //         </div>
// //       </ScrollArea>

// //       <div className="p-3 space-y-2">
// //         <Button
// //           variant="secondary"
// //           className="w-full"
// //           onClick={deleteActive}
// //           disabled={notes.length <= 1}
// //         >
// //           Delete
// //         </Button>
// //       </div>
// //     </div>
// //   );

// //   return (
// //     <div className="min-h-screen bg-background text-foreground">
// //       {/* TOP BAR */}
// //       <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
// //         <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
// //           <div className="flex items-center gap-2">
// //             {/* MOBILE DRAWER */}
// //             <div className="md:hidden">
// //               <Sheet>
// //                 <SheetTrigger asChild>
// //                   <Button variant="secondary" size="sm">
// //                     <Menu className="h-4 w-4" />
// //                   </Button>
// //                 </SheetTrigger>

// //                 <SheetContent side="left" className="p-0 w-80">
// //                   <div className="h-full">{SidebarContent}</div>
// //                 </SheetContent>
// //               </Sheet>
// //             </div>

// //             {/* DESKTOP COLLAPSE */}
// //             <div className="hidden md:block">
// //               <Button
// //                 variant="secondary"
// //                 size="sm"
// //                 onClick={() => setSidebarOpen((v) => !v)}
// //                 title="Toggle sidebar"
// //               >
// //                 {sidebarOpen ? (
// //                   <PanelLeftClose className="h-4 w-4" />
// //                 ) : (
// //                   <PanelLeftOpen className="h-4 w-4" />
// //                 )}
// //               </Button>
// //             </div>

// //             <div className="ml-1">
// //               <div className="text-sm font-semibold">BINHLAIG</div>
// //               <div className="text-xs text-muted-foreground">Code Notes</div>
// //             </div>
// //           </div>

// //           <Button variant="secondary" size="sm" onClick={createNote}>
// //             <Plus className="mr-2 h-4 w-4" />
// //             New
// //           </Button>
// //         </div>
// //       </div>

// //       {/* BODY ✅ padding-bottom to avoid fixed composer overlap */}
// //       <div className="mx-auto flex max-w-6xl gap-4 px-4 py-6 pb-28">
// //         {/* SIDEBAR */}
// //         <aside
// //           className={[
// //             "hidden md:block h-[calc(100vh-140px)] overflow-hidden rounded-xl border bg-card/30",
// //             sidebarOpen ? "w-72" : "w-0 border-transparent",
// //           ].join(" ")}
// //         >
// //           {sidebarOpen && SidebarContent}
// //         </aside>

// //         {/* MAIN */}
// //         <main className="flex-1">
// //           {viewMode === "result" ? (
// //             <ScrollArea className="">
// //               <div className="p-4">
// //                 <NoteMarkdown content={active?.content ?? ""} />
// //               </div>
// //             </ScrollArea>
// //           ) : (
// //             <textarea
// //               value={active?.content ?? ""}
// //               onChange={(e) => updateActive({ content: e.target.value })}
// //               placeholder="Write markdown here..."
// //               className="h-[calc(100vh-240px)] w-full rounded-xl border bg-background/10 p-4 font-mono text-sm leading-7 outline-none"
// //               onPaste={(e) => {
// //                 const text = e.clipboardData.getData("text");
// //                 if (!text) return;

// //                 const trimmed = text.trim();
// //                 if (!trimmed) return;

// //                 const isMultiLine = trimmed.includes("\n");
// //                 const looksLikeCommand =
// //                   /^(npm|pnpm|yarn|npx|git|docker|docker-compose|kubectl|helm|curl|wget|ssh|python|python3|pip|pip3|java|mvn|gradle|go|cargo)\b/i.test(
// //                     trimmed
// //                   );

// //                 if (!isMultiLine && !looksLikeCommand) return;

// //                 e.preventDefault();

// //                 const lang = detectLang(trimmed);
// //                 const wrapped = `\n\`\`\`${lang}\n${trimmed}\n\`\`\`\n`;

// //                 const target = e.target as HTMLTextAreaElement;
// //                 const start = target.selectionStart;
// //                 const end = target.selectionEnd;

// //                 const currentValue = active?.content ?? "";
// //                 const newValue =
// //                   currentValue.substring(0, start) +
// //                   wrapped +
// //                   currentValue.substring(end);

// //                 updateActive({ content: newValue });
// //               }}
// //             />
// //           )}
// //         </main>
// //       </div>

// //       {/* BOTTOM COMPOSER */}
// //       <div className="fixed inset-x-0 bottom-0 z-20">
// //         <div className="mx-auto max-w-6xl px-4 pb-4">
// //           <div className="rounded-3xl border bg-background/80 px-3 py-3 shadow backdrop-blur">
// //             <div className="flex items-center gap-2">
// //               <Button
// //                 variant="secondary"
// //                 size="icon"
// //                 className="rounded-full"
// //                 onClick={createNote}
// //                 title="New note"
// //               >
// //                 <Plus className="h-4 w-4" />
// //               </Button>

// //               <Input
// //                 value={composer}
// //                 onChange={(e) => setComposer(e.target.value)}
// //                 placeholder="Write note text…"
// //                 className="h-11 flex-1 rounded-full bg-background/30"
// //                 onKeyDown={(e) => {
// //                   if (e.key === "Enter") sendToNote();
// //                 }}
// //               />

// //               <Button
// //                 variant="secondary"
// //                 size="icon"
// //                 className="rounded-full"
// //                 title="Voice (later)"
// //                 onClick={() => {}}
// //               >
// //                 <Mic className="h-4 w-4" />
// //               </Button>

// //               <Button size="icon" className="rounded-full" onClick={sendToNote}>
// //                 <Send className="h-4 w-4" />
// //               </Button>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// "use client";

// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Separator } from "@/components/ui/separator";
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";

// import { detectLang } from "@/lib/detectLang";
// import { toastPromise6s } from "@/lib/toastPromise";

// import {
//   Menu,
//   Plus,
//   Mic,
//   Send,
//   PanelLeftClose,
//   PanelLeftOpen,
//   Eye,
//   Pencil,
// } from "lucide-react";

// import NoteMarkdown from "@/components/note_code/NoteMarkdown";
// import UltimateMarkdownEditor from "@/components/note_code/UltimateMarkdownEditor";

// type Note = {
//   id: string;
//   title: string; // folder/name
//   content: string;
//   updatedAt: number;
// };

// const SIDEBAR_KEY = "binhlaig_code_notes_sidebar_open_full_v1";
// const VIEW_KEY = "binhlaig_code_notes_view_mode_v1";

// function fmtTime(ts: number) {
//   const d = new Date(ts);
//   return d.toLocaleString(undefined, { month: "short", day: "2-digit" });
// }

// export default function CodeNotesPage() {
//   const [notes, setNotes] = useState<Note[]>([]);
//   const [activeId, setActiveId] = useState<string | null>(null);
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   const [q, setQ] = useState("");
//   const [composer, setComposer] = useState("");

//   const [viewMode, setViewMode] = useState<"result" | "editor">("result");

//   // optional: show saving state
//   const [saving, setSaving] = useState(false);

//   // debounce timer
//   const saveTimer = useRef<any>(null);

//   // ✅ New dialog state (folder name first)
//   const [newOpen, setNewOpen] = useState(false);
//   const [newTitle, setNewTitle] = useState("");

//   const active = useMemo(() => notes.find((n) => n.id === activeId) ?? null, [
//     notes,
//     activeId,
//   ]);

//   const filtered = useMemo(() => {
//     const s = q.trim().toLowerCase();
//     if (!s) return notes;
//     return notes.filter(
//       (n) =>
//         n.title.toLowerCase().includes(s) || n.content.toLowerCase().includes(s)
//     );
//   }, [notes, q]);

//   // ✅ Load from API
//   useEffect(() => {
//     const sb = localStorage.getItem(SIDEBAR_KEY);
//     const vm = localStorage.getItem(VIEW_KEY);

//     if (sb) setSidebarOpen(sb === "1");
//     if (vm === "editor" || vm === "result") setViewMode(vm);

//     (async () => {
//       try {
//         const res = await fetch("/api/notes", { cache: "no-store" });
//         const data: Note[] = await res.json();

//         setNotes(data);
//         setActiveId(data?.[0]?.id ?? null);

//         // ✅ If no notes, open create dialog instead of auto-creating
//         if (!data || data.length === 0) {
//           setNewTitle("");
//           setNewOpen(true);
//         }
//       } catch (e) {
//         console.error(e);
//       }
//     })();
//   }, []);

//   useEffect(() => {
//     localStorage.setItem(SIDEBAR_KEY, sidebarOpen ? "1" : "0");
//   }, [sidebarOpen]);

//   useEffect(() => {
//     localStorage.setItem(VIEW_KEY, viewMode);
//   }, [viewMode]);

//   // ---------------- API helpers ----------------
//   async function createNoteApi(title: string): Promise<Note> {
//     const res = await fetch("/api/notes", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ title: title.trim(), content: "" }),
//     });
//     if (!res.ok) throw new Error("Create note failed");
//     return await res.json();
//   }

//   async function patchNoteApi(id: string, patch: Partial<Note>) {
//     const res = await fetch(`/api/notes/${id}`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(patch),
//     });
//     if (!res.ok) throw new Error("Update note failed");
//     return await res.json();
//   }

//   async function deleteNoteApi(id: string) {
//     const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
//     if (!res.ok) throw new Error("Delete note failed");
//     return await res.json();
//   }

//   // ---------------- dialog actions ----------------
//   const openCreateDialog = () => {
//     setNewTitle("");
//     setNewOpen(true);
//   };

//   const confirmCreate = async () => {
//     const title = newTitle.trim();
//     if (!title) return;

//     await toastPromise6s(
//       async () => {
//         const n = await createNoteApi(title);
//         setNotes((p) => [n, ...p]);
//         setActiveId(n.id);
//         return n;
//       },
//       {
//         loading: "Creating folder… ⏳",
//         success: (n) => `Created ✅ (${n.title})`,
//         error: (e) => `Create failed ❌: ${e?.message ?? ""}`,
//       }
//     );

//     setNewOpen(false);
//     setNewTitle("");
//   };

//   // ---------------- actions ----------------
//   const updateActive = (patch: Partial<Note>) => {
//     if (!activeId) return;

//     // optimistic update
//     setNotes((prev) =>
//       prev.map((n) =>
//         n.id === activeId ? { ...n, ...patch, updatedAt: Date.now() } : n
//       )
//     );

//     // debounce save to API
//     if (saveTimer.current) clearTimeout(saveTimer.current);

//     saveTimer.current = setTimeout(async () => {
//       try {
//         setSaving(true);
//         await patchNoteApi(activeId, patch);
//       } catch (e) {
//         console.error(e);
//       } finally {
//         setSaving(false);
//       }
//     }, 400);
//   };

//   const deleteActive = async () => {
//     if (!activeId) return;
//     if (notes.length <= 1) return;

//     const id = activeId;
//     const idx = notes.findIndex((n) => n.id === id);
//     const nextId =
//       notes[idx + 1]?.id ?? notes[idx - 1]?.id ?? notes[0]?.id ?? null;

//     // optimistic UI
//     setNotes((p) => p.filter((n) => n.id !== id));
//     setActiveId(nextId);

//     await toastPromise6s(
//       async () => {
//         await deleteNoteApi(id);
//         return true;
//       },
//       {
//         loading: "Deleting note… ⏳",
//         success: "Deleted ✅",
//         error: (e) => `Delete failed ❌: ${e?.message ?? ""}`,
//       }
//     );
//   };

//   const sendToNote = () => {
//     const text = composer.trim();
//     if (!text) return;

//     if (!activeId) {
//       // if none selected, ask to create first
//       openCreateDialog();
//       return;
//     }

//     const next = (active?.content ? active.content + "\n\n" : "") + text;
//     updateActive({ content: next });
//     setComposer("");
//   };

//   // Sidebar UI
//   const SidebarContent = (
//     <div className="flex h-full flex-col">
//       <div className="flex items-center justify-between gap-2 p-3">
//         <div className="text-sm font-semibold">Code Notes</div>
//         <Button size="sm" onClick={openCreateDialog}>
//           <Plus className="mr-2 h-4 w-4" />
//           New
//         </Button>
//       </div>

//       {/* Result / Editor buttons in sidebar */}
//       <div className="px-3 pb-3">
//         <div className="grid grid-cols-2 gap-2">
//           <Button
//             variant={viewMode === "result" ? "default" : "secondary"}
//             className="w-full justify-start"
//             onClick={() => setViewMode("result")}
//           >
//             <Eye className="mr-2 h-4 w-4" />
//             Result
//           </Button>

//           <Button
//             variant={viewMode === "editor" ? "default" : "secondary"}
//             className="w-full justify-start"
//             onClick={() => setViewMode("editor")}
//           >
//             <Pencil className="mr-2 h-4 w-4" />
//             Editor
//           </Button>
//         </div>

//         {/* optional saving indicator */}
//         <div className="mt-2 text-[11px] text-muted-foreground">
//           {saving
//             ? "Saving..."
//             : active
//             ? `Updated: ${fmtTime(active.updatedAt)}`
//             : ""}
//         </div>
//       </div>

//       <div className="px-3 pb-3">
//         <Input
//           value={q}
//           onChange={(e) => setQ(e.target.value)}
//           placeholder="Search notes..."
//           className="bg-background/40"
//         />
//       </div>

//       <Separator className="opacity-40" />

//       <ScrollArea className="flex-1">
//         <div className="p-2 space-y-1">
//           {filtered.map((n) => {
//             const isActive = n.id === activeId;
//             return (
//               <button
//                 key={n.id}
//                 onClick={() => setActiveId(n.id)}
//                 className={[
//                   "w-full rounded-xl border px-3 py-2 text-left transition",
//                   isActive
//                     ? "border-border bg-accent/40"
//                     : "border-transparent hover:border-border/60 hover:bg-accent/20",
//                 ].join(" ")}
//               >
//                 <div className="truncate text-sm font-medium">{n.title}</div>
//                 <div className="mt-1 text-xs text-muted-foreground">
//                   {fmtTime(n.updatedAt)}
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       </ScrollArea>

//       <div className="p-3 space-y-2">
//         <Button
//           variant="secondary"
//           className="w-full"
//           onClick={deleteActive}
//           disabled={notes.length <= 1}
//         >
//           Delete
//         </Button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-background text-foreground">
//       {/* TOP BAR */}
//       <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
//         <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
//           <div className="flex items-center gap-2">
//             {/* MOBILE DRAWER */}
//             <div className="md:hidden">
//               <Sheet>
//                 <SheetTrigger asChild>
//                   <Button variant="secondary" size="sm">
//                     <Menu className="h-4 w-4" />
//                   </Button>
//                 </SheetTrigger>

//                 <SheetContent side="left" className="p-0 w-80">
//                   <div className="h-full">{SidebarContent}</div>
//                 </SheetContent>
//               </Sheet>
//             </div>

//             {/* DESKTOP COLLAPSE */}
//             <div className="hidden md:block">
//               <Button
//                 variant="secondary"
//                 size="sm"
//                 onClick={() => setSidebarOpen((v) => !v)}
//                 title="Toggle sidebar"
//               >
//                 {sidebarOpen ? (
//                   <PanelLeftClose className="h-4 w-4" />
//                 ) : (
//                   <PanelLeftOpen className="h-4 w-4" />
//                 )}
//               </Button>
//             </div>

//             <div className="ml-1">
//               <div className="text-sm font-semibold">BINHLAIG</div>
//               <div className="text-xs text-muted-foreground">Code Notes</div>
//             </div>
//           </div>

//           <Button variant="secondary" size="sm" onClick={openCreateDialog}>
//             <Plus className="mr-2 h-4 w-4" />
//             New
//           </Button>
//         </div>
//       </div>

//       {/* BODY ✅ padding-bottom to avoid fixed composer overlap */}
//       <div className="mx-auto flex max-w-6xl gap-4 px-4 py-6 pb-28">
//         {/* SIDEBAR */}
//         <aside
//           className={[
//             "hidden md:block h-[calc(100vh-140px)] overflow-hidden rounded-xl border bg-card/30",
//             sidebarOpen ? "w-72" : "w-0 border-transparent",
//           ].join(" ")}
//         >
//           {sidebarOpen && SidebarContent}
//         </aside>

//         {/* MAIN */}
//         <main className="flex-1">
//           {viewMode === "result" ? (
//             <ScrollArea className="">
//               <div className="p-4">
//                 <NoteMarkdown content={active?.content ?? ""} />
//               </div>
//             </ScrollArea>
//           ) : (
//             <textarea
//               value={active?.content ?? ""}
//               onChange={(e) => updateActive({ content: e.target.value })}
//               placeholder="Write markdown here..."
//               className="h-[calc(100vh-240px)] w-full rounded-xl border bg-background/10 p-4 font-mono text-sm leading-7 outline-none"
//               onPaste={(e) => {
//                 const text = e.clipboardData.getData("text");
//                 if (!text) return;

//                 const trimmed = text.trim();
//                 if (!trimmed) return;

//                 const isMultiLine = trimmed.includes("\n");
//                 const looksLikeCommand = /^(npm|pnpm|yarn|npx|git|docker|docker-compose|kubectl|helm|curl|wget|ssh|python|python3|pip|pip3|java|mvn|gradle|go|cargo)\b/i.test(
//                   trimmed
//                 );

//                 if (!isMultiLine && !looksLikeCommand) return;

//                 e.preventDefault();

//                 const lang = detectLang(trimmed);
//                 const wrapped = `\n\`\`\`${lang}\n${trimmed}\n\`\`\`\n`;

//                 const target = e.target as HTMLTextAreaElement;
//                 const start = target.selectionStart;
//                 const end = target.selectionEnd;

//                 const currentValue = active?.content ?? "";
//                 const newValue =
//                   currentValue.substring(0, start) +
//                   wrapped +
//                   currentValue.substring(end);

//                 updateActive({ content: newValue });
//               }}
//             />
//           )}
//         </main>
//       </div>

//       {/* BOTTOM COMPOSER */}
//       <div className="fixed inset-x-0 bottom-0 z-20">
//         <div className="mx-auto max-w-6xl px-4 pb-4">
//           <div className="rounded-3xl border bg-background/80 px-3 py-3 shadow backdrop-blur">
//             <div className="flex items-center gap-2">
//               <Button
//                 variant="secondary"
//                 size="icon"
//                 className="rounded-full"
//                 onClick={openCreateDialog}
//                 title="New note"
//               >
//                 <Plus className="h-4 w-4" />
//               </Button>

//               <Input
//                 value={composer}
//                 onChange={(e) => setComposer(e.target.value)}
//                 placeholder="Write note text…"
//                 className="h-11 flex-1 rounded-full bg-background/30"
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") sendToNote();
//                 }}
//               />

//               <Button
//                 variant="secondary"
//                 size="icon"
//                 className="rounded-full"
//                 title="Voice (later)"
//                 onClick={() => {}}
//               >
//                 <Mic className="h-4 w-4" />
//               </Button>

//               <Button size="icon" className="rounded-full" onClick={sendToNote}>
//                 <Send className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ✅ CREATE DIALOG (Folder name first) */}
//       <Dialog open={newOpen} onOpenChange={setNewOpen}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>Create new folder</DialogTitle>
//           </DialogHeader>

//           <div className="space-y-2">
//             <Label>Folder name</Label>
//             <Input
//               value={newTitle}
//               onChange={(e) => setNewTitle(e.target.value)}
//               placeholder="e.g. Spring Boot Notes"
//               autoFocus
//               onKeyDown={(e) => {
//                 if (e.key === "Enter") confirmCreate();
//               }}
//             />
//             <div className="text-xs text-muted-foreground">
//               Enter နိုပ်ရင် create လုပ်မယ်။
//             </div>
//           </div>

//           <DialogFooter className="gap-2 sm:gap-0">
//             <Button variant="secondary" onClick={() => setNewOpen(false)}>
//               Cancel
//             </Button>
//             <Button onClick={confirmCreate} disabled={!newTitle.trim()}>
//               Create
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }




"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { detectLang } from "@/lib/detectLang";
import { toastPromise6s } from "@/lib/toastPromise";

import {
  Menu,
  Plus,
  Mic,
  Send,
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  Pencil,
  Smile, // ✅ added
} from "lucide-react";

import NoteMarkdown from "@/components/note_code/NoteMarkdown";

type Note = {
  id: string;
  title: string; // folder/name
  content: string;
  updatedAt: number;
};

const SIDEBAR_KEY = "binhlaig_code_notes_sidebar_open_full_v1";
const VIEW_KEY = "binhlaig_code_notes_view_mode_v1";

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: "short", day: "2-digit" });
}

export default function CodeNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [q, setQ] = useState("");
  const [composer, setComposer] = useState("");

  const [viewMode, setViewMode] = useState<"result" | "editor">("result");

  // optional: show saving state
  const [saving, setSaving] = useState(false);

  // debounce timer
  const saveTimer = useRef<any>(null);

  // ✅ New dialog state (folder name first)
  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // ✅ composer icon toggle (UPDATE ONLY)
  const [iconOpen, setIconOpen] = useState(false);
  const composerRef = useRef<HTMLInputElement | null>(null);

  const insertToComposer = (txt: string) => {
    const el = composerRef.current;
    if (!el) return;

    const start = el.selectionStart ?? composer.length;
    const end = el.selectionEnd ?? start;

    const next = composer.slice(0, start) + txt + composer.slice(end);
    setComposer(next);

    requestAnimationFrame(() => {
      el.focus();
      const pos = start + txt.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const active = useMemo(() => notes.find((n) => n.id === activeId) ?? null, [
    notes,
    activeId,
  ]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(s) || n.content.toLowerCase().includes(s)
    );
  }, [notes, q]);

  // ✅ Load from API
  useEffect(() => {
    const sb = localStorage.getItem(SIDEBAR_KEY);
    const vm = localStorage.getItem(VIEW_KEY);

    if (sb) setSidebarOpen(sb === "1");
    if (vm === "editor" || vm === "result") setViewMode(vm);

    (async () => {
      try {
        const res = await fetch("/api/notes", { cache: "no-store" });
        const data: Note[] = await res.json();

        setNotes(data);
        setActiveId(data?.[0]?.id ?? null);

        // ✅ If no notes, open create dialog instead of auto-creating
        if (!data || data.length === 0) {
          setNewTitle("");
          setNewOpen(true);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, sidebarOpen ? "1" : "0");
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem(VIEW_KEY, viewMode);
  }, [viewMode]);

  // ---------------- API helpers ----------------
  async function createNoteApi(title: string): Promise<Note> {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), content: "" }),
    });
    if (!res.ok) throw new Error("Create note failed");
    return await res.json();
  }

  async function patchNoteApi(id: string, patch: Partial<Note>) {
    const res = await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Update note failed");
    return await res.json();
  }

  async function deleteNoteApi(id: string) {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete note failed");
    return await res.json();
  }

  // ---------------- dialog actions ----------------
  const openCreateDialog = () => {
    setNewTitle("");
    setNewOpen(true);
  };

  const confirmCreate = async () => {
    const title = newTitle.trim();
    if (!title) return;

    await toastPromise6s(
      async () => {
        const n = await createNoteApi(title);
        setNotes((p) => [n, ...p]);
        setActiveId(n.id);
        return n;
      },
      {
        loading: "Creating folder… ⏳",
        success: (n) => `Created ✅ (${n.title})`,
        error: (e) => `Create failed ❌: ${e?.message ?? ""}`,
      }
    );

    setNewOpen(false);
    setNewTitle("");
  };

  // ---------------- actions ----------------
  const updateActive = (patch: Partial<Note>) => {
    if (!activeId) return;

    // optimistic update
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeId ? { ...n, ...patch, updatedAt: Date.now() } : n
      )
    );

    // debounce save to API
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      try {
        setSaving(true);
        await patchNoteApi(activeId, patch);
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(false);
      }
    }, 400);
  };

  const deleteActive = async () => {
    if (!activeId) return;
    if (notes.length <= 1) return;

    const id = activeId;
    const idx = notes.findIndex((n) => n.id === id);
    const nextId =
      notes[idx + 1]?.id ?? notes[idx - 1]?.id ?? notes[0]?.id ?? null;

    // optimistic UI
    setNotes((p) => p.filter((n) => n.id !== id));
    setActiveId(nextId);

    await toastPromise6s(
      async () => {
        await deleteNoteApi(id);
        return true;
      },
      {
        loading: "Deleting note… ⏳",
        success: "Deleted ✅",
        error: (e) => `Delete failed ❌: ${e?.message ?? ""}`,
      }
    );
  };

  const sendToNote = () => {
    const text = composer.trim();
    if (!text) return;

    if (!activeId) {
      // if none selected, ask to create first
      openCreateDialog();
      return;
    }

    const next = (active?.content ? active.content + "\n\n" : "") + text;
    updateActive({ content: next });
    setComposer("");
  };

  // Sidebar UI
  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="text-sm font-semibold">Code Notes</div>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New
        </Button>
      </div>

      {/* Result / Editor buttons in sidebar */}
      <div className="px-3 pb-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={viewMode === "result" ? "default" : "secondary"}
            className="w-full justify-start"
            onClick={() => setViewMode("result")}
          >
            <Eye className="mr-2 h-4 w-4" />
            Result
          </Button>

          <Button
            variant={viewMode === "editor" ? "default" : "secondary"}
            className="w-full justify-start"
            onClick={() => setViewMode("editor")}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editor
          </Button>
        </div>

        {/* optional saving indicator */}
        <div className="mt-2 text-[11px] text-muted-foreground">
          {saving ? "Saving..." : active ? `Updated: ${fmtTime(active.updatedAt)}` : ""}
        </div>
      </div>

      <div className="px-3 pb-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes..."
          className="bg-background/40"
        />
      </div>

      <Separator className="opacity-40" />

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filtered.map((n) => {
            const isActive = n.id === activeId;
            return (
              <button
                key={n.id}
                onClick={() => setActiveId(n.id)}
                className={[
                  "w-full rounded-xl border px-3 py-2 text-left transition",
                  isActive
                    ? "border-border bg-accent/40"
                    : "border-transparent hover:border-border/60 hover:bg-accent/20",
                ].join(" ")}
              >
                <div className="truncate text-sm font-medium">{n.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {fmtTime(n.updatedAt)}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-3 space-y-2">
        <Button
          variant="secondary"
          className="w-full"
          onClick={deleteActive}
          disabled={notes.length <= 1}
        >
          Delete
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* TOP BAR */}
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {/* MOBILE DRAWER */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="secondary" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>

                <SheetContent side="left" className="p-0 w-80">
                  <div className="h-full">{SidebarContent}</div>
                </SheetContent>
              </Sheet>
            </div>

            {/* DESKTOP COLLAPSE */}
            <div className="hidden md:block">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSidebarOpen((v) => !v)}
                title="Toggle sidebar"
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="ml-1">
              <div className="text-sm font-semibold">BINHLAIG</div>
              <div className="text-xs text-muted-foreground">Code Notes</div>
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* BODY ✅ padding-bottom to avoid fixed composer overlap */}
      <div className="mx-auto flex max-w-6xl gap-4 px-4 py-6 pb-28">
        {/* SIDEBAR */}
        <aside
          className={[
            "hidden md:block h-[calc(100vh-140px)] overflow-hidden rounded-xl border bg-card/30",
            sidebarOpen ? "w-72" : "w-0 border-transparent",
          ].join(" ")}
        >
          {sidebarOpen && SidebarContent}
        </aside>

        {/* MAIN */}
        <main className="flex-1">
          {viewMode === "result" ? (
            <ScrollArea className="">
              <div className="p-4">
                <NoteMarkdown content={active?.content ?? ""} />
              </div>
            </ScrollArea>
          ) : (
            <textarea
              value={active?.content ?? ""}
              onChange={(e) => updateActive({ content: e.target.value })}
              placeholder="Write markdown here..."
              className="h-[calc(100vh-240px)] w-full rounded-xl border bg-background/10 p-4 font-mono text-sm leading-7 outline-none"
              onPaste={(e) => {
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

                const target = e.target as HTMLTextAreaElement;
                const start = target.selectionStart;
                const end = target.selectionEnd;

                const currentValue = active?.content ?? "";
                const newValue =
                  currentValue.substring(0, start) +
                  wrapped +
                  currentValue.substring(end);

                updateActive({ content: newValue });
              }}
            />
          )}
        </main>
      </div>

      {/* ✅ BOTTOM COMPOSER (original design + icon toggle update only) */}
      <div className="fixed inset-x-0 bottom-0 z-20">
        <div className="mx-auto max-w-6xl px-4 pb-4">
          <div className="rounded-3xl border bg-background/80 px-3 py-3 shadow backdrop-blur">
            {/* icon row */}
            {iconOpen && (
              <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
                {[
                  { label: "OK", v: "✅ " },
                  { label: "Fire", v: "🔥 " },
                  { label: "Tip", v: "💡 " },
                  { label: "Warn", v: "⚠️ " },
                  { label: "Info", v: "ℹ️ " },
                  { label: "New", v: "✨ " },
                ].map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => insertToComposer(b.v)}
                    className="rounded-full border bg-background/60 px-3 py-1.5 text-sm hover:bg-muted transition"
                    title={b.label}
                  >
                    {b.v}
                  </button>
                ))}

                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={() => setIconOpen(false)}
                    className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full"
                onClick={openCreateDialog}
                title="New note"
              >
                <Plus className="h-4 w-4" />
              </Button>

              {/* ✅ added icon button (same style) */}
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full"
                title="Icons"
                onClick={() => setIconOpen((v) => !v)}
              >
                <Smile className="h-4 w-4" />
              </Button>

              <Input
                ref={composerRef}
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                placeholder="Write note text…"
                className="h-11 flex-1 rounded-full bg-background/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendToNote();
                  if (e.key === "Escape") setIconOpen(false);
                }}
              />

              <Button
                variant="secondary"
                size="icon"
                className="rounded-full"
                title="Voice (later)"
                onClick={() => {}}
              >
                <Mic className="h-4 w-4" />
              </Button>

              <Button size="icon" className="rounded-full" onClick={sendToNote}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ CREATE DIALOG (Folder name first) */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create new folder</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Folder name</Label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Spring Boot Notes"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmCreate();
              }}
            />
            <div className="text-xs text-muted-foreground">
              Enter နိုပ်ရင် create လုပ်မယ်။
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="secondary" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCreate} disabled={!newTitle.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}