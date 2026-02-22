export type DiagramLS = {
    id: string;
    title: string;
    data: {
      nodes: any[];
      edges: any[];
      viewport?: { x: number; y: number; zoom: number };
    };
    createdAt: number;
    updatedAt: number;
  };
  
  const KEY = "binhlaig_diagrams_v1";
  
  export function loadAll(): DiagramLS[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  
  export function saveAll(items: DiagramLS[]) {
    localStorage.setItem(KEY, JSON.stringify(items));
  }
  
  export function upsert(item: DiagramLS) {
    const list = loadAll();
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx >= 0) list[idx] = item;
    else list.unshift(item);
    saveAll(list);
  }
  
  export function remove(id: string) {
    const list = loadAll().filter((x) => x.id !== id);
    saveAll(list);
  }
  
  export function getOne(id: string): DiagramLS | null {
    return loadAll().find((x) => x.id === id) ?? null;
  }