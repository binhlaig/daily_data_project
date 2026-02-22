import { SidebarLink, SidebarLinkItem } from "@/components/ui/sidebar";
import {
  IconHome,
  IconArrowDownRight,
  IconArrowUpRight,
  IconChartBar,
  IconSettings,
} from "@tabler/icons-react";

const links: SidebarLinkItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <IconHome />, match: "exact" },
  { label: "Income", href: "/dashboard/income", icon: <IconArrowDownRight className="text-green-500" /> },
  { label: "Outcome", href: "/dashboard/outcome", icon: <IconArrowUpRight className="text-red-500" /> },
  { label: "Reports", href: "/dashboard/reports", icon: <IconChartBar /> },
  { label: "Settings", href: "/dashboard/settings", icon: <IconSettings /> },
];

export function SidebarLinks() {
  return (
    <div className="space-y-1">
      {links.map((l) => (
        <SidebarLink key={l.href} link={l} />
      ))}
    </div>
  );
}
