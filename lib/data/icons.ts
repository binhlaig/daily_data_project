

import {
    Bug,
    Code2,
    Database,
    Wrench,
    Rocket,
    BarChart3,
    DollarSign,
    Store,
    User,
    Info,
    AlertTriangle,
    Sparkles,
  } from "lucide-react";
  
  export type EmojiIconItem = { label: string; v: string };

  export type LucideIconItem = {
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    name: string; // for saving later if you want (e.g. "Bug")
  };
  
  

  
  export const EMOJI_ICONS: EmojiIconItem[] = [
    { label: "OK", v: "✅ " },
    { label: "Fire", v: "🔥 " },
    { label: "Tip", v: "💡 " },
    { label: "Warn", v: "⚠️ " },
    { label: "Info", v: "ℹ️ " },
    { label: "New", v: "✨ " },
    { label: "Note", v: "📝 " },
    { label: "Pin", v: "📌 " },
    { label: "Star", v: "⭐ " },
  ];
  
  export const LUCIDE_ICONS: LucideIconItem[] = [
    { label: "Bug", name: "Bug", Icon: Bug },
    { label: "Code", name: "Code2", Icon: Code2 },
    { label: "Database", name: "Database", Icon: Database },
    { label: "Fix", name: "Wrench", Icon: Wrench },
    { label: "Rocket", name: "Rocket", Icon: Rocket },
  
    { label: "Chart", name: "BarChart3", Icon: BarChart3 },
    { label: "Money", name: "DollarSign", Icon: DollarSign },
    { label: "Shop", name: "Store", Icon: Store },
    { label: "User", name: "User", Icon: User },
  
    { label: "Info", name: "Info", Icon: Info },
    { label: "Warn", name: "AlertTriangle", Icon: AlertTriangle },
    { label: "New", name: "Sparkles", Icon: Sparkles },
  ];



