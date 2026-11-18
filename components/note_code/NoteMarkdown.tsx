
"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import {
  Copy,
  Check,
  CheckCircle2,
  Flame,
  Lightbulb,
  AlertTriangle,
  Info,
  Sparkles,
} from "lucide-react";

/**
 * Extract raw text from React nodes.
 * React 19 + TypeScript compatible.
 * Fix: Property 'children' does not exist on type '{}'.
 */
function extractText(node: React.ReactNode): string {
  let out = "";

  React.Children.forEach(node, (child) => {
    if (
      typeof child === "string" ||
      typeof child === "number"
    ) {
      out += String(child);
    } else if (
      React.isValidElement<{
        children?: React.ReactNode;
      }>(child)
    ) {
      out += extractText(child.props.children);
    }
  });

  return out;
}

/**
 * Language short label.
 * Ignore "hljs" and detect "language-*".
 */
function shortLang(className?: string): string {
  if (!className) return "Code";

  const parts = className.split(" ");

  const langPart = parts.find((p) =>
    p.startsWith("language-")
  );

  const lang = (langPart ?? "")
    .replace("language-", "")
    .toLowerCase();

  if (!lang) return "Code";

  const labels: Record<string, string> = {
    typescript: "TS",
    ts: "TS",
    tsx: "TSX",
    javascript: "JS",
    js: "JS",
    jsx: "JSX",
    css: "CSS",
    html: "HTML",
    json: "JSON",
    sql: "SQL",
    bash: "Bash",
    sh: "Bash",
    shell: "Bash",
    python: "PY",
    py: "PY",
    java: "JAVA",
  };

  return labels[lang] ?? lang.toUpperCase();
}

/**
 * Automatic icon rules.
 */
type AutoIconMatch = {
  icon: React.ReactNode;
  strip: RegExp;
};

const AUTO_ICONS: AutoIconMatch[] = [
  {
    icon: (
      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
    ),
    strip: /^(\s*)(:ok:|✅)\s*/i,
  },
  {
    icon: (
      <Flame className="h-5 w-5 text-orange-600 dark:text-orange-300" />
    ),
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
    icon: (
      <Info className="h-5 w-5 text-sky-700 dark:text-sky-300" />
    ),
    strip: /^(\s*)(:info:|ℹ️)\s*/i,
  },
  {
    icon: (
      <Sparkles className="h-5 w-5 text-violet-700 dark:text-violet-300" />
    ),
    strip: /^(\s*)(:new:|✨)\s*/i,
  },
];

/**
 * Detect leading markers and insert icons.
 * Preserve inline code, bold text, and links.
 */
function withLeadingAutoIcon(children: React.ReactNode): {
  icon: React.ReactNode | null;
  children: React.ReactNode;
} {
  const arr = React.Children.toArray(children);

  if (
    arr.length === 0 ||
    typeof arr[0] !== "string"
  ) {
    return {
      icon: null,
      children,
    };
  }

  const first = arr[0];

  for (const match of AUTO_ICONS) {
    if (match.strip.test(first)) {
      const stripped = first.replace(
        match.strip,
        ""
      );

      const next: React.ReactNode[] = [...arr];
      next[0] = stripped;

      return {
        icon: match.icon,
        children: next,
      };
    }
  }

  return {
    icon: null,
    children,
  };
}

/**
 * Note Markdown Component.
 */
export default function NoteMarkdown({
  content,
}: {
  content: string;
}) {
  const [copiedText, setCopiedText] = useState<
    string | null
  >(null);

  /**
   * Copy code to clipboard.
   */
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);

      setCopiedText(text);

      setTimeout(() => {
        setCopiedText((current) =>
          current === text ? null : current
        );
      }, 2000);
    } catch (error) {
      console.error("[MARKDOWN_COPY_ERROR]", error);
    }
  };

  return (
    <div className="prose max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          /**
           * Paragraph with automatic icon.
           */
          p: ({ children }) => {
            const {
              icon,
              children: nextChildren,
            } = withLeadingAutoIcon(children);

            if (icon) {
              return (
                <p className="flex items-start gap-2 text-[15px] leading-7 text-foreground/90">
                  <span className="mt-[3px] shrink-0">
                    {icon}
                  </span>

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

          /**
           * List item with automatic icon.
           */
          li: ({ children }) => {
            const {
              icon,
              children: nextChildren,
            } = withLeadingAutoIcon(children);

            if (icon) {
              return (
                <li className="flex items-start gap-2 leading-7">
                  <span className="mt-[3px] shrink-0">
                    {icon}
                  </span>

                  <span>{nextChildren}</span>
                </li>
              );
            }

            return (
              <li className="leading-7">
                {children}
              </li>
            );
          },

          /**
           * Inline code and block code.
           */
          code: ({
            node,
            className,
            children,
          }) => {
            const rawText = extractText(
              children
            ).replace(/\n$/, "");

            const inline =
              node?.position?.start?.line ===
                node?.position?.end?.line &&
              !className?.includes("language-");

            /**
             * Inline code.
             */
            if (inline) {
              return (
                <button
                  type="button"
                  onClick={() => handleCopy(rawText)}
                  title="Click to copy"
                  className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[12px] transition hover:bg-muted/70"
                >
                  {children}
                </button>
              );
            }

            /**
             * Block code.
             */
            const label = shortLang(className);

            const isCopied =
              copiedText === rawText;

            return (
              <div className="relative my-4 overflow-hidden rounded-2xl border bg-card/40">
                {/* Header */}
                <div className="flex items-center justify-between border-b bg-background/40 px-4 py-2">
                  <div className="text-xs font-medium">
                    {label}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(rawText)}
                    className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition hover:bg-muted"
                    title="Copy code"
                  >
                    {isCopied ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}

                    {isCopied
                      ? "Copied"
                      : "Copy"}
                  </button>
                </div>

                {/* Code content */}
                <pre className="m-0 overflow-auto bg-black/80 p-4 text-sm leading-6">
                  <code className={className}>
                    {children}
                  </code>
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
