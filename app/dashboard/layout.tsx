
import React from "react";

import { FloatingDock } from "@/components/ui/floating-dock";
import { dashboardNavItems } from "@/lib/dashboardNavItems";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* ✅ MAIN CONTENT */}
      <div className="flex-1 relative">

        <main className="pb-28 p-4">
          {children}
        </main>

        {/* ✅ FLOATING DOCK DESKTOP */}

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden md:block">
          <FloatingDock items={dashboardNavItems} />
        </div>

        {/* ✅ FLOATING DOCK MOBILE */}

        <div className="fixed bottom-6 right-6 z-50 md:hidden">
          <FloatingDock items={dashboardNavItems} />
        </div>

      </div>

    </div>
  );
}
