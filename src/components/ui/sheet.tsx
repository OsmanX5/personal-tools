"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** A panel that slides in from the screen edge — used for mobile navigation. */
function Sheet(props: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

const SIDE_CLASSES = {
  left: "inset-y-0 left-0 h-full w-72 max-w-5/6 border-r data-open:slide-in-from-left data-closed:slide-out-to-left",
  right:
    "inset-y-0 right-0 h-full w-72 max-w-5/6 border-l data-open:slide-in-from-right data-closed:slide-out-to-right",
} as const;

function SheetContent({
  className,
  children,
  side = "left",
  title,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: keyof typeof SIDE_CLASSES;
  /** Accessible title, visually hidden. */
  title: string;
}) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 duration-200 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col bg-sidebar text-sidebar-foreground shadow-lg duration-200 outline-none data-open:animate-in data-closed:animate-out",
          SIDE_CLASSES[side],
          className,
        )}
        {...props}
      >
        <SheetPrimitive.Title className="sr-only">{title}</SheetPrimitive.Title>
        {children}
        <SheetPrimitive.Close
          render={
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3"
            />
          }
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  );
}

export { Sheet, SheetContent };
