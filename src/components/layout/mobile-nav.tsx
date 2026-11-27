"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/sidebar-nav";

/** Hamburger + slide-in navigation for phones and small tablets (below md). */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon-lg"
        className="md:hidden"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>
      <SheetContent title="Navigation" side="left" className="pt-safe pb-safe">
        <div className="flex h-14 items-center border-b px-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="text-lg font-semibold tracking-tight"
          >
            Personal Tools
          </Link>
        </div>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
