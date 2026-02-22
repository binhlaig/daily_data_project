

// "use client";

// import { useMemo, useState } from "react";
// import { EMOJI_ICONS, LUCIDE_ICONS } from "@/lib/data/icons";
// import { Search } from "lucide-react";

// type Cat = "emoji" | "lucide";

// export type PickedIcon =
//   | { kind: "emoji"; label: string; v: string }
//   | { kind: "lucide"; label: string; name: string; Icon: any };

// export default function IconPicker({
//   onPick,
//   onClose,
// }: {
//   onPick: (picked: PickedIcon) => void; // ✅ changed (was string)
//   onClose: () => void;
// }) {
//   const [cat, setCat] = useState<Cat>("emoji");
//   const [q, setQ] = useState("");

//   const list = useMemo(() => {
//     const base = cat === "emoji" ? EMOJI_ICONS : LUCIDE_ICONS;
//     const s = q.trim().toLowerCase();
//     if (!s) return base as any[];
//     return (base as any[]).filter((i) => i.label.toLowerCase().includes(s));
//   }, [cat, q]);

//   return (
//     <div className="mb-2 rounded-2xl border bg-background/70 p-2 backdrop-blur">
//       {/* TOP BAR */}
//       <div className="flex items-center gap-2 mb-2 px-1">
//         {/* CATEGORY BUTTONS */}
//         <div className="flex gap-1">
//           <button
//             type="button"
//             onClick={() => setCat("emoji")}
//             className={`px-3 py-1 rounded-full text-xs border transition ${
//               cat === "emoji"
//                 ? "bg-primary text-primary-foreground"
//                 : "hover:bg-muted"
//             }`}
//           >
//             Emoji
//           </button>

//           <button
//             type="button"
//             onClick={() => setCat("lucide")}
//             className={`px-3 py-1 rounded-full text-xs border transition ${
//               cat === "lucide"
//                 ? "bg-primary text-primary-foreground"
//                 : "hover:bg-muted"
//             }`}
//           >
//             Lucide
//           </button>
//         </div>

//         {/* SEARCH */}
//         <div className="flex items-center gap-1 ml-2 flex-1">
//           <Search className="h-4 w-4 text-muted-foreground" />
//           <input
//             value={q}
//             onChange={(e) => setQ(e.target.value)}
//             placeholder="Search..."
//             className="w-full bg-transparent text-sm outline-none"
//           />
//         </div>

//         {/* CLOSE */}
//         <button
//           type="button"
//           onClick={onClose}
//           className="px-2 text-xs text-muted-foreground hover:underline"
//         >
//           Close
//         </button>
//       </div>

//       {/* ICON GRID */}
//       <div className="flex flex-wrap gap-2 px-1">
//         {list.map((b: any) => (
//           <button
//             key={b.label}
//             type="button"
//             onClick={() => {
//               if (cat === "emoji") {
//                 onPick({ kind: "emoji", label: b.label, v: b.v });
//               } else {
//                 onPick({
//                   kind: "lucide",
//                   label: b.label,
//                   name: b.name ?? b.label,
//                   Icon: b.Icon,
//                 });
//               }
//             }}
//             className="
//               flex items-center gap-2
//               rounded-full
//               border
//               bg-background/60
//               px-3 py-1.5
//               text-sm
//               hover:bg-muted
//               active:scale-95
//               transition
//             "
//             title={b.label}
//           >
//             {b.Icon ? <b.Icon className="h-4 w-4" /> : <span>{b.v}</span>}
//             <span className="text-xs">{b.label}</span>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }




"use client";

import { useMemo, useState } from "react";
import { EMOJI_ICONS, LUCIDE_ICONS } from "@/lib/data/icons";
import { Search } from "lucide-react";

type Cat = "emoji" | "lucide";

export type PickedIcon =
  | { kind: "emoji"; label: string; v: string }
  | { kind: "lucide"; label: string; name: string; Icon: React.ComponentType<any> };

export default function IconPicker({
  onPick,
  onClose,
}: {
  onPick: (picked: PickedIcon) => void;
  onClose: () => void;
}) {

  const [cat, setCat] = useState<Cat>("emoji");
  const [q, setQ] = useState("");

  const list = useMemo(() => {

    const base = cat === "emoji" ? EMOJI_ICONS : LUCIDE_ICONS;

    const s = q.trim().toLowerCase();
    if (!s) return base as any[];

    return (base as any[]).filter((i) =>
      (i.label ?? "").toLowerCase().includes(s)
    );

  }, [cat, q]);

  return (
    <div className="mb-2 rounded-2xl border bg-background/70 p-2 backdrop-blur">

      {/* TOP BAR */}
      <div className="flex items-center gap-2 mb-2 px-1">

        <div className="flex gap-1">

          <button
            type="button"
            onClick={() => setCat("emoji")}
            className={`px-3 py-1 rounded-full text-xs border transition ${
              cat === "emoji"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            Emoji
          </button>

          <button
            type="button"
            onClick={() => setCat("lucide")}
            className={`px-3 py-1 rounded-full text-xs border transition ${
              cat === "lucide"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            Lucide
          </button>

        </div>

        {/* SEARCH */}
        <div className="flex items-center gap-1 ml-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {/* CLOSE */}
        <button
          type="button"
          onClick={onClose}
          className="px-2 text-xs text-muted-foreground hover:underline"
        >
          Close
        </button>

      </div>

      {/* ICON GRID */}
      <div className="flex flex-wrap gap-2 px-1">

        {list.map((b: any) => {

          const isLucide = cat === "lucide";

          const name = b.name ?? b.label ?? "";
          const Icon = b.Icon;

          return (
            <button
              key={b.label ?? name}
              type="button"
              onClick={() => {

                if (!isLucide) {
                  onPick({
                    kind: "emoji",
                    label: b.label,
                    v: b.v,
                  });
                } else {

                  if (!Icon) return;

                  onPick({
                    kind: "lucide",
                    label: b.label ?? name,
                    name,
                    Icon,
                  });

                }
              }}
              className="
                flex items-center gap-2
                rounded-full
                border
                bg-background/60
                px-3 py-1.5
                text-sm
                hover:bg-muted
                active:scale-95
                transition
              "
              title={b.label}
            >

              {Icon
                ? <Icon className="h-4 w-4"/>
                : <span>{b.v}</span>
              }

              <span className="text-xs">{b.label}</span>

            </button>
          );

        })}

      </div>

    </div>
  );
}