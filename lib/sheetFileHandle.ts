import { get, set, del } from "idb-keyval";

const KEY = "binhlaig_sheet_file_handle_v1";

export async function saveHandle(handle: any) {
  await set(KEY, handle);
}

export async function loadHandle() {
  return await get<any>(KEY);
}

export async function clearHandle() {
  await del(KEY);
}

// Ask permission (read/write)
export async function ensurePermission(handle: any, writable: boolean) {
  if (!handle) return false;

  const opts = { mode: writable ? "readwrite" : "read" } as const;

  if (handle.queryPermission) {
    const q = await handle.queryPermission(opts);
    if (q === "granted") return true;
  }

  if (handle.requestPermission) {
    const r = await handle.requestPermission(opts);
    return r === "granted";
  }

  // fallback
  return true;
} 