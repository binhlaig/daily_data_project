


import React from "react";
import {
  IconHome,
  IconArrowDownRight,
  IconArrowUpRight,
  IconCalendar,
  IconChartBar,
  IconSettings,
} from "@tabler/icons-react";

export const dashboardNavItems = [

  {
    title: "Dashboard",
    icon: <IconHome className="h-full w-full" />,
    href: "/dashboard",
    match: "exact" as const,
  },

  {
    title: "Income",
    icon: <IconArrowDownRight className="h-full w-full text-green-500" />,
    href: "/dashboard/income",
  },

  {
    title: "Outcome",
    icon: <IconArrowUpRight className="h-full w-full text-red-500" />,
    href: "/dashboard/outcome",
  },

  {
    title: "Code Notes",
    icon: <IconCalendar className="h-full w-full" />,
    href: "/note",
  },

  {
    title: "Reports",
    icon: <IconChartBar className="h-full w-full" />,
    href: "/dashboard/reports",
  },

  {
    title: "Settings",
    icon: <IconSettings className="h-full w-full" />,
    href: "/dashboard/settings",
  },

];
