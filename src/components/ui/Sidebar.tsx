"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Bell,
  FileText,
  Wallet,
  Settings,
  Shield,
  Archive,
  Clock,
  Plus,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Actions", href: "/actions", icon: Bell, badgeKey: "actions" },
  { label: "Requests", href: "/requests", icon: FileText },
  { label: "Finance", href: "/finance", icon: Wallet, role: "finance" },
  { label: "Governance", href: "/governance", icon: Shield, role: "admin", badgeKey: "governance" },
  { label: "Settings", href: "/settings", icon: Settings, role: "admin" },
  { label: "Archive", href: "/archive", icon: Archive, role: "admin" },
  { label: "Audit Log", href: "/audit", icon: Clock, role: "admin" },
];

interface SidebarProps {
  badges?: Record<string, number>;
  userRoles?: string[];
}

export function Sidebar({ badges = {}, userRoles = [] }: SidebarProps) {
  const pathname = usePathname();

  const hasRole = (role?: string) => {
    if (!role) return true;
    return (
      userRoles.includes(role) ||
      userRoles.includes("super_admin") ||
      (role === "admin" && userRoles.includes("admin"))
    );
  };

  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">
            PR
          </div>
          <span className="font-semibold text-sm tracking-tight">Payrail</span>
        </div>
      </div>

      {/* New Request button */}
      <div className="p-3">
        <Link
          href="/requests/new"
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Request
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.filter((item) => hasRole(item.role)).map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const badge = item.badgeKey ? badges[item.badgeKey] : undefined;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {badge && badge > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        <div className="text-xs text-slate-500">Payrail v0.1.0</div>
      </div>
    </aside>
  );
}
