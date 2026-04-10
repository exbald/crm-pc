"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  AlertCircle,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", roles: ["admin", "project_manager", "team_member"] },
  { icon: Users, label: "Contacts", href: "/contacts", roles: ["admin", "project_manager", "team_member"] },
  { icon: FolderKanban, label: "Projects", href: "/projects", roles: ["admin", "project_manager", "team_member"] },
  { icon: CheckSquare, label: "Tasks", href: "/tasks", roles: ["admin", "project_manager", "team_member"] },
  { icon: AlertCircle, label: "Issues", href: "/issues", roles: ["admin", "project_manager", "team_member"] },
  { icon: BarChart3, label: "Reports", href: "/reports", roles: ["admin", "project_manager"] },
  { icon: Settings, label: "Settings", href: "/settings", roles: ["admin"] },
];

interface SidebarProps {
  userRole?: string;
}

export function Sidebar({ userRole = "team_member" }: SidebarProps) {
  const pathname = usePathname();
  const filteredNav = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-neutral-100 bg-white">
      <div className="flex h-14 items-center px-6 border-b border-neutral-100">
        <Link href="/dashboard" className="text-lg font-semibold text-neutral-900">
          Ridgeline
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNav.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-600 border-l-2 border-primary-600"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
