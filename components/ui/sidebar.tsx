"use client";

import React, { useEffect, useMemo, useRef, useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";

export interface SidebarLinkItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  match?: "exact" | "startsWith";
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
};

function isActivePath(pathname: string, href: string, match: "exact" | "startsWith" = "startsWith") {
  if (match === "exact") return pathname === href;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href);
}

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return <SidebarContext.Provider value={{ open, setOpen, animate }}>{children}</SidebarContext.Provider>;
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => (
  <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
    {children}
  </SidebarProvider>
);

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();

  return (
    <motion.aside
      className={cn(
        "h-full hidden md:flex md:flex-col shrink-0",
        "border-r border-neutral-200/70 dark:border-neutral-800/70",
        "bg-white/70 backdrop-blur dark:bg-neutral-900/60",
        "px-3 py-4",
        className
      )}
      animate={{
        width: animate ? (open ? "280px" : "64px") : "280px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.aside>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);

  // close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

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
  }, [open, setOpen]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "md:hidden flex h-12 items-center justify-between px-4",
        "border-b border-neutral-200/70 dark:border-neutral-800/70",
        "bg-white/70 backdrop-blur dark:bg-neutral-900/60",
        className
      )}
      {...props}
    >
      <div className="flex justify-end z-20 w-full">
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <IconMenu2 className="text-neutral-800 dark:text-neutral-200" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={cn(
              "fixed inset-0 z-[100] flex flex-col",
              "bg-white dark:bg-neutral-900",
              "p-6",
              className
            )}
          >
            <div className="flex items-center justify-end">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
              >
                <IconX />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-auto">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: SidebarLinkItem;
  className?: string;
}) => {
  const pathname = usePathname();
  const { open, animate } = useSidebar();

  const active = useMemo(
    () => isActivePath(pathname, link.href, link.match ?? "startsWith"),
    [pathname, link.href, link.match]
  );

  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center gap-2 rounded-xl px-2 py-2",
        "transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800/70",
        className
      )}
      aria-label={link.label}
      title={link.label}
      {...props}
    >
      <span className={cn("shrink-0", active ? "text-primary" : "")}>{link.icon}</span>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          "text-sm whitespace-pre",
          "group-hover:translate-x-1 transition duration-150"
        )}
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
