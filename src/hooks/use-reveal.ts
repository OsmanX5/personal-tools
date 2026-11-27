"use client";

import { useCallback, useRef } from "react";

/**
 * Returns a ref and a `reveal()` that scrolls the ref'd element into view —
 * but only when it is off-screen. On stacked (phone) layouts a detail panel
 * sits below the list that opened it; on desktop it is already visible and
 * nothing moves.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  const reveal = useCallback(() => {
    // Wait a frame so the newly selected content has rendered.
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const { top } = el.getBoundingClientRect();
      if (top > window.innerHeight * 0.6) {
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        el.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "start",
        });
      }
    });
  }, []);

  return [ref, reveal] as const;
}
