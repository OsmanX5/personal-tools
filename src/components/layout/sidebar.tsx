"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tools } from "@/lib/tools-registry";
import { Badge } from "@/components/ui/badge";
import { Home, PanelLeftClose, PanelLeft } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Personal Tools
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1 hover:bg-sidebar-accent"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {/* Home link */}
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            pathname === "/"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground",
          )}
        >
          <Home className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Home</span>}
        </Link>

        {/* Tool links (grouped) */}
        {Array.from(new Set(tools.map((t) => t.group))).map(
          (group, groupIndex) => {
            const groupTools = tools.filter((t) => t.group === group);
            return (
              <div key={group}>
                {/* Group separator / label */}
                {groupIndex > 0 && (
                  <div
                    className={cn(
                      "mx-2",
                      collapsed
                        ? "my-2 border-t border-sidebar-border"
                        : "mt-3",
                    )}
                  />
                )}
                {!collapsed && (
                  <p
                    className={cn(
                      "px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                      groupIndex === 0 ? "pt-3" : "pt-1",
                    )}
                  >
                    {group}
                  </p>
                )}
                {groupTools.map((tool) => {
                  const isActive = pathname.startsWith(`/${tool.slug}`);
                  const Icon = tool.icon;
                  return (
                    <Link
                      key={tool.slug}
                      href={`/${tool.slug}`}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="flex flex-1 items-center justify-between">
                          {tool.name}
                          {tool.status === "coming-soon" && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Soon
                            </Badge>
                          )}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          },
        )}
      </nav>
    </aside>
  );
}
