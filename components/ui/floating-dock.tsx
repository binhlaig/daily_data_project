"use client";
/**
 * Dashboard-friendly Floating Dock
 * - Uses next/link
 * - Active route highlight
 * - Better mobile behavior (outside click / auto-close)
 * - Glass/blur style for dashboard
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

export type FloatingDockItem = {
  title: string;
  icon: React.ReactNode;
  href: string;
  /** optional: match nested routes. e.g. /dashboard/products matches /dashboard/products/new */
  match?: "exact" | "startsWith";
};

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: FloatingDockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

function isActivePath(
  pathname: string,
  href: string,
  match: "exact" | "startsWith" = "startsWith"
) {
  if (!href) return false;
  if (match === "exact") return pathname === href;
  // startsWith
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href);
}

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return;
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  // close when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div ref={rootRef} className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav-mobile"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className={cn(
              "absolute inset-x-0 bottom-full mb-3 flex flex-col gap-2",
              "items-end"
            )}
          >
            {items.map((item, idx) => {
              const active = isActivePath(
                pathname,
                item.href,
                item.match ?? "startsWith"
              );

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    y: 10,
                    transition: { delay: idx * 0.04 },
                  }}
                  transition={{ delay: (items.length - 1 - idx) * 0.04 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full",
                      "border shadow-sm",
                      "bg-white/80 backdrop-blur dark:bg-neutral-900/70",
                      active
                        ? "border-primary/60 ring-2 ring-primary/20"
                        : "border-neutral-200/70 dark:border-neutral-800/70"
                    )}
                    aria-label={item.title}
                    title={item.title}
                  >
                    <div className="h-5 w-5">{item.icon}</div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border shadow-sm",
          "bg-white/80 backdrop-blur dark:bg-neutral-900/70",
          "border-neutral-200/70 dark:border-neutral-800/70"
        )}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <IconLayoutNavbarCollapse className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const pathname = usePathname();
  const mouseX = useMotionValue(Infinity);

  // Precompute active map to avoid repeated work
  const activeTitle = useMemo(() => {
    const hit = items.find((it) =>
      isActivePath(pathname, it.href, it.match ?? "startsWith")
    );
    return hit?.title ?? "";
  }, [items, pathname]);

  return (
    <motion.nav
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        // dashboard friendly dock
        "mx-auto hidden h-16 items-end gap-4 rounded-2xl px-4 pb-3 md:flex",
        "border shadow-sm",
        "bg-white/70 backdrop-blur dark:bg-neutral-900/60",
        "border-neutral-200/70 dark:border-neutral-800/70",
        className
      )}
      aria-label="Dashboard navigation"
      data-active={activeTitle}
    >
      {items.map((item) => (
        <IconContainer
          mouseX={mouseX}
          key={item.title}
          pathname={pathname}
          {...item}
        />
      ))}
    </motion.nav>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  pathname,
  match = "startsWith",
}: {
  mouseX: MotionValue;
  title: string;
  icon: React.ReactNode;
  href: string;
  pathname: string;
  match?: "exact" | "startsWith";
}) {
  const ref = useRef<HTMLDivElement>(null);

  const active = isActivePath(pathname, href, match);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [42, 84, 42]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [42, 84, 42]);

  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
  const heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);

  const width = useSpring(widthTransform, { mass: 0.12, stiffness: 160, damping: 12 });
  const height = useSpring(heightTransform, { mass: 0.12, stiffness: 160, damping: 12 });

  const widthIcon = useSpring(widthTransformIcon, { mass: 0.12, stiffness: 160, damping: 12 });
  const heightIcon = useSpring(heightTransformIcon, { mass: 0.12, stiffness: 160, damping: 12 });

  const [hovered, setHovered] = useState(false);

  return (
    <Link href={href} aria-label={title} title={title}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-full",
          "border shadow-sm",
          "bg-white/70 backdrop-blur dark:bg-neutral-800/70",
          active
            ? "border-primary/60 ring-2 ring-primary/20"
            : "border-neutral-200/70 dark:border-neutral-700/70"
        )}
      >
        <AnimatePresence>
          {(hovered || active) && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className={cn(
                "absolute -top-8 left-1/2 w-fit rounded-md px-2 py-0.5 text-xs whitespace-pre",
                "border shadow-sm",
                "bg-white/90 dark:bg-neutral-900/90",
                "border-neutral-200/70 dark:border-neutral-800/70",
                active ? "text-primary" : "text-neutral-700 dark:text-white"
              )}
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className={cn(
            "flex items-center justify-center",
            active ? "text-primary" : "text-neutral-700 dark:text-neutral-200"
          )}
        >
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  );
}
