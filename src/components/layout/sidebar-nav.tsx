"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { tools } from "@/lib/tools-registry";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const groups = Array.from(new Set(tools.map((t) => t.group)));

const LINK_BASE =
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

/** The grouped tool links, shared by the desktop sidebar and the mobile sheet. */
export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  function linkClass(active: boolean) {
    return cn(
      LINK_BASE,
      // Taller touch targets on phones.
      "max-md:py-2.5",
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground",
    );
  }

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-2">
      <Link
        href="/"
        onClick={onNavigate}
        className={linkClass(pathname === "/")}
        title={collapsed ? "Home" : undefined}
      >
        <Home className="h-4 w-4 shrink-0" />
        {!collapsed && <span>Home</span>}
      </Link>

      {groups.map((group, groupIndex) => (
        <div key={group}>
          {groupIndex > 0 && (
            <div
              className={cn(
                "mx-2",
                collapsed ? "my-2 border-t border-sidebar-border" : "mt-3",
              )}
            />
          )}
          {!collapsed && (
            <p
              className={cn(
                "px-3 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase",
                groupIndex === 0 ? "pt-3" : "pt-1",
              )}
            >
              {group}
            </p>
          )}
          {tools
            .filter((t) => t.group === group)
            .map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.slug}
                  href={`/${tool.slug}`}
                  onClick={onNavigate}
                  title={collapsed ? tool.name : undefined}
                  className={linkClass(pathname.startsWith(`/${tool.slug}`))}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <span className="flex flex-1 items-center justify-between">
                      {tool.name}
                      {tool.status === "coming-soon" && (
                        <Badge variant="secondary" className="ml-2">
                          Soon
                        </Badge>
                      )}
                    </span>
                  )}
                </Link>
              );
            })}
        </div>
      ))}
    </nav>
  );
}
