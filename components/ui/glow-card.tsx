"use client";

import React from "react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

export function GlowCard({
  children,
  className,
  glow = true,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  variant?: "default" | "white";
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      <GlowingEffect
        glow={glow}
        variant={variant}
        blur={10}
        spread={28}
        proximity={40}
        inactiveZone={0.65}
        movementDuration={0.6}
        borderWidth={1}
        disabled={false}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
