
// // "use client";

// // import React from "react";
// // import ReactMarkdown from "react-markdown";
// // import remarkGfm from "remark-gfm";
// // import rehypeHighlight from "rehype-highlight";

// // /** ✅ extract raw text from highlighted nodes (fix [object Object]) */
// // function extractText(node: React.ReactNode): string {
// //   let out = "";
// //   React.Children.forEach(node, (child) => {
// //     if (typeof child === "string" || typeof child === "number") {
// //       out += String(child);
// //     } else if (React.isValidElement(child)) {
// //       out += extractText(child.props?.children);
// //     }
// //   });
// //   return out;
// // }

// // /** ✅ language short label (ignore "hljs") */
// // function shortLang(className?: string) {
// //   if (!className) return "Code";

// //   // split classes like: "hljs language-bash"
// //   const parts = className.split(" ");
// //   const langPart = parts.find((p) => p.startsWith("language-"));

// //   const l = (langPart ?? "").replace("language-", "").toLowerCase();
// //   if (!l) return "Code";

// //   if (l === "typescript" || l === "ts") return "TS";
// //   if (l === "javascript" || l === "js") return "JS";
// //   if (l === "css") return "CSS";
// //   if (l === "html") return "HTML";
// //   if (l === "json") return "JSON";
// //   if (l === "sql") return "SQL";
// //   if (l === "bash" || l === "sh" || l === "shell") return "Bash";
// //   if (l === "python" || l === "py") return "PY";
// //   if (l === "java") return "JAVA";

// //   return l.toUpperCase();
// // }

// // export default function NoteMarkdown({ content }: { content: string }) {
// //   return (
// //     <div className="prose max-w-none dark:prose-invert">
// //       <ReactMarkdown
// //         remarkPlugins={[remarkGfm]}
// //         rehypePlugins={[rehypeHighlight]}
// //         components={{
// //           p: ({ children }) => (
// //             <p className="text-[15px] leading-7 text-foreground/90">
// //               {children}
// //             </p>
// //           ),

// //           code({ inline, className, children }) {
// //             const rawText = extractText(children).replace(/\n$/, "");

// //             // ✅ inline code → click copy (keep original)
// //             if (inline) {
// //               return (
// //                 <button
// //                   onClick={() => navigator.clipboard.writeText(rawText)}
// //                   title="Click to copy"
// //                   className="rounded bg-muted/40 px-1.5 py-0.5 text-[12px] hover:bg-muted/70 transition"
// //                 >
// //                   {children}
// //                 </button>
// //               );
// //             }

// //             const label = shortLang(className);

// //             // ✅ block code → screenshot-style (dark code area + header)
// //             return (
// //               <div className="relative my-4 overflow-hidden rounded-2xl border bg-card/40">
// //                 {/* header */}
// //                 <div className="flex items-center justify-between border-b bg-background/40 px-4 py-2">
// //                   <div className="text-xs font-medium">{label}</div>

// //                   <button
// //                     onClick={() => navigator.clipboard.writeText(rawText)}
// //                     className="text-xs rounded-md border px-2 py-1 hover:bg-muted transition"
// //                     title="Copy"
// //                   >
// //                     Copy
// //                   </button>
// //                 </div>

// //                 {/* code area (dark like screenshot) */}
// //                 <pre className="m-0 overflow-auto p-4 text-sm leading-6 bg-black/80">
// //                   <code className={className}>{children}</code>
// //                 </pre>
// //               </div>
// //             );
// //           },
// //         }}
// //       >
// //         {content || ""}
// //       </ReactMarkdown>
// //     </div>
// //   );
// // }




// "use client";

// import React, { useMemo, useState } from "react";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import rehypeHighlight from "rehype-highlight";

// import {
//   Check,
//   Copy,
//   Terminal,
//   GitBranch,
//   Package as PackageIcon,
//   Globe,
//   Database,
//   FileCode2,
//   Braces,
//   Code2,
// } from "lucide-react";

// /** ✅ extract raw text from highlighted nodes (fix [object Object]) */
// function extractText(node: React.ReactNode): string {
//   let out = "";
//   React.Children.forEach(node, (child) => {
//     if (typeof child === "string" || typeof child === "number") out += String(child);
//     else if (React.isValidElement(child)) out += extractText(child.props?.children);
//   });
//   return out;
// }

// /** ✅ language short label (ignore "hljs") */
// function shortLang(className?: string) {
//   if (!className) return "Code";
//   const parts = className.split(" ");
//   const langPart = parts.find((p) => p.startsWith("language-"));
//   const l = (langPart ?? "").replace("language-", "").toLowerCase();
//   if (!l) return "Code";

//   if (l === "typescript" || l === "ts") return "TS";
//   if (l === "javascript" || l === "js") return "JS";
//   if (l === "css") return "CSS";
//   if (l === "html") return "HTML";
//   if (l === "json") return "JSON";
//   if (l === "sql") return "SQL";
//   if (l === "bash" || l === "sh" || l === "shell") return "Bash";
//   if (l === "python" || l === "py") return "PY";
//   if (l === "java") return "JAVA";
//   return l.toUpperCase();
// }

// type LangMeta = {
//   key: string;
//   label: string;
//   fg: string;   // text color class
//   bg: string;   // bg class
//   ring: string; // ring class
//   icon: React.ReactNode;
// };

// function langMeta(label: string): LangMeta {
//   const k = label.toLowerCase();

//   // simple, “logo-like” feel via color + icon
//   if (k === "ts")
//     return {
//       key: "ts",
//       label: "TypeScript",
//       fg: "text-blue-700 dark:text-blue-300",
//       bg: "bg-blue-50 dark:bg-blue-950/40",
//       ring: "ring-1 ring-blue-200/70 dark:ring-blue-900/60",
//       icon: <Code2 className="h-3.5 w-3.5" />,
//     };
//   if (k === "js")
//     return {
//       key: "js",
//       label: "JavaScript",
//       fg: "text-yellow-800 dark:text-yellow-200",
//       bg: "bg-yellow-50 dark:bg-yellow-950/30",
//       ring: "ring-1 ring-yellow-200/70 dark:ring-yellow-900/60",
//       icon: <Code2 className="h-3.5 w-3.5" />,
//     };
//   if (k === "py")
//     return {
//       key: "py",
//       label: "Python",
//       fg: "text-emerald-800 dark:text-emerald-200",
//       bg: "bg-emerald-50 dark:bg-emerald-950/35",
//       ring: "ring-1 ring-emerald-200/70 dark:ring-emerald-900/60",
//       icon: <FileCode2 className="h-3.5 w-3.5" />,
//     };
//   if (k === "json")
//     return {
//       key: "json",
//       label: "JSON",
//       fg: "text-violet-800 dark:text-violet-200",
//       bg: "bg-violet-50 dark:bg-violet-950/35",
//       ring: "ring-1 ring-violet-200/70 dark:ring-violet-900/60",
//       icon: <Braces className="h-3.5 w-3.5" />,
//     };
//   if (k === "sql")
//     return {
//       key: "sql",
//       label: "SQL",
//       fg: "text-sky-800 dark:text-sky-200",
//       bg: "bg-sky-50 dark:bg-sky-950/35",
//       ring: "ring-1 ring-sky-200/70 dark:ring-sky-900/60",
//       icon: <Database className="h-3.5 w-3.5" />,
//     };
//   if (k === "bash")
//     return {
//       key: "bash",
//       label: "Bash",
//       fg: "text-neutral-800 dark:text-neutral-200",
//       bg: "bg-neutral-50 dark:bg-neutral-900/40",
//       ring: "ring-1 ring-neutral-200/70 dark:ring-neutral-800/70",
//       icon: <Terminal className="h-3.5 w-3.5" />,
//     };

//   // fallback
//   return {
//     key: k,
//     label,
//     fg: "text-neutral-800 dark:text-neutral-200",
//     bg: "bg-neutral-50 dark:bg-neutral-900/35",
//     ring: "ring-1 ring-neutral-200/70 dark:ring-neutral-800/70",
//     icon: <FileCode2 className="h-3.5 w-3.5" />,
//   };
// }

// /** ✅ original-ish npm logo (simple inline SVG) */
// function NpmLogo({ className = "" }: { className?: string }) {
//   return (
//     <svg
//       viewBox="0 0 256 100"
//       className={className}
//       aria-label="npm"
//       role="img"
//     >
//       <rect width="256" height="100" rx="10" />
//       <path
//         d="M54 25h148v50H154V40h-25v35H54V25zm50 15v25h25V40h-25zm50 0v25h25V40h-25z"
//         fill="currentColor"
//       />
//     </svg>
//   );
// }

// /** ✅ docker whale (simple inline SVG) */
// function DockerWhale({ className = "" }: { className?: string }) {
//   return (
//     <svg viewBox="0 0 256 256" className={className} aria-label="docker" role="img">
//       <path
//         d="M76 108h26v24H76v-24zm30 0h26v24h-26v-24zm30 0h26v24h-26v-24zm-60-30h26v24H76V78zm30 0h26v24h-26V78zm60 30h26v24h-26v-24zm30 0h26v24h-26v-24z"
//         fill="currentColor"
//         opacity="0.95"
//       />
//       <path
//         d="M238 116c-6-4-18-4-25 0-3-12-15-22-29-22-6 0-12 1-17 4v20c0 3-2 6-6 6H52c-3 0-6 2-6 6 0 38 31 70 72 70h34c39 0 71-22 84-56 9 0 16-6 18-16 1-6-1-10-2-12z"
//         fill="currentColor"
//       />
//     </svg>
//   );
// }

// /** ✅ VSCode-like command icon detection from raw text */
// function commandIcon(raw: string) {
//   const t = raw.toLowerCase();

//   // docker
//   if (/\bdocker\b|\bdocker-compose\b/.test(t))
//     return (
//       <span className="inline-flex items-center gap-1" data-tip="Docker command">
//         <DockerWhale className="h-4 w-4 text-sky-600 dark:text-sky-300" />
//       </span>
//     );

//   // npm/pnpm/yarn
//   if (/\bnpm\b|\bpnpm\b|\byarn\b|\bnpx\b/.test(t))
//     return (
//       <span className="inline-flex items-center gap-1" data-tip="Node package command">
//         <span className="inline-flex items-center justify-center rounded-md bg-red-600 text-white p-1">
//           <NpmLogo className="h-3.5 w-7" />
//         </span>
//       </span>
//     );

//   // git
//   if (/\bgit\b/.test(t))
//     return (
//       <span className="inline-flex items-center gap-1" data-tip="Git command">
//         <GitBranch className="h-4 w-4 text-orange-600 dark:text-orange-300" />
//       </span>
//     );

//   // curl/wget/http
//   if (/\bcurl\b|\bwget\b|https?:\/\//.test(t))
//     return (
//       <span className="inline-flex items-center gap-1" data-tip="Network request">
//         <Globe className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
//       </span>
//     );

//   // sql
//   if (/\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bsql\b/.test(t))
//     return (
//       <span className="inline-flex items-center gap-1" data-tip="Database command">
//         <Database className="h-4 w-4 text-sky-700 dark:text-sky-300" />
//       </span>
//     );

//   // default
//   return (
//     <span className="inline-flex items-center gap-1" data-tip="Code block">
//       <Terminal className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
//     </span>
//   );
// }

// /** ✅ Tiny tooltip (no extra libs) */
// function Tip({ children, text }: { children: React.ReactNode; text: string }) {
//   return (
//     <span className="relative inline-flex group">
//       {children}
//       <span
//         className="
//           pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2
//           whitespace-nowrap rounded-md border bg-background/95 px-2 py-1 text-[11px]
//           text-foreground shadow-sm opacity-0 blur-[1px]
//           transition-all duration-150 group-hover:opacity-100 group-hover:blur-0
//         "
//       >
//         {text}
//       </span>
//     </span>
//   );
// }

// /** ✅ Copy button with animated success */
// function CopyButton({
//   value,
//   className = "",
//   size = "sm",
// }: {
//   value: string;
//   className?: string;
//   size?: "sm" | "xs";
// }) {
//   const [copied, setCopied] = useState(false);

//   const pad = size === "sm" ? "px-2.5 py-1.5" : "px-2 py-1";
//   const textSize = size === "sm" ? "text-xs" : "text-[11px]";

//   return (
//     <Tip text={copied ? "Copied!" : "Copy"}>
//       <button
//         onClick={async () => {
//           try {
//             await navigator.clipboard.writeText(value);
//             setCopied(true);
//             window.setTimeout(() => setCopied(false), 1200);
//           } catch {}
//         }}
//         className={[
//           "inline-flex items-center gap-1.5 rounded-md border bg-background/40",
//           "hover:bg-muted/50 transition",
//           pad,
//           textSize,
//           copied ? "border-emerald-300/70 dark:border-emerald-800/70" : "border-border/60",
//           className,
//         ].join(" ")}
//       >
//         {copied ? (
//           <>
//             <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
//             <span className="text-emerald-700 dark:text-emerald-200">Copied</span>
//           </>
//         ) : (
//           <>
//             <Copy className="h-3.5 w-3.5" />
//             <span>Copy</span>
//           </>
//         )}
//       </button>
//     </Tip>
//   );
// }

// function InlineCode({
//   children,
//   rawText,
// }: {
//   children: React.ReactNode;
//   rawText: string;
// }) {
//   const [copied, setCopied] = useState(false);

//   return (
//     <Tip text={copied ? "Copied!" : "Click to copy"}>
//       <button
//         onClick={async () => {
//           try {
//             await navigator.clipboard.writeText(rawText);
//             setCopied(true);
//             window.setTimeout(() => setCopied(false), 900);
//           } catch {}
//         }}
//         className={[
//           "inline-flex items-center gap-1 rounded-md",
//           "bg-muted/40 hover:bg-muted/70 transition",
//           "px-1.5 py-0.5 text-[12px] border border-border/40",
//         ].join(" ")}
//       >
//         {copied ? (
//           <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-300" />
//         ) : (
//           <Code2 className="h-3 w-3 opacity-70" />
//         )}
//         <span className="font-mono">{children}</span>
//       </button>
//     </Tip>
//   );
// }

// export default function NoteMarkdown({ content }: { content: string }) {
//   // optional: avoid rerender parsing heavy content
//   const md = useMemo(() => content || "", [content]);

//   return (
//     <div className="prose max-w-none dark:prose-invert">
//       <ReactMarkdown
//         remarkPlugins={[remarkGfm]}
//         rehypePlugins={[rehypeHighlight]}
//         components={{
//           p: ({ children }) => (
//             <p className="text-[15px] leading-7 text-foreground/90">
//               {children}
//             </p>
//           ),

//           // ✅ nicer lists
//           li: ({ children }) => (
//             <li className="my-1 leading-7">{children}</li>
//           ),

//           code({ inline, className, children }) {
//             const rawText = extractText(children).replace(/\n$/, "");

//             // ✅ inline code with icon + tooltip + animated copy
//             if (inline) {
//               return <InlineCode rawText={rawText}>{children}</InlineCode>;
//             }

//             const short = shortLang(className);
//             const meta = langMeta(short.toLowerCase() === "py" ? "py" : short.toLowerCase());

//             return (
//               <div className="relative my-4 overflow-hidden rounded-2xl border bg-card/40">
//                 {/* VSCode-like header */}
//                 <div className="flex items-center justify-between gap-2 border-b bg-background/40 px-3 py-2">
//                   <div className="flex min-w-0 items-center gap-2">
//                     {/* command icon (docker/npm/git/…) */}
//                     <span className="shrink-0">
//                       <Tip text={(rawText || "").slice(0, 120) || "Code"}>
//                         <span className="inline-flex items-center">
//                           {commandIcon(rawText)}
//                         </span>
//                       </Tip>
//                     </span>

//                     {/* colored language badge */}
//                     <Tip text={meta.label}>
//                       <span
//                         className={[
//                           "inline-flex items-center gap-1.5 rounded-md px-2 py-1",
//                           meta.bg,
//                           meta.fg,
//                           meta.ring,
//                         ].join(" ")}
//                       >
//                         {meta.icon}
//                         <span className="text-[11px] font-semibold tracking-wide">
//                           {short}
//                         </span>
//                       </span>
//                     </Tip>

//                     {/* tiny hint like VSCode “•••” dots */}
//                     <div className="ml-1 hidden sm:flex items-center gap-1 opacity-50">
//                       <span className="h-1 w-1 rounded-full bg-foreground/50" />
//                       <span className="h-1 w-1 rounded-full bg-foreground/50" />
//                       <span className="h-1 w-1 rounded-full bg-foreground/50" />
//                     </div>
//                   </div>

//                   {/* toolbar */}
//                   <div className="flex items-center gap-2">
//                     <CopyButton value={rawText} />
//                   </div>
//                 </div>

//                 {/* code area (dark like editor) */}
//                 <pre className="m-0 overflow-auto p-4 text-sm leading-6 bg-black/80">
//                   <code className={className}>{children}</code>
//                 </pre>

//                 {/* subtle bottom fade like VSCode scroll area */}
//                 <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/30 to-transparent" />
//               </div>
//             );
//           },

//           // ✅ optional: tables look clean
//           table: ({ children }) => (
//             <div className="my-4 overflow-auto rounded-xl border">
//               <table className="m-0 w-full">{children}</table>
//             </div>
//           ),

//           // ✅ optional: blockquote style
//           blockquote: ({ children }) => (
//             <blockquote className="border-l-4 border-border/60 bg-muted/20 px-4 py-2 rounded-r-xl">
//               {children}
//             </blockquote>
//           ),
//         }}
//       >
//         {md}
//       </ReactMarkdown>
//     </div>
//   );
// }





"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import {
  CheckCircle2,
  Flame,
  Lightbulb,
  AlertTriangle,
  Info,
  Sparkles,
} from "lucide-react";

/** ✅ extract raw text from highlighted nodes (fix [object Object]) */
function extractText(node: React.ReactNode): string {
  let out = "";
  React.Children.forEach(node, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      out += String(child);
    } else if (React.isValidElement(child)) {
      out += extractText(child.props?.children);
    }
  });
  return out;
}

/** ✅ language short label (ignore "hljs") */
function shortLang(className?: string) {
  if (!className) return "Code";

  const parts = className.split(" ");
  const langPart = parts.find((p) => p.startsWith("language-"));

  const l = (langPart ?? "").replace("language-", "").toLowerCase();
  if (!l) return "Code";

  if (l === "typescript" || l === "ts") return "TS";
  if (l === "javascript" || l === "js") return "JS";
  if (l === "css") return "CSS";
  if (l === "html") return "HTML";
  if (l === "json") return "JSON";
  if (l === "sql") return "SQL";
  if (l === "bash" || l === "sh" || l === "shell") return "Bash";
  if (l === "python" || l === "py") return "PY";
  if (l === "java") return "JAVA";

  return l.toUpperCase();
}

type AutoIconMatch = {
  icon: React.ReactNode;
  strip: RegExp;
};

// ✅ you can add more rules here
const AUTO_ICONS: AutoIconMatch[] = [
  {
    icon: (
      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
    ),
    strip: /^(\s*)(:ok:|✅)\s*/i,
  },
  {
    icon: <Flame className="h-5 w-5 text-orange-600 dark:text-orange-300" />,
    strip: /^(\s*)(:fire:|🔥)\s*/i,
  },
  {
    icon: (
      <Lightbulb className="h-5 w-5 text-yellow-700 dark:text-yellow-300" />
    ),
    strip: /^(\s*)(:tip:|💡)\s*/i,
  },
  {
    icon: (
      <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-300" />
    ),
    strip: /^(\s*)(:warn:|⚠️)\s*/i,
  },
  {
    icon: <Info className="h-5 w-5 text-sky-700 dark:text-sky-300" />,
    strip: /^(\s*)(:info:|ℹ️)\s*/i,
  },
  {
    icon: <Sparkles className="h-5 w-5 text-violet-700 dark:text-violet-300" />,
    strip: /^(\s*)(:new:|✨)\s*/i,
  },
];

/**
 * ✅ First text node ထဲမှာ marker ပါရင် icon ထည့်ပြီး marker ကို ဖြတ်ထုတ်ပေးမယ်
 * - inline code / bold / link မပျက်
 */
function withLeadingAutoIcon(children: React.ReactNode) {
  const arr = React.Children.toArray(children);

  // first node is not plain text
  if (arr.length === 0 || typeof arr[0] !== "string") {
    return { icon: null as React.ReactNode | null, children };
  }

  const first = arr[0] as string;

  for (const m of AUTO_ICONS) {
    if (m.strip.test(first)) {
      const stripped = first.replace(m.strip, "");
      const next = [...arr];
      next[0] = stripped;
      return { icon: m.icon, children: next };
    }
  }

  return { icon: null as React.ReactNode | null, children };
}

export default function NoteMarkdown({ content }: { content: string }) {
  return (
    <div className="prose max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // ✅ paragraph with auto icon
          p: ({ children }) => {
            const { icon, children: nextChildren } =
              withLeadingAutoIcon(children);

            if (icon) {
              return (
                <p className="flex items-start gap-2 text-[15px] leading-7 text-foreground/90">
                  <span className="mt-[3px] shrink-0">{icon}</span>
                  <span>{nextChildren}</span>
                </p>
              );
            }

            return (
              <p className="text-[15px] leading-7 text-foreground/90">
                {children}
              </p>
            );
          },

          // ✅ list item with auto icon
          li: ({ children }) => {
            const { icon, children: nextChildren } =
              withLeadingAutoIcon(children);

            if (icon) {
              return (
                <li className="flex items-start gap-2 leading-7">
                  <span className="mt-[3px] shrink-0">{icon}</span>
                  <span>{nextChildren}</span>
                </li>
              );
            }

            return <li className="leading-7">{children}</li>;
          },

          // ✅ inline + block code
          code({ inline, className, children }) {
            const rawText = extractText(children).replace(/\n$/, "");

            // inline code → click copy
            if (inline) {
              return (
                <button
                  onClick={() => navigator.clipboard.writeText(rawText)}
                  title="Click to copy"
                  className="rounded bg-muted/40 px-1.5 py-0.5 text-[12px] hover:bg-muted/70 transition"
                >
                  {children}
                </button>
              );
            }

            const label = shortLang(className);

            // block code → screenshot-style
            return (
              <div className="relative my-4 overflow-hidden rounded-2xl border bg-card/40">
                <div className="flex items-center justify-between border-b bg-background/40 px-4 py-2">
                  <div className="text-xs font-medium">{label}</div>

                  <button
                    onClick={() => navigator.clipboard.writeText(rawText)}
                    className="text-xs rounded-md border px-2 py-1 hover:bg-muted transition"
                    title="Copy"
                  >
                    Copy
                  </button>
                </div>

                <pre className="m-0 overflow-auto p-4 text-sm leading-6 bg-black/80">
                  <code className={className}>{children}</code>
                </pre>
              </div>
            );
          },
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}