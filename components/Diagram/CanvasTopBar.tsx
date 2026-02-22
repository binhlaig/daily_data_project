"use client";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Link2, Share2, MoreHorizontal } from "lucide-react";

export default function CanvasTopBar({
  title,
  setTitle,
}: {
  title: string;
  setTitle: (v: string) => void;
}) {
  return (
    <div className="absolute left-0 right-0 top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="flex h-12 items-center gap-2 px-3">
        {/* LEFT */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-sm bg-primary" />
          <div className="text-sm font-semibold">{title || "Untitled File"}</div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => {
                  const next = prompt("Rename file", title || "Untitled File");
                  if (next !== null) setTitle(next);
                }}
              >
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => alert("Export UI (next step)")}
              >
                Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mx-2 hidden md:block">
          <Separator orientation="vertical" className="h-6" />
        </div>

        {/* CENTER */}
        <div className="mx-auto hidden md:flex items-center gap-2">
          <ToggleGroup
            type="single"
            defaultValue="canvas"
            className="rounded-xl border bg-background/60 p-1"
          >
            <ToggleGroupItem value="document" className="h-8 px-3 text-xs">
              Document
            </ToggleGroupItem>
            <ToggleGroupItem value="both" className="h-8 px-3 text-xs">
              Both
            </ToggleGroupItem>
            <ToggleGroupItem value="canvas" className="h-8 px-3 text-xs">
              Canvas
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* RIGHT */}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Link2 className="h-4 w-4" />
          </Button>

          <Button className="h-8 gap-2 rounded-xl">
            <Share2 className="h-4 w-4" />
            Share
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 rounded-xl">
                100% <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>50%</DropdownMenuItem>
              <DropdownMenuItem>75%</DropdownMenuItem>
              <DropdownMenuItem>100%</DropdownMenuItem>
              <DropdownMenuItem>125%</DropdownMenuItem>
              <DropdownMenuItem>150%</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}