"use client";

import { AppIcon } from "@/types/icon";
import { LUCIDE_MAP } from "@/lib/lucideMap";

export default function IconRender({
  icon,
  className="h-4 w-4"
}:{
  icon?:AppIcon | null;
  className?:string;
}) {

  if(!icon) return null;

  if(icon.type==="emoji"){
    return <span className="text-lg">{icon.value}</span>;
  }

  const Icon=LUCIDE_MAP[icon.value];

  if(!Icon) return null;

  return <Icon className={className}/>
}