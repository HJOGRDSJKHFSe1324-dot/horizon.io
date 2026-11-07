"use client";

import { ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { usePrefersReducedMotion } from "@/lib/motion";

export type ScrollToBottomProps = {
  /** Whether the button should be shown. */
  visible?: boolean;
  /** Click handler. */
  onClick?: () => void;
  /** Accessible label. */
  label?: string;
  className?: string;
};

export function ScrollToBottom({
  visible = false,
  onClick,
  label = "Scroll to bottom",
  className,
}: ScrollToBottomProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-default bg-surface shadow-md transition duration-150 hover:border-strong hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className ?? ""}`}
    >
      <ArrowDown size={16} className="text-fg" />
    </button>
  );
}

/** Alias matching the requested "ScrollToBottom button" naming. */
export const ScrollToBottomButton = ScrollToBottom;

export default ScrollToBottom;

/**
 * Small helper for chat containers: tracks whether the viewport is away from
 * the bottom and provides a smooth (reduced-motion aware) scroll action.
 */
export function useScrollToBottom(
  containerRef: RefObject<HTMLElement | null>,
  threshold = 96,
): { visible: boolean; scrollToBottom: () => void } {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setVisible(distance > threshold);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : null;
    if (ro) ro.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      if (ro) ro.disconnect();
    };
  }, [containerRef, threshold]);

  const scrollToBottom = () => {
    const el = containerRef.current;
    if (!el) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  };

  return { visible, scrollToBottom };
}