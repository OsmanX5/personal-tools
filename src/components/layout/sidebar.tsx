"use client";

import Link from "next/link";
import { useState } from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";

/** Desktop sidebar (md and up). Phones use MobileNav from the header instead. */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden h-dvh shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b px-4",
          collapsed ? "justify-center px-2" : "justify-between",
        )}
      >
        {!collapsed && (
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Personal Tools
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="size-5" />
          ) : (
            <PanelLeftClose className="size-5" />
          )}
        </Button>
      </div>
      <SidebarNav collapsed={collapsed} />
    </aside>
  );
}
