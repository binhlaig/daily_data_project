"use client";

import React, { memo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { animate } from "motion/react";

interface GlowingEffectProps {
  blur?: number;
  /** center deadzone ratio (0-1). Higher = bigger inactive center */
  inactiveZone?: number;
  /** activation margin outside element */
  proximity?: number;
  /** glow arc spread degrees */
  spread?: number;
  variant?: "default" | "white";
  glow?: boolean;
  className?: string;
  /** if true -> effect off */
  disabled?: boolean;
  movementDuration?: number;
  borderWidth?: number;
  /** reduce work on low-power devices */
  fpsLimit?: number; // NEW
}

const GlowingEffect = memo(
  ({
    blur = 0,
    inactiveZone = 0.65,
    proximity = 24,
    spread = 26,
    variant = "default",
    glow = true,
    className,
    movementDuration = 0.8,
    borderWidth = 1,
    disabled = false, // ✅ default enabled (dashboard use)
    fpsLimit = 60, // NEW
  }: GlowingEffectProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPosition = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number>(0);
    const lastTickRef = useRef<number>(0);

    const handleMove = useCallback(
      (e?: PointerEvent | MouseEvent | { x: number; y: number }) => {
        const element = containerRef.current;
        if (!element) return;

        // FPS limit (simple throttle)
        const now = performance.now();
        const minInterval = 1000 / Math.max(1, fpsLimit);
        if (now - lastTickRef.current < minInterval) return;
        lastTickRef.current = now;

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        animationFrameRef.current = requestAnimationFrame(() => {
          const el = containerRef.current;
          if (!el) return;

          const { left, top, width, height } = el.getBoundingClientRect();
          const mouseX = (e as any)?.x ?? lastPosition.current.x;
          const mouseY = (e as any)?.y ?? lastPosition.current.y;

          if (e) lastPosition.current = { x: mouseX, y: mouseY };

          // If element is tiny, skip
          if (width < 20 || height < 20) return;

          const centerX = left + width * 0.5;
          const centerY = top + height * 0.5;

          // deadzone at center
          const distanceFromCenter = Math.hypot(mouseX - centerX, mouseY - centerY);
          const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

          if (distanceFromCenter < inactiveRadius) {
            el.style.setProperty("--active", "0");
            return;
          }

          const isActive =
            mouseX > left - proximity &&
            mouseX < left + width + proximity &&
            mouseY > top - proximity &&
            mouseY < top + height + proximity;

          el.style.setProperty("--active", isActive ? "1" : "0");
          if (!isActive) return;

          const currentAngle = parseFloat(el.style.getPropertyValue("--start")) || 0;

          const targetAngle =
            (180 * Math.atan2(mouseY - centerY, mouseX - centerX)) / Math.PI + 90;

          // shortest rotation
          const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
          const newAngle = currentAngle + angleDiff;

          // Avoid stacking animations too aggressively
          animate(currentAngle, newAngle, {
            duration: movementDuration,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (value) => {
              el.style.setProperty("--start", String(value));
            },
          });
        });
      },
      [inactiveZone, proximity, movementDuration, fpsLimit]
    );

    useEffect(() => {
      if (disabled) return;

      // respect reduced motion
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) return;

      const onScroll = () => handleMove();
      const onPointerMove = (e: PointerEvent) => handleMove(e);

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("pointermove", onPointerMove, { passive: true });

      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pointermove", onPointerMove);
      };
    }, [handleMove, disabled]);

    return (
      <>
        {/* fallback border/glow when "glow" true but effect disabled */}
        <div
          className={cn(
            "pointer-events-none absolute -inset-px rounded-[inherit] border opacity-0 transition-opacity",
            glow && "opacity-100",
            variant === "white" ? "border-white/40" : "border-neutral-200/60 dark:border-neutral-800/70",
            disabled ? "block" : "hidden"
          )}
        />

        {/* animated effect */}
        <div
          ref={containerRef}
          style={
            {
              "--blur": `${blur}px`,
              "--spread": spread,
              "--start": "0",
              "--active": "0",
              "--glowingeffect-border-width": `${borderWidth}px`,
              "--repeating-conic-gradient-times": "5",
              "--gradient":
                variant === "white"
                  ? `repeating-conic-gradient(
                      from 236.84deg at 50% 50%,
                      rgba(255,255,255,0.9),
                      rgba(255,255,255,0.9) calc(25% / var(--repeating-conic-gradient-times))
                    )`
                  : `radial-gradient(circle, #dd7bbb 10%, #dd7bbb00 20%),
                    radial-gradient(circle at 40% 40%, #d79f1e 5%, #d79f1e00 15%),
                    radial-gradient(circle at 60% 60%, #5a922c 10%, #5a922c00 20%), 
                    radial-gradient(circle at 40% 60%, #4c7894 10%, #4c789400 20%),
                    repeating-conic-gradient(
                      from 236.84deg at 50% 50%,
                      #dd7bbb 0%,
                      #d79f1e calc(25% / var(--repeating-conic-gradient-times)),
                      #5a922c calc(50% / var(--repeating-conic-gradient-times)), 
                      #4c7894 calc(75% / var(--repeating-conic-gradient-times)),
                      #dd7bbb calc(100% / var(--repeating-conic-gradient-times))
                    )`,
            } as React.CSSProperties
          }
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity",
            glow ? "opacity-100" : "opacity-0",
            blur > 0 && "blur-[var(--blur)]",
            disabled && "hidden",
            className
          )}
        >
          <div
            className={cn(
              "glow rounded-[inherit]",
              'after:content-[""] after:rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))]',
              "after:[border:var(--glowingeffect-border-width)_solid_transparent]",
              "after:[background:var(--gradient)] after:[background-attachment:fixed]",
              "after:opacity-[var(--active)] after:transition-opacity after:duration-200",
              "after:[mask-clip:padding-box,border-box]",
              "after:[mask-composite:intersect]",
              "after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]"
            )}
          />
        </div>
      </>
    );
  }
);

GlowingEffect.displayName = "GlowingEffect";
export { GlowingEffect };
