// "use client";

// import React, { useMemo, useState } from "react";
// import Image from "next/image";
// import { useRouter, usePathname } from "next/navigation";
// import Link from "next/link";

// import { authClient } from "@/lib/auth-client";
// import { SidebarLink, SidebarLinkItem } from "@/components/ui/sidebar";

// import {
//   IconHome,
//   IconArrowDownRight,
//   IconArrowUpRight,
//   IconChartBar,
//   IconSettings,
//   IconLogout,
//   IconUserCircle,
// } from "@tabler/icons-react";

// export default function SidebarContent() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [loading, setLoading] = useState(false);

//   // ✅ If you already have a session hook in your authClient, use it.
//   // Many Better Auth setups provide: authClient.useSession()
//   // If your authClient doesn't have it, you can pass user info as props from a server component.
//   const session = (authClient as any).useSession?.() as
//     | { data?: { user?: { name?: string; email?: string; image?: string } } }
//     | undefined;

//   const user = session?.data?.user;

//   const links: SidebarLinkItem[] = useMemo(
//     () => [
//       { label: "Dashboard", href: "/dashboard", icon: <IconHome />, match: "exact" },
//       {
//         label: "Income",
//         href: "/dashboard/income",
//         icon: <IconArrowDownRight className="text-green-500" />,
//       },
//       {
//         label: "Outcome",
//         href: "/dashboard/outcome",
//         icon: <IconArrowUpRight className="text-red-500" />,
//       },
//       { label: "Reports", href: "/dashboard/reports", icon: <IconChartBar /> },
//       { label: "Settings", href: "/dashboard/settings", icon: <IconSettings /> },
//     ],
//     []
//   );

//   async function onLogout() {
//     setLoading(true);
//     try {
//       await authClient.signOut({
//         fetchOptions: {
//           onSuccess: () => {
//             router.push("/sign-in");
//           },
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="flex h-full flex-col">
//       {/* TOP BRAND + USER */}
//       <div className="mb-3 flex items-center gap-3 px-2">
//         {/* Logo */}
//         <Link href="/dashboard" className="flex items-center gap-2">
//           <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
//             <span className="font-bold text-primary">DD</span>
//           </div>
//           <div className="hidden md:block">
//             <div className="text-sm font-semibold leading-4">Daily Data</div>
//             <div className="text-xs text-muted-foreground leading-4">
//               Income & Outcome
//             </div>
//           </div>
//         </Link>
//       </div>

//       {/* USER CARD */}
//       <div className="mb-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/50 backdrop-blur px-3 py-3 mx-2">
//         <div className="flex items-center gap-3">
//           <div className="h-10 w-10 rounded-full overflow-hidden border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
//             {user?.image ? (
//               // If user.image is external, ensure next.config images domains are allowed
//               <Image
//                 src={user.image}
//                 alt="profile"
//                 width={40}
//                 height={40}
//                 className="h-10 w-10 object-cover"
//               />
//             ) : (
//               <IconUserCircle className="h-6 w-6 text-neutral-500" />
//             )}
//           </div>

//           <div className="min-w-0">
//             <div className="text-sm font-medium truncate">
//               {user?.name || "Guest"}
//             </div>
//             <div className="text-xs text-muted-foreground truncate">
//               {user?.email || "—"}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* NAV LINKS */}
//       <div className="flex-1 overflow-auto px-1">
//         <div className="space-y-1">
//           {links.map((l) => (
//             <SidebarLink key={l.href} link={l} />
//           ))}
//         </div>
//       </div>

//       {/* BOTTOM ACTIONS */}
//       <div className="mt-4 px-2 pb-2">
//         <button
//           onClick={onLogout}
//           disabled={loading}
//           className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 px-3 py-2 text-sm"
//           aria-label="Logout"
//         >
//           <IconLogout className="h-5 w-5" />
//           {loading ? "Logging out..." : "Logout"}
//         </button>

//         <p className="mt-2 text-[11px] text-muted-foreground text-center">
//           {pathname.startsWith("/dashboard") ? "Dashboard" : "Daily Data"}
//         </p>
//       </div>
//     </div>
//   );
// }





"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { SidebarLink, SidebarLinkItem, useSidebar } from "@/components/ui/sidebar";

import {
  IconHome,
  IconArrowDownRight,
  IconArrowUpRight,
  IconChartBar,
  IconSettings,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react";

export default function SidebarContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { open, animate } = useSidebar(); // ✅ important
  const showText = animate ? open : true; // ✅ open ဖြစ်မှ text ပြ

  const session = (authClient as any).useSession?.() as
    | { data?: { user?: { name?: string; email?: string; image?: string } } }
    | undefined;

  const user = session?.data?.user;

  const links: SidebarLinkItem[] = useMemo(
    () => [
      { label: "Dashboard", href: "/dashboard", icon: <IconHome />, match: "exact" },
      { label: "Income", href: "/dashboard/income", icon: <IconArrowDownRight className="text-green-500" /> },
      { label: "Outcome", href: "/dashboard/outcome", icon: <IconArrowUpRight className="text-red-500" /> },
      { label: "Reports", href: "/dashboard/reports", icon: <IconChartBar /> },
      { label: "Settings", href: "/dashboard/settings", icon: <IconSettings /> },
    ],
    []
  );

  async function onLogout() {
    setLoading(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => router.push("/sign-in"),
        },
      });
    } finally {
      setLoading(false);
    }
  }
  

  return (
    <div className="flex h-full flex-col">
      {/* TOP BRAND */}
      <div className="mb-3 flex items-center gap-3 px-2">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="font-bold text-primary">DD</span>
          </div>

          {/* ✅ hide when collapsed */}
          {showText && (
            <div>
              <div className="text-sm font-semibold leading-4">Daily Data</div>
              <div className="text-xs text-muted-foreground leading-4">
                Income & Outcome
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* USER CARD */}
      <div className="mb-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/50 backdrop-blur px-3 py-3 mx-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            {user?.image ? (
              <Image
                src={user.image}
                alt="profile"
                width={40}
                height={40}
                className="h-10 w-10 object-cover"
              />
            ) : (
              <IconUserCircle className="h-6 w-6 text-neutral-500" />
            )}
          </div>

          {/* ✅ hide when collapsed */}
          {showText && (
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user?.name || "Guest"}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email || "—"}</div>
            </div>
          )}
        </div>
      </div>

      {/* NAV LINKS */}
      <div className="flex-1 overflow-auto px-1">
        <div className="space-y-1">
          {links.map((l) => (
            <SidebarLink key={l.href} link={l} />
          ))}
        </div>
      </div>

      {/* LOGOUT */}
      <div className="mt-4 px-1 pb-2">
        <button
          onClick={onLogout}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 px-3 py-2 text-sm"
          aria-label="Logout"
          title="Logout"
        >
          <IconLogout className="h-5 w-5" />
          {/* ✅ hide when collapsed */}
          {showText && <span>{loading ? "Logging out..." : "Logout"}</span>}
        </button>
      </div>
    </div>
  );
}
