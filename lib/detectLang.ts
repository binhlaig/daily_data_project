



// /lib/detectLang.ts
export function detectLang(text: string) {
    const t = (text ?? "").trim();
  
    // --- quick helpers
    const lower = t.toLowerCase();
  
    // 1) CLI / command (even single line)
    const cliStarters = [
      "npm ",
      "pnpm ",
      "yarn ",
      "npx ",
      "node ",
      "bun ",
      "git ",
      "docker ",
      "docker-compose",
      "kubectl ",
      "helm ",
      "curl ",
      "wget ",
      "ssh ",
      "scp ",
      "rsync ",
      "python ",
      "python3 ",
      "pip ",
      "pip3 ",
      "java ",
      "mvn ",
      "gradle ",
      "go ",
      "cargo ",
    ];
    if (cliStarters.some((s) => lower.startsWith(s))) return "bash";
  
    // 2) CSS
    if (
      lower.includes("{") &&
      lower.includes("}") &&
      /(^|\n)\s*[.#]?[a-z0-9_-]+\s*\{/.test(lower)
    ) {
      return "css";
    }
  
    // 3) TypeScript
    if (
      /\binterface\s+\w+/.test(t) ||
      /\btype\s+\w+\s*=/.test(t) ||
      /:\s*(string|number|boolean|any|unknown|never)\b/.test(t) ||
      /\bas\s+\w+/.test(t)
    ) {
      return "ts";
    }
  
    // 4) JavaScript
    if (
      /\b(function|const|let|var)\b/.test(t) ||
      /=>/.test(t) ||
      /\bconsole\.log\b/.test(t)
    ) {
      return "js";
    }
  
    // 5) JSON
    if (
      (t.startsWith("{") && t.endsWith("}")) ||
      (t.startsWith("[") && t.endsWith("]"))
    ) {
      try {
        JSON.parse(t);
        return "json";
      } catch {}
    }
  
    // 6) SQL
    if (/\b(select|insert|update|delete|create|drop|alter)\b/i.test(t)) return "sql";
  
    // default
    return "code";
  }