
"use client";

import toast from "react-hot-toast";
import type { Renderable } from "react-hot-toast";

type Msgs<T> = {
  loading?: Renderable; // ✅ only Renderable
  success?: string | ((data: T) => string) | Renderable;
  error?: string | ((err: any) => string) | Renderable;
};

export function toastPromise6s<T>(task: () => Promise<T>, msgs?: Msgs<T>) {
  const p = (async () => {
    const [result] = await Promise.all([
      task(),
      new Promise((r) => setTimeout(r, 4000)),
    ]);
    return result;
  })();

  return toast.promise(p, {
    loading: msgs?.loading ?? "Loading… ⏳",
    success: msgs?.success ?? "Success ✅",
    error: (e) =>
      typeof msgs?.error === "function"
        ? msgs.error(e)
        : msgs?.error ?? e?.message ?? "Failed ❌",
  });
}