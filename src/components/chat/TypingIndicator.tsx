"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/motion";
import { MessageCircle } from "lucide-react";

export type TypingIndicatorProps = {
  /** Accessible label announced to assistive tech. */
  label?: string;
  /** Whether to render inside a bubble-like surface. */
  bubble?: boolean;
  className?: string;
};

export function TypingIndicator({
  label = "Assistant is typing",
  bubble = false,
  className,
}: TypingIndicatorProps) {
  const reduced = usePrefersReducedMotion();

  const dots = (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted"
          animate={
            reduced
              ? undefined
              : { opacity: [0.35, 1, 0.35], y: [0, -3, 0] }
          }
          transition={
            reduced
              ? undefined
              : {
                  duration: 0.9,
                  repeat: Infinity,
                  delay: i * 0.14,
                  ease: [0.45, 0, 0.55, 1],
                }
          }
        />
      ))}
    </span>
  );

  const content = (
    <div
      className={`flex items-center gap-3 ${bubble ? "rounded-2xl bg-surface px-4 py-3" : ""} ${className ?? ""}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <MessageCircle size={14} className="text-subtle" aria-hidden="true" />
      {dots}
      <span className="sr-only">{label}</span>
    </div>
  );

  return content;
}

export const TypingDots = TypingIndicator;
export default TypingIndicator;