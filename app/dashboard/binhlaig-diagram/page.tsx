// "use client";

// import Link from "next/link";
// import { useEffect, useState } from "react";
// import { nanoid } from "nanoid";


// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Separator } from "@/components/ui/separator";
// import { DiagramLS, loadAll, remove, upsert } from "@/lib/storage";

// export default function DiagramsPage() {
//   const [items, setItems] = useState<DiagramLS[]>([]);

//   const refresh = () => setItems(loadAll());

//   useEffect(() => {
//     refresh();
//   }, []);

//   const create = () => {
//     const title = prompt("Diagram title?", "My Diagram") ?? "My Diagram";
//     const now = Date.now();
//     const id = nanoid(10);

//     upsert({
//       id,
//       title,
//       data: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
//       createdAt: now,
//       updatedAt: now,
//     });

//     location.hash = id;
//     refresh();
//   };

//   const del = (id: string) => {
//     if (!confirm("Delete this diagram?")) return;
//     remove(id);
//     refresh();

//     if (location.hash.replace("#", "") === id) {
//       location.hash = "";
//     }
//   };

//   return (
//     <main className="h-screen">
//       <div className="flex h-full">
//         {/* LEFT LIST */}
//         <aside className="w-[360px] border-r bg-background">
//           <div className="p-3">
//             <div className="flex items-center gap-2">
//               <div className="text-base font-extrabold">My Diagrams</div>
//               <Button className="ml-auto" onClick={create}>
//                 + New
//               </Button>
//             </div>

//             <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
//               <Link href="/">← Home</Link>
//               <span>{items.length} items</span>
//             </div>
//           </div>

//           <Separator />

//           <ScrollArea className="h-[calc(100vh-92px)] p-3">
//             {items.length === 0 ? (
//               <div className="rounded-xl border bg-card p-3 text-sm text-muted-foreground">
//                 No diagrams yet. Click <b>+ New</b>.
//               </div>
//             ) : (
//               <div className="grid gap-2">
//                 {items.map((d) => (
//                   <Card key={d.id} className="p-3">
//                     <a href={`#${d.id}`} className="block">
//                       <div className="font-bold">{d.title}</div>
//                       <div className="mt-1 text-xs text-muted-foreground">
//                         Updated: {new Date(d.updatedAt).toLocaleString()}
//                       </div>
//                     </a>

//                     <div className="mt-3 flex gap-2">
//                       <Button asChild variant="secondary" size="sm">
//                         <a href={`#${d.id}`}>Open</a>
//                       </Button>
//                       <Button
//                         variant="destructive"
//                         size="sm"
//                         onClick={() => del(d.id)}
//                       >
//                         Delete
//                       </Button>
//                     </div>
//                   </Card>
//                 ))}
//               </div>
//             )}
//           </ScrollArea>
//         </aside>

//         {/* RIGHT EDITOR */}
//         <section className="relative flex-1">
//           <EditorHost onChanged={refresh} />
//         </section>
//       </div>
//     </main>
//   );
// }

// function EditorHost({ onChanged }: { onChanged: () => void }) {
//   const [id, setId] = useState<string | null>(null);

//   useEffect(() => {
//     const sync = () => {
//       const hash = window.location.hash.replace("#", "").trim();
//       setId(hash || null);
//     };
//     sync();
//     window.addEventListener("hashchange", sync);
//     return () => window.removeEventListener("hashchange", sync);
//   }, []);

//   if (!id) {
//     return (
//       <div className="grid h-full place-items-center p-6">
//         <div className="max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
//           <div className="text-lg font-extrabold">No diagram selected</div>
//           <p className="mt-2 text-sm text-muted-foreground">
//             Select a diagram on the left, or create a new one.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const DiagramEditorLS = require("@/components/Diagram/DiagramEditorLS").default;
//   return <DiagramEditorLS id={id} onChanged={onChanged} />;
// }



"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";

import { DiagramLS, loadAll, remove, upsert } from "@/lib/storage";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

export default function DiagramsPage() {

  const [items, setItems] = useState<DiagramLS[]>([]);
  const [open, setOpen] = useState(true);

  // remember sidebar state
  useEffect(() => {
    const saved = localStorage.getItem("diagram_sidebar");
    if (saved) setOpen(saved === "1");
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem("diagram_sidebar", next ? "1" : "0");
  };

  const refresh = () => setItems(loadAll());

  useEffect(() => {
    refresh();
  }, []);

  const create = () => {
    const title = prompt("Diagram title?", "My Diagram") ?? "My Diagram";
    const now = Date.now();
    const id = nanoid(10);

    upsert({
      id,
      title,
      data: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
      createdAt: now,
      updatedAt: now,
    });

    location.hash = id;
    refresh();
  };

  const del = (id: string) => {
    if (!confirm("Delete this diagram?")) return;
    remove(id);
    refresh();
  };

  return (
    <main className="h-screen">

      <div className="flex h-full">

        {/* ================= SIDEBAR ================= */}
        <aside
          className={`
            border-r bg-background transition-all duration-300
            ${open ? "w-[360px]" : "w-[70px]"}
          `}
        >
          <div className="flex items-center gap-2 p-3">

            {/* TOGGLE BUTTON */}
            <Button
              size="icon"
              variant="outline"
              onClick={toggle}
            >
              {open ? <PanelLeftClose size={18}/> : <PanelLeftOpen size={18}/>}
            </Button>

            {/* TITLE */}
            {open && (
              <div className="font-extrabold text-base">
                My Diagrams
              </div>
            )}

            {/* NEW BUTTON */}
            {open && (
              <Button className="ml-auto" onClick={create}>
                + New
              </Button>
            )}
          </div>

          <Separator />

          {/* LIST */}
          {open && (
            <ScrollArea className="h-[calc(100vh-70px)] p-3">

              {items.length === 0 ? (
                <div className="rounded-xl border bg-card p-3 text-sm text-muted-foreground">
                  No diagrams yet.
                </div>
              ) : (

                <div className="grid gap-2">

                  {items.map((d) => (
                    <Card key={d.id} className="p-3">

                      <a href={`#${d.id}`} className="block">
                        <div className="font-bold">{d.title}</div>

                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(d.updatedAt).toLocaleString()}
                        </div>
                      </a>

                      <div className="mt-3 flex gap-2">
                        <Button asChild size="sm" variant="secondary">
                          <a href={`#${d.id}`}>Open</a>
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => del(d.id)}
                        >
                          Delete
                        </Button>
                      </div>

                    </Card>
                  ))}

                </div>
              )}
            </ScrollArea>
          )}

        </aside>

        {/* ================= EDITOR ================= */}
        <section className="relative flex-1">
          <EditorHost onChanged={refresh} />
        </section>

      </div>

    </main>
  );
}



function EditorHost({ onChanged }: { onChanged: () => void }) {

  const [id, setId] = useState<string | null>(null);

  useEffect(() => {

    const sync = () => {
      const hash = window.location.hash.replace("#", "").trim();
      setId(hash || null);
    };

    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);

  }, []);

  if (!id) {
    return (
      <div className="grid h-full place-items-center">
        <div className="rounded-xl border bg-card p-6">
          Select a diagram
        </div>
      </div>
    );
  }

  const DiagramEditorLS = require("@/components/Diagram/DiagramEditorLS").default;
  return <DiagramEditorLS id={id} onChanged={onChanged} />;
}